import axios from 'axios'
import { Router } from 'express'
import { axiosRequestConfig } from '../configs/request.config'
import { CONSTANTS } from '../utils/env'
import { logError, logInfo } from '../utils/logger'
import { ERROR } from '../utils/message'
import { extractUserId, extractUserIdFromRequest } from '../utils/requestExtract'
import { extractUserToken } from '../utils/requestExtract'

const _                 = require('lodash')

const unknown = 'Connections Apis:- Failed due to unknown reason'
const apiEndpoints = {
  detail: `${CONSTANTS.USER_PROFILE_API_BASE}/user/multi-fetch/wid`,
  getConnectionEstablishedData: `${CONSTANTS.KONG_API_BASE}/connections/profile/fetch/established`,
  getConnectionRequestsData: `${CONSTANTS.KONG_API_BASE}/connections/profile/fetch/requested`,
  getConnectionRequestsReceivedData: `${CONSTANTS.KONG_API_BASE}/connections/profile/fetch/requests/received`,
  getConnectionSuggestsData: `${CONSTANTS.KONG_API_BASE}/connections/profile/find/suggests`,
  getUserOrgName: `${CONSTANTS.KONG_API_BASE}/user/v1/search`,
  getUserRegistryById: (userId: string) => `${CONSTANTS.NETWORK_HUB_SERVICE_BACKEND}/v1/user/search/profile?userId=${userId}`,
  postConnectionAddData: `${CONSTANTS.KONG_API_BASE}/connections/add`,
  postConnectionRecommendationData: `${CONSTANTS.KONG_API_BASE}/connections/profile/find/recommended`,
  postConnectionUpdateData: `${CONSTANTS.KONG_API_BASE}/connections/update`,
}

export const connectionsV2Api = Router()

connectionsV2Api.get('/v2/connections/requested', async (req, res) => {
  try {
    const rootOrg = req.headers.rootorg
    const userId = extractUserIdFromRequest(req)

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userId) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }
    const response = await axios.get(apiEndpoints.getConnectionRequestsData, {
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
        rootOrg,
        userId,
         // tslint:disable-next-line: all
         'x-authenticated-user-token': extractUserToken(req),
      },
    })
    res.send((response.data))

  } catch (err) {
    logError('CONNECTIONS REQUESTS ERROR> ', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.get('/v2/connections/requests/received', async (req, res) => {
  try {
    const rootOrg = req.headers.rootorg
    const userId = extractUserIdFromRequest(req)

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userId) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }
    const response = await axios.get(apiEndpoints.getConnectionRequestsReceivedData, {
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
        rootOrg,
        userId,
         // tslint:disable-next-line: all
         'x-authenticated-user-token': extractUserToken(req),
      },
    })
    res.send((response.data))

  } catch (err) {
    logError('CONNECTIONS REQUESTS ERROR> ', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.get('/v2/connections/established', async (req, res) => {
  try {
    const rootOrg = req.headers.rootorg
    const userId = extractUserIdFromRequest(req)

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userId) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }
    const response = await axios.get(apiEndpoints.getConnectionEstablishedData, {
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
        rootOrg,
        userId,
        // tslint:disable-next-line: all
        'x-authenticated-user-token': extractUserToken(req),
      },
    })
    res.send((response.data))

  } catch (err) {
    logError('CONNECTIONS ERROR', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.get('/v2/connections/established/:id', async (req, res) => {
  try {
    const rootOrg = req.headers.rootorg
    const userId = req.params.id

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userId) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }
    const response = await axios.get(apiEndpoints.getConnectionEstablishedData, {
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
        rootOrg,
        userId,
        // tslint:disable-next-line: all
        'x-authenticated-user-token': extractUserToken(req),
      },
    })
    res.send((response.data))

  } catch (err) {
    logError('CONNECTIONS ERROR', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.get('/v2/connections/suggests', async (req, res) => {
  try {
    const rootOrg = req.headers.rootorg
    const userId = extractUserId(req)

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userId) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }
    const response = await axios.get(apiEndpoints.getConnectionSuggestsData, {
      ...axiosRequestConfig,
      headers: {
        Authorization: CONSTANTS.SB_API_KEY,
        rootOrg,
        userId,
         // tslint:disable-next-line: all
         'x-authenticated-user-token': extractUserToken(req),
      },
    })
    res.send((response.data))

  } catch (err) {
    logError('SUGGESTS ERROR >', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.post('/v2/add/connection', async (req, res) => {
  try {
    const rootOrg = req.header('rootorg')
    const userIdFrom = extractUserIdFromRequest(req)
    const userNameFrom = req.body.userNameFrom
    const userDepartmentFrom = req.body.userDepartmentFrom
    const userIdTo = req.body.userIdTo
    const userNameTo = req.body.userNameTo
    const userDepartmentTo = req.body.userDepartmentTo

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userIdFrom || !userIdTo || !userNameFrom || !userDepartmentFrom || !userNameTo || !userDepartmentTo) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }

    const body = {
      userDepartmentFrom,
      userIdFrom,
      userNameFrom,

      userDepartmentTo,
      userIdTo,
      userNameTo,

    }
    const response = await axios.post(
      apiEndpoints.postConnectionAddData,
      body,
      {
        ...axiosRequestConfig,
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
          rootOrg,
          // tslint:disable-next-line: all
          'x-authenticated-user-token': extractUserToken(req),
        },
      }
    )
    res.send(response.data)

  } catch (err) {
    logError('ADD CONNECTION ERROR > ', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.post('/v2/update/connection', async (req, res) => {
  try {
    const rootOrg = req.header('rootorg')
    const userNameFrom = req.body.userNameFrom
    const userDepartmentFrom = req.body.userDepartmentFrom
    const userIdFrom = extractUserIdFromRequest(req)

    const userNameTo = req.body.userNameTo
    const userDepartmentTo = req.body.userDepartmentTo
    const userIdTo = req.body.userIdTo

    const status = req.body.status

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userIdFrom || !userIdTo || !userNameFrom || !userDepartmentFrom || !userNameTo || !userDepartmentTo || !status) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }
    const body = {
      status,

      userDepartmentFrom,
      userIdFrom,
      userNameFrom,

      userDepartmentTo,
      userIdTo,
      userNameTo,
    }
    const response = await axios.post(
      apiEndpoints.postConnectionUpdateData,
      body,
      {
        ...axiosRequestConfig,
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
          rootOrg,
          // tslint:disable-next-line: all
          'x-authenticated-user-token': extractUserToken(req),
        },
      }
    )
    res.send(response.data)

  } catch (err) {
    logError('UPDATE CONNECTION ERROR > ', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.post('/v2/connections/recommended', async (req, res) => {
  try {
    const body = req.body
    const rootOrg = req.header('rootorg')
    const userId = extractUserId(req)

    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    if (!userId) {
      res.status(400).send(ERROR.GENERAL_ERR_MSG)
      return
    }

    const response = await axios.post(
      apiEndpoints.postConnectionRecommendationData,
      body,
      {
        ...axiosRequestConfig,
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
          rootOrg,
          userId,
           // tslint:disable-next-line: all
           'x-authenticated-user-token': extractUserToken(req),
        },
      }
    )
    res.send(response.data)

  } catch (err) {
    logError('RECOMMENDED ERROR > ', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})

connectionsV2Api.post('/v2/connections/recommended/userDepartment', async (req, res) => {
  try {
    let usrDept = ''
    // tslint:disable-next-line: no-any
    const userDepartment: any = []
    const rootOrg = req.header('rootorg')
    const userId = extractUserId(req)
    if (!rootOrg) {
        res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
        return
    }
    if (!userId) {
        res.status(400).send(ERROR.GENERAL_ERR_MSG)
        return
    }

    /**
     * @author: Suvajit
     * Step 1: Gets the User Department using search api
     * Step 2: Loops through and gets all the dept
     * Step 3: Send the data to recommandation api
     */

    const body = {
        request : {
            filters : {
                userId,
            },
            query: '',
        },
    }
    const url = `${apiEndpoints.getUserOrgName}`
    const responseDetails = await axios.post(
        url,
        body,
        {
            ...axiosRequestConfig,
            headers: {
                Authorization: CONSTANTS.SB_API_KEY,
                'Content-Type': 'application/json',
                'X-Authenticated-User-Token': extractUserToken(req),
            },
        }
    )
    logInfo('responseDetails from /search/ : ', JSON.stringify(responseDetails.data))

    // tslint:disable-next-line: no-any
    const orgData: any = []
    const contentData = responseDetails.data.result.response.content
    // tslint:disable-next-line: no-any
    contentData.forEach((content: any) => {
        const orgs = content.organisations
        // tslint:disable-next-line: no-any
        orgs.forEach((org: any) => {
            orgData.push(org)
        })
    })
    if (_.isEmpty(orgData)) {
        res.status(400).send(ERROR.ERROR_NO_DEPT_DATA)
        return
    }

    // tslint:disable-next-line: no-any
    orgData.forEach((element: any) => {
        userDepartment.push(element.orgName)
    })

    usrDept = userDepartment || 'igot'

    const reqtoApi = {
      offset: 0,
      search: [
        {
          field: 'employmentDetails.departmentName',
          values: usrDept,
        },
      ],
      size: 5,
    }

    const response = await axios.post(
      apiEndpoints.postConnectionRecommendationData,
      reqtoApi,
      {
        ...axiosRequestConfig,
        headers: {
          Authorization: CONSTANTS.SB_API_KEY,
          rootOrg,
          userId,
           // tslint:disable-next-line: all
           'x-authenticated-user-token': extractUserToken(req),
        },
      }
    )
    res.send(response.data)

  } catch (err) {
    logError('RECOMMENDED ERROR > ', err)
    res.status((err && err.response && err.response.status) || 500).send(
      (err && err.response && err.response.data) || {
        error: unknown,
      }
    )
  }
})
