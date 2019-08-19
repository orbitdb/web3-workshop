# Workshop Instructions

First, run `npm install`

Then, to begin the webpack server run the command `npm start`.

We will be building a playlist app on OrbitDB to share music lists with friends.
# Creating the store

`$ touch PlaylistsStore.js`

Our app will consist of a single store to handle OrbitDB operations.
We will be using `mobx` for state management and `orbit-db-identity-provider` to set up an identity for our OrbitDB instance.

```js
import { observable } from 'mobx'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  constructor () {
    this.ipfs = null
    this.odb = null
    this.feed = null
  }

  async connect(ipfs, options = {}) {
    // set up orbitdb
  }
}

const store = new PlaylistsStore()
export default store
```

## Setting up IPFS and OrbitDB
Let's first set up our OrbitDB instance in `connect`. OrbitDB requires an `ipfs` instance and an `identity` to be passed into the `createInstance` method.

```js
async connect(ipfs, options = {}) {
  this.ipfs = ipfs
  const identity = options.identity || await Identities.createIdentity({ id: 'user' })
  this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
}
```

in `index.js` let's create an IPFS instance with pubsub enabled once the App component has mounted:

```js
async componentDidMount () {
  const ipfs = await IPFS.create({
    repo: './ipfs-repo',
    EXPERIMENTAL: { pubsub: true },
    preload: { "enabled": false },
    config: {
      Addresses: {
        Swarm: ["/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star"] //rendezvous server
      },
      Bootstrap: ["/ip4/10.220.3.64/tcp/4002/ws/ipfs/QmTLJ3rHiqtcitBRhPv8enSHmhZahCF7heYQvKkWvBfGVq"] // connect workshop peers
    }
  })
  await store.connect(ipfs)
  console.log("odb id:", store.odb.identity.id)
}
```

## Playlists Component

Our home page will list the names of our playlists. Let's begin by adding a `playlists` array in our store and create a `Playlists` component to render the contents.

```js
PlaylistsStore.js

class PlaylistsStore {
  @observable playlists = ['playlist1', 'playlist1']
  constructor () {
    this.ipfs = null
    this.odb = null
    this.feed = null
  }
```

We will pass in the store as props to the Playlists component in `index.js`

```js
index.js

render(){
  return (
      <Router>
        <Route exact path="/" component={(props) => <Playlists {...props} store={store} /> }/>
      </Router>
    </div>
  )
}

```

`Playlists` should be wrapped in `observer` to trigger rendering on updates:

```js
Playlists.js

import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'

const Playlists = (props) => (
  <div style={{max}}>
    <ul className="playlist-items"> {
          props.store.playlists.map(playlist => {
            return (<li key={playlist}>{playlist}</li>)
          }
        )}
    </ul>
  </div>
)

export default observer(Playlists)

```

## Creating a feed to store playslists

Next we will create a `feed` store to maintain our playlists. Let's put it in a method called `loadPlaylists ()` in `PlaylistsStore.js` and call it in our `connect` function.

```js
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
```
