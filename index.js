import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import './styles/index.scss'
import {create} from 'ipfs'
import store from './PlaylistsStore'
import Playlists from './Playlists'
import Playlist from './Playlist'

class App extends React.Component{
    async componentDidMount () {
      const ipfs = await create({
        repo: './ipfs-repo',
        EXPERIMENTAL: { pubsub: true },
        preload: { "enabled": false },
        config: {
          Addresses: {
            Swarm: [
              // Use IPFS  webrtc signal server
              '/dns6/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star',
              '/dns4/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star',
              // Use local signal server
              // '/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star',
            ]
          },
        }
      })
      await store.connect(ipfs)
      console.log("odb id:", store.odb.identity.id)
    }

    render(){
      return (
        <div>
          <pre>      .-``'.  📻                            📻  .'''-.</pre>
          <pre>    .`   .`       ~ O R B I T   W A V E S ~      `.   '.</pre>
          <pre>_.-'     '._ <a href="https://github.com/orbitdb/web3-workshop/">github.com/orbitdb/web3-workshop/</a> _.'     '-._</pre>
          <Router>
            <Route path="/orbitdb/:hash/:name" component={(props) => <Playlist {...props} store={store}/> }/>
            <Route exact path="/" component={(props) => <Playlists {...props} store={store}/> }/>
          </Router>
        </div>
      )
    }
}

ReactDOM.render(<App />, document.getElementById('root'))
