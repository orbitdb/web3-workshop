function getDataTransferFiles (event) {
  const files = []
  if (event.dataTransfer.items) {
    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const file = event.dataTransfer.items[i]
      file.kind === 'file' && files.push(file.getAsFile())
    }
  } else {
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      files.push(event.dataTransfer.files.item(i))
    }
  }
  return files
}

function toArrayBuffer (buffer) {
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return ab
}

function getFileBuffer (ipfs, hash, options = {}) {
  const timeoutError = new Error('Timeout while fetching file')
  const timeout = options.timeout || 15 * 1000
  return new Promise((resolve, reject) => {
    let timeoutTimer = setTimeout(() => {
      reject(timeoutError)
    }, timeout)

    let array = new Uint8Array(0)
    const stream = ipfs.catReadableStream(hash)
    stream.on('error', error => {
      clearTimeout(timeoutTimer)
      reject(error)
    })

    stream.on('data', chunk => {
      clearTimeout(timeoutTimer)
      const tmp = new Uint8Array(array.length + chunk.length)
      tmp.set(array)
      tmp.set(chunk, array.length)
      array = tmp
      timeoutTimer = setTimeout(() => {
        reject(timeoutError)
      }, timeout)
    })

    stream.on('end', () => {
      clearTimeout(timeoutTimer)
      resolve(array)
    })
  })
}

module.exports.getDataTransferFiles = getDataTransferFiles
module.exports.toArrayBuffer = toArrayBuffer
module.exports.getFileBuffer = getFileBuffer
