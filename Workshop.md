# Workshop Instructions

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/orbitdb/Lobby) [![Matrix](https://img.shields.io/badge/matrix-%23orbitdb%3Apermaweb.io-blue.svg)](https://riot.permaweb.io/#/room/#orbitdb:permaweb.io) [![Discord](https://img.shields.io/discord/475789330380488707?color=blueviolet&label=discord)](https://discord.gg/cscuf5T)

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

## Opening a Playlist

Next we would like to create a `Playlist` component to render the list of songs in our selected playlist.
To do so lets create a `PlaylistItem` which will route the user to a new url with the orbitdb address of the selected playlist.

```js
// Playlists.js

const PlaylistItem =({ playlist }) => {
  return (
    <li>
      <Link to={`${playlist.address}`}>{playlist.name}</Link>
    </li>
  )
}

const Playlists = (props) => (
  <div style={{ maxWidth: "800px" }}>
    <CreatePlaylist {...props}/>
    <ul className="playlist-items"> {
          props.store.playlists.map(playlist => {
            return (<PlaylistItem key={playlist.address} playlist={playlist}/>)
          }
        )}
    </ul>
  </div>
)
```

We need to add a route for urls which match an orbtdb address in `index.js`

```js
// index.js

render(){
  return (
    <div>
      <Router>
        <Route path="/orbitdb/:hash/:name" component={(props) => <Playlist {...props} store={store}/> }/>
        <Route exact path="/" component={(props) => <Playlists {...props} store={store}/> }/>
      </Router>
    </div>
  )
}

```
We would like to render this page *only* if we are connected to OrbitDB. Let's add a `isOnline` property in our `PlaylistsStore` which we set to `true` once orbitdb is connected.

```js
// PlaylistStore.js

class PlaylistsStore {
  @observable playlists = []
  @observable isOnline = false
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
    this.isOnline = true
  }
  ...
```

Next we can check in our Playlist Component if the `store.isOnline` is true before rendering.

```js
// Playlist.js

import React from "react"
import { observer } from 'mobx-react'
import './styles/Playlist.scss'


const Playlist = (props) => {
  return (
    <div className='Playlist'>
      online :+1:
    </div>
  )
}

const PlaylistView = (props) => props.store.isOnline ? (<Playlist {...props}/>) : null
export default observer(PlaylistView)
```

## Adding tracks to a Playlist

Now we can start adding mp3 files! Let's add a `Dropzone` to be able to drag our files there.

```js
// Playlist.js

import { Link } from 'react-router-dom'
import './styles/Playlist.scss'

const Header = ({ title }) => {
  return (
    <div className='header'>
      <Link to={`/`} title="Back to Home"> .. </Link>
      <div id='title'>{title}</div>
    </div>
  )
}

const Playlist = (props) => {
  const [dragActive, setDragActive] = useState(false)

  async function onDrop (event) {
   event.preventDefault()
   setDragActive(false)
   const files = getDataTransferFiles(event)
   try {
     // upload files using PlaylistStore
   } catch (err) {
     console.log("ERROR", err)
     throw err
   }
}

  return (
    <div className='Playlist'>
      <Header title={props.match.params.name} />
      <div className='dragZone'
          onDragOver={event => {
              event.preventDefault()
              !dragActive && setDragActive(true)
            }
          }
          onDrop={event => onDrop(event)}>
           // list songs in playlist }
        <h2 className="message">Drag audio files here to add them to the playlist</h2>
      </div>
    </div>
  )
}

const PlaylistView = (props) => props.store.isOnline ? (<Playlist {...props}/>) : null
export default observer(PlaylistView)
```

Upon mounting we would like to retrieve the selected playlist from the store and list the items in the playlist. To do that lets add a `currentPlaylist` property to `PlaylistStore` as well as add a `joinPlaylist` method which takes an address, opens the store and load the contents.

```js
// PlaylistStore.js

class PlaylistsStore {
  @observable playlists = []
  @observable isOnline = false
  @observable currentPlaylist = {}

  constructor () {
    this.ipfs = null
    this.odb = null
    this.feed = null
  }
  ...

  async joinPlaylist (address) {
  if (this.odb) {
    const playlist = this.odb.stores[address] || await this.odb.open(address)
    await playlist.load()
    this.currentPlaylist = playlist
  }
}

```

We can now call `joinPlaylist` once the Playlist component has mounted. We maintain a list of items using `useState` and set the items once the playlist has been opened. Additionally we need to wait for the `replicated` event which means a peer has added an item to the list, and reset the items.

```js
// Playlist.js

const Playlist = (props) => {
  const [items, setItems] = useState([])
  const [dragActive, setDragActive] = useState(false)

  let mounted = true
  const address = '/orbitdb/' + props.match.params.hash + '/' + props.match.params.name

  useEffect(handlePlaylistNameChange, [address])

  function handlePlaylistNameChange () {
    function load () {
      props.store.joinPlaylist(address).then(() => {
        if (mounted) {
          setItems(props.store.currentPlaylist.all)
          props.store.currentPlaylist.events.on('replicated', () => {
            console.log("REPLICATED")
            setItems(props.store.currentPlaylist.all)
          })
        }
      })
    }
    load()

    return () => {
      mounted = false
    }
  }

  async function onDrop (event) { ... }

  const PlaylistItem = ({ name, hash }) => {
    return (
      <div className='playlist-item' onClick={() => console.log(hash)}>{name}</div>
    )
  }

  return (
    <div className='Playlist'>
      <Header title={props.match.params.name} />
      <div className='dragZone'
          onDragOver={event => {
              event.preventDefault()
              !dragActive && setDragActive(true)
            }
          }
          onDrop={event => onDrop(event)}>
          <ul> {
            items.map(item => (
              <PlaylistItem key={item.hash} name={item.payload.value.meta.name} hash={item.payload.value.content}/>
            )
          )}
          </ul>
        <h2 className="message">Drag audio files here to add them to the playlist</h2>
      </div>
    </div>
  )

```

Now to actually add files, we need to add a method to upload files in our `PlaylistStore`.

```js
// PlaylistStore.js

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
```

Finally we can call the `sendFiles` method in `onDrop`:

```js
// Playlist.js

async function onDrop (event) {
   event.preventDefault()
   setDragActive(false)
   const files = getDataTransferFiles(event)
   try {
     await store.sendFiles(files, address)
     setItems(props.store.currentPlaylist.all)
   } catch (err) {
     console.log("ERROR", err)
     throw err
   }
}
```
