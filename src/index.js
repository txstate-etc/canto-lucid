import axios from 'axios'
import Server from 'fastify-txstate'
import { Cache } from 'txstate-utils'
import { LucidData, LucidImage } from './lucid.js'

const server = new Server()
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
    console.error(e.response.status, e.request)
    throw new Error('Unable to acquire auth token.')
  }
}, {
  freshseconds: 15 * 24 * 3600
})

async function client () {
  return axios.create({
    baseURL: 'https://txstate.canto.com/api/v1',
    headers: {
      authorization: `Bearer ${await tokenCache.get()}`
    }
  })
}

async function getPage (page = 1) {
  const resp = await (await client()).get('/search', {
    params: {
      approval: 'approved',
      scheme: 'image',
      limit: 1000,
      start: (page - 1) * 1000
    }
  })
  const found = resp.data.found
  const limit = resp.data.limit
  const images = resp.data.results.map(r => new LucidImage(r))
  return { images, lastPage: Math.ceil(found / limit) }
}

server.app.get('/', async (req, res) => {
  const lucid = new LucidData()
  let lastPage = 0
  for (let page = 1; page < 5 && lastPage !== page; page++) {
    let images;
    ({ images, lastPage } = await getPage(page))
    for (const image of images) {
      lucid.addImage(image)
    }
  }
  return lucid.json()
})

server.start()
  .catch(e => { console.error(e); process.exit(1) })
