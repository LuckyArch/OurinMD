const axios = require('axios')
const cheerio = require('cheerio')
const { getDatabase } = require('./database')
const { logger } = require('./colors')

const SUPPORTED_PLATFORMS = [
    'tiktok.com',
    'instagram.com',
    'fb.com',
    'facebook.com',
    'youtube.com',
    'youtu.be',
    'telegram.me',
    't.me',
    'discord.gg',
    'twitter.com',
    'x.com'
]

function containsSupportedLink(text) {
    if (!text) return false
    const lowerText = text.toLowerCase()
    return SUPPORTED_PLATFORMS.some(platform => lowerText.includes(platform))
}

async function fetchInitialPage(initialUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185) AppleWebKit/537.36 Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': initialUrl
    }
    
    const response = await axios.get(initialUrl, { headers, timeout: 15000 })
    const $ = cheerio.load(response.data)
    
    const csrfToken = $('meta[name="csrf-token"]').attr('content')
    if (!csrfToken) throw new Error('Token tidak ditemukan')
    
    let cookies = ''
    if (response.headers['set-cookie']) {
        cookies = response.headers['set-cookie'].join('; ')
    }
    
    return { csrfToken, cookies }
}

async function postDownloadRequest(downloadUrl, userUrl, csrfToken, cookies) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185) AppleWebKit/537.36 Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://on4t.com/online-video-downloader',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookies
    }
    
    const postData = new URLSearchParams()
    postData.append('_token', csrfToken)
    postData.append('link[]', userUrl)
    
    const response = await axios.post(downloadUrl, postData.toString(), { headers, timeout: 30000 })
    
    if (response.data?.result?.length) {
        return response.data.result.map(item => ({
            title: item.title || 'Media',
            thumb: item.image,
            url: item.video_file_url || item.videoimg_file_url
        }))
    }
    
    throw new Error('Tidak ada hasil')
}

async function downloadAndDetectType(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })
    const buffer = Buffer.from(response.data)
    
    const { fromBuffer } = require('file-type')
    const fileInfo = await fromBuffer(buffer)
    
    return { buffer, fileInfo }
}

async function handleAutoDownload(m, sock, text) {
    if (!m.isGroup) return
    
    const db = getDatabase()
    const groupData = db.getGroup(m.chat)
    
    if (!groupData?.autodl) return
    if (!containsSupportedLink(text)) return

    m.react('🕕')
    
    try {
        const initialUrl = 'https://on4t.com/online-video-downloader'
        const downloadUrl = 'https://on4t.com/all-video-download'
        
        const { csrfToken, cookies } = await fetchInitialPage(initialUrl)
        const results = await postDownloadRequest(downloadUrl, text, csrfToken, cookies)
        
        if (!results || results.length === 0) return
        
        for (const result of results) {
            if (!result.url) continue
            
            try {
                const { buffer, fileInfo } = await downloadAndDetectType(result.url)
                
                if (!fileInfo) {
                    await sock.sendMessage(m.chat, { 
                        document: buffer, 
                        fileName: `${result.title}.bin`,
                        mimetype: 'application/octet-stream'
                    }, { quoted: m })
                    continue
                }
                
                const mime = fileInfo.mime
                
                if (mime.startsWith('video/')) {
                    await sock.sendMessage(m.chat, {
                        video: buffer,
                        caption: `📹 ${result.title}`,
                        mimetype: mime
                    }, { quoted: m })
                } else if (mime.startsWith('audio/')) {
                    await sock.sendMessage(m.chat, {
                        audio: buffer,
                        mimetype: mime
                    }, { quoted: m })
                } else if (mime.startsWith('image/')) {
                    await sock.sendMessage(m.chat, {
                        image: buffer,
                        caption: `🖼️ ${result.title}`
                    }, { quoted: m })
                } else {
                    await sock.sendMessage(m.chat, {
                        document: buffer,
                        fileName: `${result.title}.${fileInfo.ext}`,
                        mimetype: mime
                    }, { quoted: m })
                }
                
            } catch (e) {
                logger.error('AutoDL', `Failed to send: ${e.message}`)
            }
        }
        
        m.react('💕')
        
    } catch (err) {
        m.react('😳')
        logger.error('AutoDL', err.message)
    }
}

module.exports = {
    handleAutoDownload,
    containsSupportedLink,
    SUPPORTED_PLATFORMS
}
