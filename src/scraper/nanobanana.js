const axios = require('axios')
const FormData = require('form-data')

async function uploadToTempFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'image/jpeg' })

    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 60000
    })

    if (res.data?.status === 'success' && res.data?.data?.url) {
        return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    throw new Error('Upload failed')
}

async function nanoBanana(imageBuffer, prompt) {
    const imageUrl = await uploadToTempFiles(imageBuffer, `nano_${Date.now()}.jpg`)
    const apiUrl = `https://api-faa.my.id/faa/nano-banana?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`

    const imgRes = await axios.get(apiUrl, { 
        responseType: 'arraybuffer',
        timeout: 120000
    })

    return Buffer.from(imgRes.data)
}

module.exports = nanoBanana