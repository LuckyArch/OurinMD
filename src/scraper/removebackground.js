const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')

async function removebg(image){
  try{
    const html = await axios.get('https://www.iloveimg.com/remove-background')
    const token = html.data.match(/"token":"([^"]+)"/)?.[1]
    const task = html.data.match(/taskId\s*=\s*'([^']+)'/)?.[1]

    const file = fs.readFileSync(image)
    const name = image.split('/').pop()

    const up = new FormData()
    up.append('name', name)
    up.append('chunk', '0')
    up.append('chunks', '1')
    up.append('task', task)
    up.append('preview', '1')
    up.append('pdfinfo', '0')
    up.append('pdfforms', '0')
    up.append('pdfresetforms', '0')
    up.append('v', 'web.0')
    up.append('file', file, { filename: name, contentType: 'image/jpeg' })

    const upload = await axios.post('https://api5g.iloveimg.com/v1/upload',
      up,
      {
        headers: {
      ...up.getHeaders(),
      Authorization: `Bearer ${token}`,
      origin: 'https://www.iloveimg.com',
      referer: 'https://www.iloveimg.com/'
    } 
   }
 )

    const proses = await axios.post('https://api5g.iloveimg.com/v1/removebackground',
      new URLSearchParams({
        task,
        server_filename: upload.data.server_filename
      }).toString(),
      {
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          origin: 'https://www.iloveimg.com',
          referer: 'https://www.iloveimg.com/'
        }
      }
    )

    const ug = new FormData()
    ug.append('files[]', proses.data, { filename: 'output.png' })

    const uguu = await axios.post('https://uguu.se/upload', ug)

    return uguu.data.files[0].url

  }catch(e){
    return { status: 'eror', msg: e.message }
  }
}

module.exports = removebg
