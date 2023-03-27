import axios from 'axios'
import { Router } from 'express'
import request from 'request'
import { axiosRequestConfig } from '../../configs/request.config'
import { CONSTANTS } from '../../utils/env'
import { logError, logInfo } from '../../utils/logger'
import { ERROR } from '../../utils/message'
import { extractUserIdFromRequest } from '../../utils/requestExtract'
import { getUserByEmail } from '../discussionHub/users'
import { createDiscussionHubUser } from '../discussionHub/writeApi'
import { getRoles , getUserStatus} from '../portal-v3'
import { getProfileStatus } from './profile-registry'

export const detailsApi = Router()

const API_END_POINTS = {
  detail: `${CONSTANTS.USER_PROFILE_API_BASE}/user/multi-fetch/wid`,
  emailId: `${CONSTANTS.USER_PROFILE_API_BASE}/user/multi-fetch/email`,
  managerDetails: `${CONSTANTS.USER_PROFILE_API_BASE}/user`,
  pidProfile: `${CONSTANTS.USER_PROFILE_API_BASE}/user/get-update`,
}

detailsApi.get('/', async (req, res) => {
  try {
    const userId = extractUserIdFromRequest(req)
    const rootOrg = req.header('rootOrg') || ''
    const org = req.header('org') || ''
    if (!org || !rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const tncStatus = true
    const roles = await getRoles(userId)
    const profileDetailsStatus = await getProfileStatus(userId)
    const isActive = await getUserStatus(userId)
    res.json({
      group: [],
      isActive,
      profileDetailsStatus,
      roles,
      tncStatus,
    })
  } catch (err) {
    res.status((err && err.response && err.response.status) || 500).send(err)
    return
  }
})

// detailsApi.get('/wtoken', async (req, res) => {
//   try {
//     const rootOrg = req.header('rootOrg') || ''
//     const org = req.header('org') || ''
//     if (!org || !rootOrg) {
//       res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
//       return
//     }
//     // const kcToken = extractUserToken(req)
//     // const url = API_END_POINTS.pidProfile
//     // tslint:disable-next-line: no-commented-code
//     // const body = {
//     // json: {
//     // token: kcToken,
//     // },
//     // }
//     // const options: request.CoreOptions = {
//     //   headers: {
//     //     org,
//     //     rootOrg,
//     //   },
//     //   ...axiosRequestConfig,
//     //   json: {
//     //     token: kcToken,
//     //   },
//     // }
//     // console.log(url, options)
//     // tslint:disable-next-line: no-commented-code
//     // const bodyWithConfigRequestOptions = { ...body, options }
//     logInfoHeading('==========WToken API Request===============')
//     // tslint:disable-next-line: no-commented-code
//     // request.post(url, options).pipe(res)
//     request.post(url, options, async (error, _res, body) => {
//       if (error) {
//         logError(`Error on wtoken api call to user profile service: `, error)
//       }
//       if (body.user) {
//         const user = body.user
//         // Check if user is present in NodeBB NodeBB DiscussionHub
//         // tslint:disable-next-line: no-any
//         const userPresent = await getUserByEmail(user.email).catch(async (err: any) => {
//           if (err.response && (err.response.status === 404)) {
//             // If user is not already present in nodeBB NodeBB DiscussionHub
//             // then create the user
//             const reqToDiscussionHub = {
//               email: user.email,
//               fullname: `${user.first_name} ${user.last_name}`,
//               password: CONSTANTS.DISCUSSION_HUB_DEFAULT_PASSWORD,
//               username: user.wid,
//             }
//             // tslint:disable-next-line: no-any
//             await createDiscussionHubUser(reqToDiscussionHub).catch((createDiscussionHubUserErr: any) => {
//               logError(`Creatin of User failed..!:`, createDiscussionHubUserErr)
//               res.send(body)
//             })
//           }
//         })
//         if (userPresent) {
//           logInfo('User already present in NodeBB DiscussionHub. Skiping create')
//         }
//       }
//       res.send(body)
//     })
//     // tslint:disable-next-line: max-line-length
// tslint:disable-next-line: max-line-length
//     res.json({ kid_updated: false, user: { wid: '9cdd9f76-2584-4ae5-940d-3f51dce020dc', root_org: 'igot', org: 'dopt', is_active: null, account_expiry_date: null, kid: 'f593ca95-d435-4d95-82f5-e02d2827ecea', imported_source_name: null, source_id: null, username: null, first_name: 'Christopher', last_name: "F'des", middle_name: 'B', known_as: null, salutation: null, email: 'christopher.fernandes@tarento.com', gender: null, dob: null, languages_known: null, preferred_language: null, source_profile_picture: null, residence_country: null, residence_state: null, residence_city: null, contact_phone_number_office: null, contact_phone_number_home: null, contact_phone_number_personal: null, employment_status: null, contract_type: null, job_title: null, job_role: null, department_name: 'igot', sub_department_name: null, unit_name: null, organization_location_country: null, organization_location_state: null, organization_location_city: null, time_inserted: '2020-06-13T15:45:04.200Z', time_updated: '2020-10-27T09:39:03.924Z', json_unmapped_fields: null, source_data: null, manager_id: null, user_properties: null, time_zone: null, social_media_profiles: null, autocomplete_filters: null } })
//   } catch (err) {
//     // tslint:disable-next-line: no-console
//     console.log('------------------W TOKEN ERROR---------\n', err)
//     res.status((err && err.response && err.response.status) || 500).send(err)
//   }
// })

// tslint:disable-next-line: no-any // tslint:disable-next-line: cognitive-complexity
export function wTokenApiMock(req: any, token: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      const rootOrg = req.header('rootOrg') || CONSTANTS.DEFAULT_ROOT_ORG
      const org = req.header('org') || CONSTANTS.DEFAULT_ORG
      // tslint:disable-next-line: no-any
      let kcToken: any
      kcToken = token
      const url = API_END_POINTS.pidProfile
      const options: request.CoreOptions = {
        headers: {
          org,
          rootOrg,
        },
        ...axiosRequestConfig,
        json: {
          department_name: req.body.department,
          token: kcToken,
        },
      }

      request.post(url, options, async (error, _res, body) => {
        if (error) {
          reject(error)
        }
        if (body.user) {
          const user = body.user
          // Check if user is present in NodeBB DiscussionHub
          // tslint:disable-next-line: no-identical-functions
          const userPresent = await getUserByEmail(req, user.email).catch(async (err) => {
            if (err.response && (err.response.status === 404)) {
              // If user is not already present in nodeBB DiscussionHub
              // then create the user
              const reqToDiscussionHub = {
                email: user.email,
                fullname: `${user.first_name} ${user.last_name}`,
                password: CONSTANTS.DISCUSSION_HUB_DEFAULT_PASSWORD,
                username: user.wid,
              }
              // tslint:disable-next-line: no-any
              await createDiscussionHubUser(req, reqToDiscussionHub).catch((createDiscussionHubUserErr: any) => {
                logError(`Creatin of User failed..!:`, createDiscussionHubUserErr)
                resolve(body)
              })
            }
          })
          if (userPresent) {
            logInfo('User already present in NodeBB DiscussionHub. Skiping create')
          }
        }
        resolve(body)
      })

    } catch (err) {
      // tslint:disable-next-line: no-console
      console.log('------------------W TOKEN ERROR---------\n', err)
      reject()
    }
  })
}

detailsApi.post('/managerDetails', async (req, res) => {
  try {
    const rootOrg = req.header('rootOrg')
    if (!rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const response = await axios.post(
      API_END_POINTS.managerDetails,
      req.body,
      { ...axiosRequestConfig, headers: { rootOrg } }
    )
    res.status(response.status).send(response.data)
  } catch (err) {
    res
      .status((err && err.response && err.response.status) || 500)
      .send((err && err.response && err.response.data) || err)
  }
})

detailsApi.post('/detailV1', async (req, res) => {
  const _rootOrg = req.header('rootOrg')
  const url = `${API_END_POINTS.emailId}`
  try {
    if (!_rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const response = await axios.post(
      url,
      {
        conditions: {
          root_org: _rootOrg,
        },
        source_fields: ['wid', 'email', 'first_name', 'last_name', 'department_name'],
        values: [req.body.email],
      },
      {
        ...axiosRequestConfig,
        headers: { _rootOrg },
      }
    )

    res.json(response.data)
  } catch (err) {
    res.status(500).send(err)
  }
})

detailsApi.get('/detailV2', async (req, res) => {
  const _rootOrg = req.header('rootOrg')
  const wid = extractUserIdFromRequest(req)
  const url = `${API_END_POINTS.detail}`
  try {
    if (!_rootOrg) {
      res.status(400).send(ERROR.ERROR_NO_ORG_DATA)
      return
    }
    const response = await axios.post(
      url,
      {
        conditions: {
          root_org: _rootOrg,
        },
        source_fields: ['wid', 'email', 'first_name', 'last_name', 'department_name'],
        values: [wid],
      },
      {
        ...axiosRequestConfig,
        headers: { _rootOrg },
      }
    )
    res.json(response.data)
  } catch (err) {
    res.status(500).send(err.response.data)
  }
})
