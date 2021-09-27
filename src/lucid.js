import { isNotNull } from 'txstate-utils'
const LUCID_MAXRES = parseInt(process.env.LUCID_MAXRES ?? '4000')
const LUCID_MAXMB = parseInt(process.env.LUCID_MAXMB ?? '8')

export class LucidData {
  constructor () {
    this.version = 1
    this.folders = {}
  }

  addImage (img) {
    if (!img.id || !img.name) return
    for (const path of img.folders) {
      let lastfolder = this
      for (const folder of path) {
        lastfolder.folders[folder.id] ??= new LucidFolder(folder.id, folder.name)
        lastfolder = lastfolder.folders[folder.id]
      }
      lastfolder.images.push(img)
    }
    delete img.folders
  }

  json () {
    return {
      version: this.version,
      data: Object.values(this.folders).map(f => f.json())
    }
  }
}

export class LucidFolder {
  constructor (id, name) {
    this.id = id
    this.name = name
    this.folders = {}
    this.images = []
  }

  json () {
    return {
      id: this.id,
      name: this.name,
      folders: Object.values(this.folders).map(f => f.json()),
      images: this.images
    }
  }
}

export class LucidImage {
  constructor (img) {
    this.id = img.id
    this.name = img.name
    this.url = img.url.download

    if (process.env.SCALE_IMAGES) {
      const width = img.width
      const height = img.height
      const filesize = img.size
      if (filesize > LUCID_MAXMB * 1024 * 1024 || width > LUCID_MAXRES || height > LUCID_MAXRES) {
        let neww, newh
        if (height > width) {
          newh = Math.min(LUCID_MAXRES, height)
          neww = Math.round(newh * width / height)
        } else {
          neww = Math.min(LUCID_MAXRES, width)
          newh = Math.round(neww * height / width)
        }
        this.url = `https://${process.env.CANTO_DOMAIN}.canto.com/api_binary/v1/advance/image/${this.id}/download?resize=${neww}x${newh}&type=jpg`
      }
    }

    this.thumbnailUrl = img.url.preview
    const seen = new Set()
    this.tags = (img.tag ?? [])
      .concat(img.keyword ?? [])
      .concat(Object.values(img.additional).filter(isNotNull))
      .map(t => t.trim())
      .filter(t => t !== 'Untagged')
      .filter(t => {
        const lc = t.toLocaleLowerCase()
        const dupe = seen.has(lc)
        seen.add(lc)
        return !dupe
      })
    this.folders = img.relatedAlbums?.map(album => {
      const ids = album.idPath.split('/')
      const names = album.namePath.split('/')
      if (ids.length !== names.length) console.error('Found an album with a / in its name.')
      return ids.map((id, i) => ({ id, name: names[i] }))
    }) ?? []
  }
}
