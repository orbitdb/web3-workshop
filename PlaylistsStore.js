import { observable } from 'mobx'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  @observable playlists = ['playlist1']

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
  }
}

const store = window.store = new PlaylistsStore()
export default store
