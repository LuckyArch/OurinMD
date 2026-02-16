const axios = require('axios')
const FormData = require('form-data')

async function uploadToTelegraph(buffer, filename = 'image.jpg') {
    const form = new FormData()
    form.append('file', buffer, { filename })
    
    const response = await axios.post('https://telegra.ph/upload', form, {
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    })
    
    if (response.data?.[0]?.src) {
        return 'https://telegra.ph' + response.data[0].src
    }
    
    throw new Error('Telegraph upload failed')
}

async function uploadTo0x0(buffer, filename = 'image.jpg') {
    const form = new FormData()
    form.append('file', buffer, { filename })
    
    const response = await axios.post('https://0x0.st', form, {
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    })
    
    if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
        return response.data.trim()
    }
    
    throw new Error('0x0.st upload failed')
}

async function uploadToTmpfiles(buffer, filename = 'image.jpg') {
    const form = new FormData()
    form.append('file', buffer, { filename })
    
    const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    })
    
    if (response.data?.status === 'success' && response.data?.data?.url) {
        return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    
    throw new Error('Tmpfiles upload failed')
}

async function uploadToCatbox(buffer, filename = 'image.jpg') {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename })
    
    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders(), 'User-Agent': 'Mozilla/5.0' },
        timeout: 60000
    })
    
    if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
        return response.data
    }
    
    throw new Error('Catbox upload failed')
}

async function uploadImage(buffer, filename = 'image.jpg') {
    const uploaders = [
        { name: 'Tmpfiles', fn: uploadToTmpfiles },
        { name: 'Telegraph', fn: uploadToTelegraph },
        { name: '0x0.st', fn: uploadTo0x0 },
        { name: 'Catbox', fn: uploadToCatbox }
    ]
    
    for (const uploader of uploaders) {
        try {
            const url = await uploader.fn(buffer, filename)
            console.log(`Upload success via ${uploader.name}: ${url}`)
            return url
        } catch (err) {
            console.log(`${uploader.name} failed: ${err.message}`)
        }
    }
    
    throw new Error('All uploaders failed')
}

module.exports = { uploadImage, uploadToTelegraph, uploadTo0x0, uploadToTmpfiles, uploadToCatbox }
