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
    await this.loadPlaylists()
  }

  async loadPlaylists() {
    this.feed = await this.odb.feed(this.odb.identity.id + '/playlists')
    await this.feed.load()

    const addToPlaylists = (entry) => {
      //add entry to this.playlsits
      this.playlists.push({
        hash: entry.hash,
        name: entry.payload.value.name,
        address: entry.payload.value.address
      })
    }

    this.feed.all.map(addToPlaylists)
    this.feed.events.on('write', (hash, entry, heads) => {
      addToPlaylists(entry)
    })
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
