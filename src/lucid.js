import { isNotNull } from 'txstate-utils'

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
      folders: Object.values(this.folders).map(f => f.json())
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
    this.thumbnailUrl = img.url.preview
    this.tags = (img.tag ?? [])
      .concat(img.keyword ?? [])
      .concat(Object.values(img.additional).filter(isNotNull))
      .filter(t => t !== 'Untagged')
    this.folders = img.relatedAlbums?.map(album => {
      const ids = album.idPath.split('/')
      const names = album.namePath.split('/')
      if (ids.length !== names.length) console.log('Found an album with a / in its name.')
      return ids.map((id, i) => ({ id, name: names[i] }))
    }) ?? []
  }
}
