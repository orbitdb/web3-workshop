import { observable } from 'mobx'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  @observable playlists = []

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
}

const store = window.store = new PlaylistsStore()
export default store
