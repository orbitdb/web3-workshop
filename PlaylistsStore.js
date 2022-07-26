import { observable } from 'mobx'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  @observable playlists = []
  @observable isOnline = false
  @observable currentPlaylist = {}

  constructor () {
    this.ipfs = null
    this.odb = null
    this.feed = null
  }

  async connect(ipfs, options = {}) {
    //set up orbitdb
    this.ipfs = ipfs
    const identity = options.identity || await Identities.createIdentity({ id: 'user' })
    this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
    const publicAccess = true
    this.feed = await this.odb.open("playlist", 
    { create: true, overwrite: true, localOnly: false, type: "feed",
      accessController: { write: publicAccess ? ['*'] : [orbitdb.identity.id] } })
    await this.loadPlaylists()
    this.isOnline = true
  }

  async loadPlaylists() {

    const addToPlaylists = (entry) => {
      //add entry to this.playlsits
      this.playlists.push({
        hash: entry.hash,
        name: entry.payload.value.name,
        address: entry.payload.value.address
      })
    }
    
    this.feed.events.on('ready', (address,elements) => {
      this.feed.all.map(addToPlaylists)
    })

    this.feed.events.on('write', (hash, entry, heads) => {
      addToPlaylists(entry)
    })
    await this.feed.load()
  }

  async createNewPlaylist(name) {
    const playlist = await this.odb.feed(name, { accessController: { type: 'orbitdb', write: [this.odb.identity.id]}})
    const p = {
      name,
      address: playlist.address.toString()
    }

    //next we add it to our saved playlists feed
    const hash = await this.feed.add(p)
    return hash
  }

  async joinPlaylist (address) {
    if (this.odb) {
      const playlist = this.odb.stores[address] || await this.odb.open(address)
      await playlist.load()
      this.currentPlaylist = playlist
    }
  }

  sendFiles (files, address) {
    const promises = []
    for (let i = 0; i < files.length; i++) {
      promises.push(this._sendFile(files[i], address))
    }
    return Promise.all(promises)
  }

  async _sendFile (file, address) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = async event => {
        const f = await this.addFile(address,
          {
            filename: file.name,
            buffer: event.target.result,
            meta: { mimeType: file.type, size: file.size }
          })
        resolve(f)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  async addFile (address, source) {
    if (!source || !source.filename) {
      throw new Error('Filename not specified')
    }
    const isBuffer = source.buffer && source.filename
    const name = source.filename.split('/').pop()
    const size = source.meta && source.meta.size ? source.meta.size : 0

    const result = await this.ipfs.add(Buffer.from(source.buffer))
    const hash = result[0].hash

    console.log("upload", hash)

    // Create a post
    const data = {
      content: hash,
      meta: Object.assign(
        {
          from: this.odb.identity.id,
          type: 'file',
          ts: new Date().getTime()
        },
        { size, name },
        source.meta || {}
      )
    }

    return this.addToPlaylist(address, data)
  }

  async addToPlaylist (address, data) {
    const feed = this.odb.stores[address] || await this.odb.open(address)
    if (feed) {
      const hash = await feed.add(data)
      return feed.get(hash)
    }
    return
  }
}

const store = window.store = new PlaylistsStore()
export default store