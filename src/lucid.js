import { isNotNull, sortby } from 'txstate-utils'
const LUCID_MAXRES = parseInt(process.env.LUCID_MAXRES ?? '4000')
const LUCID_MAXMB = parseInt(process.env.LUCID_MAXMB ?? '8')

export class LucidData {
  constructor () {
    this.version = 1
    this.folders = {}
    this.imagesSeen = new Set()
  }

  addImage (img) {
    if (!img.id || !img.name || !img.folderPath?.length || this.imagesSeen.has(img.id)) return
    let lastfolder = this
    for (const folder of img.folderPath) {
      lastfolder.folders[folder.id] ??= new LucidFolder(folder.id, folder.name)
      lastfolder = lastfolder.folders[folder.id]
    }
    this.imagesSeen.add(img.id)
    lastfolder.images.push(img)
    delete img.folderPath
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
    this.url = img.url.directUrlOriginal
    this.thumbnailUrl = img.url.directUrlPreview

    const folderPaths = sortby(
      img.relatedAlbums?.map(album => {
        const ids = album.idPath.split('/')
        const names = album.namePath.split('/')
        if (ids.length !== names.length) console.error('Found an album with a / in its name.')
        return ids.map((id, i) => ({ id, name: names[i] }))
      }) ?? [],
      p => p.length,
      p => p[p.length - 1].id
    )

    this.folderPath = folderPaths[0]

    const otherfolders = folderPaths.filter(p => p[p.length - 1].id !== this.folderPath[this.folderPath.length - 1].id)
      .map(p => p[p.length - 1].name)

    const seen = new Set()
    this.tags = (img.tag ?? [])
      .concat(img.keyword ?? [])
      .concat(otherfolders)
      .concat(Object.values(img.additional).filter(isNotNull))
      .map(t => t.trim())
      .filter(t => t !== 'Untagged')
      .filter(t => {
        const lc = t.toLocaleLowerCase()
        const dupe = seen.has(lc)
        seen.add(lc)
        return !dupe
      })
  }
}
