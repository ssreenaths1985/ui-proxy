import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../../configs/request.config'
import { IPaginatedApiResponse } from '../../models/paginatedApi.model'
import {
  EPlaylistUpsertTypes,
  IPlaylist,
  IPlaylistCreateRequest,
  IPlaylistParams,
  IPlaylistSbExtResponse,
  // IPlaylistShareRequest,
  // IPlayListUpdateRequest,
  // IPlaylistUpsertRequest
} from '../../models/playlist.model'
import {
  formContentRequestObj,
  formPlaylistRequestObj,
  formPlaylistupdateObj,
  transformToPlaylistV2,
  transformToPlaylistV3,
  // transformToSbExtDeleteRequest,
  transformToSbExtPatchRequest,
  transformToSbExtSyncRequest,
  // transformToSbExtUpsertRequest
} from '../../service/playlist'
import { CONSTANTS } from '../../utils/env'
import { getStringifiedQueryParams } from '../../utils/helpers'
import { logError } from '../../utils/logger'
import { ERROR } from '../../utils/message'
import { extractUserIdFromRequest, extractUserNameFromRequest } from '../../utils/requestExtract'

const API_END_POINTS = {
  playlist: (userId: string, playlistId: string) =>
    `${CONSTANTS.PLAYLIST_API_BASE}/v1/users/${userId}/playlist/${playlistId}`,
  playlistV1: (userId: string) => `${CONSTANTS.PLAYLISTV1_API_BASE}/v1/users/${userId}`,
}

const GENERAL_ERROR_MSG = 'Failed due to unknown reason'

async function sharePlaylist(
  _userId: string,
  playlistId: string,
  request: { playlist_title: string, versionKey: string, users: string[] },
  // tslint:disable-next-line: no-any
  auth: any
) {
  /* for sharing a playlist with another user */
  const url = `https://igot-dev.in/apis/proxies/v8/action/content/v3/update/${playlistId}`
  const body = {
    request: {
      content: {
        name: request.playlist_title,
        sharedWith: request.users,
        versionKey: request.versionKey,
      },
    },
  }

  return axios({
    ...axiosRequestConfig,
    data: body,
    headers: {
      Authorization: auth,
      org: 'dopt',
      rootOrg: 'igot',
    },
    method: 'PATCH',
    url,
  })
}

async function getPlaylistsAllTypes(
  userId: string,
  rootOrg: string,
  params: IPlaylistParams | null
) {
  /* function to get user, shared, and pending playlists*/
  try {
    const playlistsPromise = await axios.get(
      `${API_END_POINTS.playlistV1(userId)}/playlists`,
      { ...axiosRequestConfig, headers: { rootOrg }, params }
    ) /* get request to fetch user and shared playlists*/

    const pendingPlaylistsPromise = await axios.get(
      `${API_END_POINTS.playlistV1(userId)}/shared-playlist`,
      { ...axiosRequestConfig, headers: { rootOrg }, params }
    ) /* get request to fetch pending playlists awaiting acceptance or refusal*/
    const playlists: IPlaylistSbExtResponse = {
      result: {
        response: playlistsPromise.data,
      },
    }
    const pendingPlaylists: IPlaylistSbExtResponse = {
      result: {
        response: pendingPlaylistsPromise.data,
      },
    }
    /* content.shared_by is null for user playlists */
    return {
      data: {
        pending: pendingPlaylists.result.response.map(transformToPlaylistV2),
        share: playlists.result.response
          .filter((content) => content.shared_by)
          .map(transformToPlaylistV2),
        user: playlists.result.response
          .filter((content) => !content.shared_by)
          .map(transformToPlaylistV2),
      },
      error: undefined,
    }
  } catch (err) {
    return { data: undefined, error: err }
  }
}

export async function getPlaylist(userId: string, playlistId: string, rootOrg: string) {
  const response = await axios.get(`${API_END_POINTS.playlistV1(userId)}/playlists/${playlistId}`, {
    ...axiosRequestConfig,
    headers: { rootOrg },
  })
  return transformToPlaylistV3(response.data, playlistId)
}

async function getPlaylists(userId: string, rootOrg: string): Promise<IPlaylist[]> {
  /* get pending playlists */
  const response = await axios.get(`${API_END_POINTS.playlistV1(userId)}/shared-playlist`, {
    ...axiosRequestConfig,
    headers: { rootOrg },
  })
  const playlistSbExtResponse: IPlaylistSbExtResponse = {
    result: {
      response: response.data,
    },
  }
  if (
    playlistSbExtResponse &&
    playlistSbExtResponse.result &&
    playlistSbExtResponse.result.response &&
    playlistSbExtResponse.result.response.length
  ) {
    return playlistSbExtResponse.result.response.map(transformToPlaylistV2)
  }

  return []
}

export const playlistApi = Router()

playlistApi.get('/sync/:playlistId', async (req, res) => {
  const playlistId = req.params.playlistId
  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }

    const response = await axios({
      method: 'GET',
      url: `${API_END_POINTS.playlistV1(userId)}/playlists/${playlistId}/sync-info`,
      ...axiosRequestConfig,
      headers: {
        rootOrg,
      },
    })

    const result = transformToSbExtSyncRequest(response.data)
    const url = `${API_END_POINTS.playlistV1(userId)}/playlists/${playlistId}/contents`

    await axios({
      ...axiosRequestConfig,
      data: result,
      headers: {
        rootOrg,
      },
      method: 'POST',
      url,
    })
    res.send(result.content)
    return
  } catch (err) {
    logError('SYNC PLAYLIST ERROR >', err)
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.get('/recent', async (req, res) => {
  /* get recent contents added to any playlist */
  const userId = extractUserIdFromRequest(req)
  try {
    const pageState = req.query.pageState
    const pageSize = req.query.pageSize || 50
    const isCompleted = req.query.isCompleted || false
    const sourceFields = req.query.sourceFields
    const org = req.header('org')
    const rootOrg = req.header('rootOrg')
    if (!org || !rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const queryParams = getStringifiedQueryParams({
      isCompleted,
      pageSize,
      pageState,
      sourceFields,
    })
    const response = await axios({
      method: 'GET',
      url: `${API_END_POINTS.playlistV1(userId)}/playlist-contents?${queryParams}`,
      ...axiosRequestConfig,
      headers: {
        rootOrg,
      },
    })
    const result: IPaginatedApiResponse = {
      contents: response.data.recentContents,
      hasMore: false,
    }
    res.send(result)
  } catch (err) {
    logError('RECENT PLAYLIST CONTENTS FETCH ERROR >', err)
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.post('/accept/:playlistId', async (req, res) => {
  /* accept a pending playlist */
  const playlistId = req.params.playlistId
  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const playlists = await getPlaylists(userId, rootOrg)
    const playlist = playlists.find((p: IPlaylist) => p.id === playlistId)
    if (playlist) {
      const url = `${API_END_POINTS.playlistV1(userId)}/shared-playlists/${playlistId}/accept`
      const response = await axios({
        ...axiosRequestConfig,
        data: {},
        headers: {
          rootOrg,
        },
        method: 'POST',
        url,
      })

      res.status(response.status).send(true)
      return
    }

    res.status(404).send()
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.post('/reject/:playlistId', async (req, res) => {
  /* axios request to reject a pending playlist */
  const playlistId = req.params.playlistId
  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const url = `${API_END_POINTS.playlistV1(userId)}/shared-playlists/${playlistId}/reject`
    const response = await axios({
      ...axiosRequestConfig,
      data: {},
      headers: {
        rootOrg,
      },
      method: 'POST',
      url,
    })
    res.status(response.status).send()
    return
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.post('/share/:playlistId', async (req, res) => {
  /* post request to share a playlist with an user */
  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const request = req.body
    const playlistId = req.params.playlistId
    const auth = req.header('Authorization')
    const response = await sharePlaylist(userId, playlistId, request, auth)
    res.status(response.status).send()
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.get('/:type/:playlistId', async (req, res) => {
  /* get request to fetch details of a playlist by its playlistId */

  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const { playlistId } = req.params
    const params = req.query
    const response = await axios({
      method: 'GET',
      url: `${API_END_POINTS.playlistV1(userId)}/playlists/${playlistId}`,
      ...axiosRequestConfig,
      headers: {
        rootOrg,
      },
      params,
    })
    res.status(response.status).send(transformToPlaylistV3(response.data, playlistId))
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.delete('/:playlistId', async (req, res) => {
  /* axios request to delete an entire playlist */
  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const playlistId = req.params.playlistId
    const url = `${API_END_POINTS.playlistV1(userId)}/playlists/${playlistId}`
    const response = await axios({
      ...axiosRequestConfig,
      headers: {
        rootOrg,
      },
      method: 'DELETE',
      url,
    })
    res.status(response.status).send(true)
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.get('/', async (req, res) => {
  /* get all playlists of an user */
  const userId = req.query.wid || extractUserIdFromRequest(req)
  const rootOrg = req.header('rootOrg')
  if (!rootOrg) {
    res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
    return
  }
  const params = req.query
  const allPlaylists = await getPlaylistsAllTypes(userId, rootOrg, params)

  if (allPlaylists.error) {
    const err = allPlaylists.error
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
    return
  }
  res.send(allPlaylists.data)
})

playlistApi.patch('/:playlistId', async (req, res) => {
  /* Patch request to update the title of a playlist */
  try {
    const request = req.body
    const rootOrg = req.header('rootOrg')
    const auth = req.header('Authorization')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const playlistId = req.params.playlistId
    const url = `https://igot-dev.in/apis/proxies/v8/action/content/v3/update/${playlistId}`
    const response = await axios({
      ...axiosRequestConfig,
      data: formPlaylistupdateObj(request),
      headers: {
        Authorization: auth,
        org: 'dopt',
        rootOrg: 'igot',
      },
      method: 'PATCH',
      url,
    })

    const urll = `https://igot-dev.in/apis/proxies/v8/action/content/v3/hierarchy/update`

    const response1 = await axios({
      ...axiosRequestConfig,
      data: transformToSbExtPatchRequest(request, playlistId),
      headers: {
        Authorization: auth,
        org: 'dopt',
        rootOrg: 'igot',
      },
      method: 'PATCH',
      url: urll,
    })
    res.status(response.status || response1.status).send()
  } catch (err) {
    logError(err)
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.post('/create', async (req, res) => {
  /*Post request to create a playlist */

  const userId = extractUserIdFromRequest(req)
  const userName = extractUserNameFromRequest(req)
  try {
    const request: IPlaylistCreateRequest = req.body
    const rootOrg = req.header('rootOrg')
    const auth = req.header('Authorization')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const url = `https://igot-dev.in/apis/proxies/v8/action/content/v3/create`
    const response = await axios({
      ...axiosRequestConfig,
      data: formPlaylistRequestObj(request, userId, userName),
      headers: {
        Authorization: auth,
        org: 'dopt',
        rootOrg: 'igot',
      },
      method: 'POST',
      url,
    })

    const urll = `https://igot-dev.in/apis/proxies/v8/action/content/v3/hierarchy/update`

    const response1 = await axios({
      ...axiosRequestConfig,
      data: formContentRequestObj(request, response.data, userId),
      headers: {
        Authorization: auth,
        org: 'dopt',
        rootOrg: 'igot',
      },
      method: 'PATCH',
      url: urll,
    })

    res.status(response1.status).send()
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.post('/:playlistId/:type', async (req, res) => {
  /*Post request add content or delete content from a playlist */
  // const userId = extractUserIdFromRequest(req)
  const auth = req.header('Authorization')
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    /* axios request to add/delete playlist content is done*/
    const type = req.params.type
    const playlistId = req.params.playlistId

    const url = `https://igot-dev.in/apis/proxies/v8/action/content/v3/hierarchy/${playlistId}?mode=edit`
    const response1 = await axios({
      ...axiosRequestConfig,
      headers: {
        Authorization: auth,
        org: 'dopt',
        rootOrg: 'igot',
      },
      method: 'GET',
      url,
    })

    const urll = `https://igot-dev.in/apis/proxies/v8/action/content/v3/hierarchy/update`

    const hierarchy = {}
    const childern = response1.data.result.content.childNodes
    if (type === EPlaylistUpsertTypes.add) {
      childern.push(req.body.contentIds[0])
    } else if (type === EPlaylistUpsertTypes.delete) {
      const index = childern.indexOf(req.body.contentIds[0])
      if (index > -1) {
        childern.splice(index, 1)
      }
    }

    hierarchy[playlistId] = {
      children: childern,
      contentType: 'Collection',
      root: true,
    }

    const obj = {
      request: {
        data: {
          hierarchy,
          nodesModified: {},
        },
      },
    }

    const response = await axios({
      ...axiosRequestConfig,
      data: obj,
      headers: {
        Authorization: auth,
        org: 'dopt',
        rootOrg: 'igot',
      },
      method: 'PATCH',
      url: urll,
    })
    res.status(response.status).send(response.data)

    return
    // } else if (type === EPlaylistUpsertTypes.delete) {
    //   const url = `${API_END_POINTS.playlistV1(userId)}/playlists/${playlistId}/contents`
    //   const response = await axios({
    //     ...axiosRequestConfig,
    //     data: transformToSbExtDeleteRequest(request),
    //     headers: {
    //       rootOrg,
    //     },
    //     method: 'DELETE',
    //     url,
    //   })
    //   res.status(response.status).send()
    //   return
    // }
    // res.status(500).send()
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})

playlistApi.get('/:type', async (req, res) => {
  /*get pending playlists*/
  const userId = extractUserIdFromRequest(req)
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const playlists = await getPlaylists(userId, rootOrg)
    res.send(playlists)
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || {
        error: GENERAL_ERROR_MSG,
      })
  }
})
