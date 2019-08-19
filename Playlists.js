import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import './styles/Playlists.scss'
import CreatePlaylist from './CreatePlaylist'

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

export default observer(Playlists)
