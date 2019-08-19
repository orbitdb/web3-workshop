import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'
import './styles/index.scss'
import IPFS from 'ipfs'
import store from './PlaylistsStore'
import Playlists from './Playlists'

class App extends React.Component{
    async componentDidMount () {
      const ipfs = await IPFS.create({
        repo: './ipfs-repo',
        EXPERIMENTAL: { pubsub: true },
        preload: { "enabled": false },
        config: {
          Addresses: {
            Swarm: ["/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star"]
          }
        }
      })
      await store.connect(ipfs)
    }

    render(){
      return (
        <div>
          <pre>      .-``'.  📻                            📻  .'''-.</pre>
          <pre>    .`   .`       ~ O R B I T   W A V E S ~      `.   '.</pre>
          <pre>_.-'     '._ <a href="https://github.com/orbitdb/web3-workshop/">github.com/orbitdb/web3-workshop/</a> _.'     '-._</pre>
          <Router>
            <Route exact path="/" component={(props) => <Playlists {...props} store={store}/> }/>
          </Router>
        </div>
      )
    }
}

ReactDOM.render(<App />, document.getElementById('root'))
