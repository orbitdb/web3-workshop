import React, { useState, useEffect } from "react"
import { observer } from 'mobx-react'
import { Link } from 'react-router-dom'
import './styles/Playlist.scss'
import { getDataTransferFiles, toArrayBuffer, getFileBuffer } from './helper.js'

function createAudioElement(stream) {
  const source = new MediaSource()

  source.addEventListener('sourceopen', e => {
    const buf = []
    const sourceBuffer = source.sourceBuffers.length === 0 && source.addSourceBuffer('audio/mpeg')
    if (sourceBuffer) {
      sourceBuffer.addEventListener('updateend', () => {
        if (buf.length > 0 && !sourceBuffer.updating) {
          sourceBuffer.appendBuffer(buf.shift())
        }
      })

      stream.on('data', data => {
        if (!sourceBuffer.updating) {
          if (buf.length > 0) {
            sourceBuffer.appendBuffer(buf.shift())
          } else {
            sourceBuffer.appendBuffer(toArrayBuffer(data))
          }
        } else {
          buf.push(toArrayBuffer(data))
        }
      })

      stream.on('end', () => {
        setTimeout(() => {
          if (source.readyState === 'open' && !sourceBuffer.updating) source.endOfStream()
        }, 100)
      })

      stream.on('error', e => console.error("herebeerror", e))
    }
  })

  return <audio controls autoPlay={true} src={window.URL.createObjectURL(source)} onError={(e) => console.log("SOME ERROR", e)} />
}

const PlayAudio = ({ipfs, hash}) => {
  const [content, setContent] = useState(null)
  useEffect (() => {
    const stream = ipfs.catReadableStream(hash)
    const element = createAudioElement(stream)
    setContent(element)
  }, [hash])

  return content ? content : <div>Loading...</div>
}

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
  const [track, setTrack] = useState(null)
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
      <div className='playlist-item' onClick={() => setTrack(hash)}>{name}</div>
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
          {track ? (<PlayAudio className="plyr" ipfs={props.store.ipfs} hash={track}/>) : null}
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
