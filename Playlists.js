import React from 'react'
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import './styles/Playlists.scss'

const Playlists = (props) => (
  <ul className="playlist-items"> {
        props.store.playlists.map(playlist => {
          return (<li>{playlist}</li>)
        }
      )}
  </ul>
)

export default observer(Playlists)
