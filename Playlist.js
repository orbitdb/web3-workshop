import React, { useState, useEffect } from "react"
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import './styles/Playlist.scss'
import { getDataTransferFiles } from './helper.js'

const Header = ({ title }) => {
  return (
    <div className='header'>
      <Link to={`/`} title="Back to Home"> .. </Link>
      <div id='title'>{title}</div>
    </div>
  )
}

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
            setItems(props.store.currentPlaylist.all)
          })
        }
      })
    }
    load()

    return () => {
      setItems([])
      mounted = false
    }
  }

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
}

const PlaylistView = (props) => props.store.isOnline ? (<Playlist {...props}/>) : null
export default observer(PlaylistView)
