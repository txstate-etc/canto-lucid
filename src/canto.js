import { HttpsAgent } from 'agentkeepalive'
import axios from 'axios'
import { Cache } from 'txstate-utils'

const tokenCache = new Cache(async () => {
  try {
    const resp = await axios.post(
      'https://oauth.canto.com/oauth/api/oauth2/token?' + new URLSearchParams(
      {
        app_id: process.env.CANTO_APP_ID,
        app_secret: process.env.CANTO_APP_SECRET,
        grant_type: 'client_credentials',
        scope: 'admin'
      }).toString()
    )
    return resp.data.accessToken
  } catch (e) {
    console.error(e.response?.status, e.request?.config, e.response)
    throw new Error('Unable to acquire auth token.')
  }
}, {
  freshseconds: 15 * 24 * 60 * 60
})

const savedClient = axios.create({
  baseURL: `https://${process.env.CANTO_DOMAIN}.canto.com/api/v1`,
  httpsAgent: new HttpsAgent()
})
async function client () {
  savedClient.defaults.headers.authorization = `Bearer ${await tokenCache.get()}`
  return savedClient
}

export async function cantoChanged (lastrun) {
  const resp = await (await client()).get('/image', {
    params: {
      approval: 'approved',
      lastModified: `${Math.round(lastrun.getTime() / 1000)}..${Math.round(new Date().getTime() / 1000)}`,
      limit: 1
    }
  })
  console.info(`Found ${resp.data.results?.length ?? 0} changes since ${lastrun.toUTFString()}.`)
  return resp.data.results?.length > 0
}

export async function getPage (page = 1) {
  const resp = await (await client()).get('/search', {
    params: {
      approval: 'approved',
      scheme: 'image',
      limit: 10000,
      start: (page - 1) * 10000
    }
  })
  const found = resp.data.found
  const limit = resp.data.limit
  const images = resp.data.results
  return { images, lastPage: Math.ceil(found / limit) }
}
