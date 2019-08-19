import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import './styles/Playlists.scss'
import CreatePlaylist from './CreatePlaylist'

const Playlists = (props) => (
  <div style={{ maxWidth: "800px" }}>
    <CreatePlaylist {...props}/>
    <ul className="playlist-items"> {
          props.store.playlists.map(playlist => {
            return (<li key={playlist.address}>{playlist.name}</li>)
          }
        )}
    </ul>
  </div>
)

export default observer(Playlists)
