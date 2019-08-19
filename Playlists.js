import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import './styles/Playlists.scss'

const Playlists = (props) => (
  <div style={{ maxWidth: "800px" }}>
    <ul className="playlist-items"> {
          props.store.playlists.map(playlist => {
            return (<li key={playlist}>{playlist}</li>)
          }
        )}
    </ul>
  </div>
)

export default observer(Playlists)
