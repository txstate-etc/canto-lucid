import Server from 'fastify-txstate'
import fastifyRateLimit from 'fastify-rate-limit'
import { sleep } from 'txstate-utils'
import { LucidData, LucidImage } from './lucid.js'
import { getPage, cantoChanged } from './canto.js'

const server = new Server()
server.app.register(fastifyRateLimit, {
  max: 10,
  timeWindow: '1 minute'
})

async function getData() {
  console.info('Retrieving info from Canto.')
  const lucid = new LucidData()
  let lastPage = 25
  for (let page = 1; page <= 25 && page <= lastPage; page++) {
    let images;
    ({ images, lastPage } = await getPage(page))
    for (const image of images) {
      lucid.addImage(new LucidImage(image))
    }
  }
  console.info('Retrieval of info from Canto successful.')
  return lucid.json()
}

let datapromise
let data
let lastrun
async function watchCanto() {
  while (true) {
    const savelastrun = lastrun
    try {
      if (!data || !lastrun || lastrun.getTime() < new Date().getTime() - 1000 * 60 * 60 * 24 || await cantoChanged(lastrun)) {
        lastrun = new Date()
        datapromise = getData()
        data = JSON.stringify(await datapromise)
      }
    } catch (e) {
      lastrun = savelastrun
      console.error(e)
    }
    await sleep(1000 * 60 * 10)
  }
}

const basicAuthSecret = 'Basic ' + Buffer.from(`${process.env.BASIC_AUTH_USER}:${process.env.BASIC_AUTH_SECRET}`).toString('base64')
server.app.get('/dam', async (req, res) => {
  if (process.env.BASIC_AUTH_USER) {
    if (!req.headers.authorization) {
      res.headers({
        'WWW-Authenticate': 'Basic realm="cantobridge integration data", charset="UTF-8"'
      }).status(401).send()
      return
    } else if (req.headers.authorization !== basicAuthSecret) {
      res.status(401).send()
      return
    }
  }
  res.header('content-type', 'application/json')
  return data ?? await datapromise
})

async function main () {
  await server.start(3000)
  await watchCanto()
}

main().catch(e => { console.error(e); process.exit(1) })
