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
    }
    
    this.feed.events.on('ready', (a,b) => {
      this.feed.all.map(this.addToPlaylists)
    })

    this.feed.events.on('write', (hash, entry, heads) => {
      addToPlaylists(entry)
    })
    await this.feed.load()
  }
}

const store = window.store = new PlaylistsStore()
export default store
