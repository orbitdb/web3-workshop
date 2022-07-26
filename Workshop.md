# Workshop Instructions

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/orbitdb/Lobby) [![Matrix](https://img.shields.io/badge/matrix-%23orbitdb%3Apermaweb.io-blue.svg)](https://riot.permaweb.io/#/room/#orbitdb:permaweb.io) 

First, run `npm install`

Then, to begin the webpack server run the command `npm start`. We'll keep this running over the course of the workshop; it'll automatically hotload any new edits to the server. To do more edits, open a new terminal window.

We will be building a playlist app on OrbitDB to share music lists with friends.

## Creating the store

`$ touch PlaylistsStore.js`

Our app will consist of a single store to handle OrbitDB operations.
We will be using `mobx` for state management and `orbit-db-identity-provider` to set up an identity for our OrbitDB instance.

```js
// PlaylistsStore.js

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
// PlaylistsStore.js

async connect(ipfs, options = {}) {
  this.ipfs = ipfs
  const identity = options.identity || await Identities.createIdentity({ id: 'user' })
  this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
}
```

In `index.js` let's create an IPFS instance with pubsub enabled once the App component has mounted:

```js
// index.js
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
// PlaylistsStore.js

class PlaylistsStore {
  @observable playlists = ['playlist1', 'playlist2']
  constructor () {
    this.ipfs = null
    this.odb = null
    this.feed = null
  }
```

We will pass in the store as props to the Playlists component in `index.js`

```js
// index.js

render(){
  return (
    <div>
      <Router>
        <Route exact path="/" component={(props) => <Playlists {...props} store={store} /> }/>
      </Router>
    </div>
  )
}

```

`Playlists` should be wrapped in `observer` to trigger rendering on updates. So, touch `Playlists.js`, and then:

```js
// Playlists.js

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

## Creating a feed to store playlists

Next we will create a `feed` store to maintain our playlists. Let's put it in a method called `loadPlaylists ()` in `PlaylistsStore.js` and call it in our `connect` function.

We then iterate through all the entries in our feed with `feed.all` and add them to our `playlists` array to be rendered. Additionally we should listen for a `write` event from our feed indicated a new entry has been written.

```js
// PlaylistsStore.js

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
    //add entry to this.playlists
  }

  this.feed.all.map(addToPlaylists)
  this.feed.events.on('write', (hash, entry, heads) => {
    addToPlaylists(entry)
  })
}
```

## Adding a playlist

To create a new playlist, let's add a `CreatePlaylist` component and add an input form to set the name.

```js
// CreatePlaylist.js

const CreatePlaylist = (props) => {
  return(
    <form onSubmit={() => console.log("clicked")}>
      <label htmlFor="playlistName">Enter a playlist name:</label><br />
      <input type="text" placeholder="New playlist" onChange={() => {}} />
      <input type="submit" value="Create" />
    </form>
  )
}

export default CreatePlaylist

```
Add the CreatePlaylist component to the `Playlists` component:

```js
// Playlists.js

const Playlists = (props) => (
  <div style={{ maxWidth: "800px" }}>
    <CreatePlaylist {...props}/> // create new playlist
    <ul className="playlist-items"> {
          props.store.playlists.map(playlist => {
            return (<li key={playlist}>{playlist}</li>)
          }
        )}
    </ul>
  </div>
)
```

We need to keep track of the `playlistName` entered in the form input. To do that we can use React's `useState` hook and add `handleChange` and `handleSubmit`.

```js
// CreatePlaylist.js

const CreatePlaylist = (props) => {
  const [name, setName] = useState('')

  async function handleSubmit (event) {
    event.preventDefault()
    console.log("Created playlist with name", name)
    setName('')
  }

  async function handleChange(event) {
    event.preventDefault();
    setName(event.target.value)
  }

  return(
    <form onSubmit={handleSubmit}>
      <label htmlFor="playlistName">Enter a playlist name:</label><br />
      <input type="text" placeholder="New playlist" onChange={handleChange} />
      <input type="submit" value="Create" />
    </form>
  )
}

export default CreatePlaylist
```

Next we need to add a method in our `PlaylistsStore` to create a new playlist with the name.
Each playlist will be a feed of its own, and we will add the name and address of the playlist to our feed of saved playlists.

```js
// PlaylistStore.js

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
```
And call it in our `handleSubmit` method in `CreateNewPlaylist`

```js
// CreatePlaylist.js

async function handleSubmit (event) {
  event.preventDefault()
  const playlist = await props.store.createNewPlaylist(name)
  console.log("Created playlist", playlist)
  setName('')
}

```

Finally we need to update our `playlists` array to read from the playlists feed in our `loadPlaylists` method.

```js
// PlaylistStore.js

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
```
