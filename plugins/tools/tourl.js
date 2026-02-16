const FormData = require('form-data')
const fetch = require('node-fetch')
const fs = require('fs')
const { downloadMediaMessage, getContentType } = require('ourin')

const pluginConfig = {
    name: 'tourl',
    alias: ['upload', 'catbox', 'url'],
    category: 'tools',
    description: 'Upload media ke multiple host dan dapatkan URL',
    usage: '.tourl (reply/kirim media)',
    example: '.tourl',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function uploadToCatbox(buffer, filename) {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, timeout: 30000 })
    if (!res.ok) throw new Error('Catbox gagal')
    const url = await res.text()
    if (!url.startsWith('http')) throw new Error('Invalid response')
    return { host: 'Catbox', url }
}

async function uploadToLitterbox(buffer, filename) {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('time', '72h')
    form.append('fileToUpload', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: form, timeout: 30000 })
    if (!res.ok) throw new Error('Litterbox gagal')
    const url = await res.text()
    if (!url.startsWith('http')) throw new Error('Invalid response')
    return { host: 'Litterbox', url, expires: '72 jam' }
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form, timeout: 30000 })
    if (!res.ok) throw new Error('TmpFiles gagal')
    const data = await res.json()
    if (!data?.data?.url) throw new Error('Invalid response')
    const url = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    return { host: 'TmpFiles', url, expires: '60 menit' }
}

async function uploadToGofile(buffer, filename) {
    const serverRes = await fetch('https://api.gofile.io/servers', { timeout: 10000 })
    const serverData = await serverRes.json()
    if (!serverData?.data?.servers?.[0]?.name) throw new Error('Gofile server gagal')
    
    const server = serverData.data.servers[0].name
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await fetch(`https://${server}.gofile.io/uploadFile`, { method: 'POST', body: form, timeout: 60000 })
    if (!res.ok) throw new Error('Gofile upload gagal')
    const data = await res.json()
    if (!data?.data?.downloadPage) throw new Error('Invalid response')
    return { host: 'Gofile', url: data.data.downloadPage, expires: 'Permanent' }
}

const UPLOADERS = [
    { name: 'Catbox', fn: uploadToCatbox, expires: 'Permanent' },
    { name: 'Litterbox', fn: uploadToLitterbox, expires: '72 jam' },
    { name: 'TmpFiles', fn: uploadToTmpFiles, expires: '60 menit' },
    { name: 'Gofile', fn: uploadToGofile, expires: 'Permanent' }
]

function getFileExtension(mimetype) {
    const mimeMap = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
        'video/mp4': 'mp4', 'video/3gpp': '3gp', 'video/quicktime': 'mov',
        'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/mp4': 'm4a',
        'application/pdf': 'pdf', 'application/zip': 'zip'
    }
    return mimeMap[mimetype] || 'bin'
}

async function handler(m, { sock }) {
    let media = null, mimetype = null, filename = 'file'
    
    if (m.quoted?.message) {
        const type = getContentType(m.quoted.message)
        if (!type || type === 'conversation' || type === 'extendedTextMessage') {
            return m.reply('⚠️ Reply media (gambar/video/audio)!')
        }
        try {
            media = await downloadMediaMessage({ key: m.quoted.key, message: m.quoted.message }, 'buffer', {})
            const content = m.quoted.message[type]
            mimetype = content?.mimetype || 'application/octet-stream'
            filename = content?.fileName || `file.${getFileExtension(mimetype)}`
        } catch (e) {
            return m.reply(`❌ Gagal download: ${e.message}`)
        }
    } else if (m.message) {
        const type = getContentType(m.message)
        if (!type || type === 'conversation' || type === 'extendedTextMessage') {
            return m.reply('⚠️ Kirim media + caption `.tourl` atau reply media')
        }
        try {
            media = await downloadMediaMessage({ key: m.key, message: m.message }, 'buffer', {})
            const content = m.message[type]
            mimetype = content?.mimetype || 'application/octet-stream'
            filename = content?.fileName || `file.${getFileExtension(mimetype)}`
        } catch (e) {
            return m.reply(`❌ Gagal download: ${e.message}`)
        }
    }
    
    if (!media || media.length === 0) {
        return m.reply('⚠️ Media tidak ditemukan!')
    }
    
    m.react('📤')
    
    const results = []
    const failed = []
    
    for (const uploader of UPLOADERS) {
        try {
            const result = await uploader.fn(media, filename)
            results.push({ ...result, expires: uploader.expires })
        } catch (e) {
            failed.push(uploader.name)
        }
    }
    
    if (results.length === 0) {
        m.react('❌')
        return m.reply(`❌ Semua upload gagal!\n\n> Failed: ${failed.join(', ')}`)
    }
    
    let thumbnail = null
    try {
        if (fs.existsSync('./assets/images/ourin2.jpg')) {
            thumbnail = fs.readFileSync('./assets/images/ourin2.jpg')
        }
    } catch {}
    
    let caption = `📤 *ᴍᴜʟᴛɪ ᴜᴘʟᴏᴀᴅ*\n\n`
    caption += `╭┈┈⬡「 📋 *ʀᴇsᴜʟᴛ* 」\n`
    caption += `┃ 📦 Size: *${(media.length / 1024 / 1024).toFixed(2)} MB*\n`
    caption += `┃ ✅ Success: *${results.length}/${UPLOADERS.length}*\n`
    caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    results.forEach((r, i) => {
        caption += `*${i + 1}. ${r.host}* (${r.expires})\n`
        caption += `> ${r.url}\n\n`
    })
    
    if (failed.length > 0) {
        caption += `> ❌ Gagal: ${failed.join(', ')}`
    }
    
    const buttons = []
    
    results.slice(0, 3).forEach(r => {
        buttons.push({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
                display_text: `📋 ${r.host}`,
                copy_code: r.url
            })
        })
    })
    
    if (results[0]?.url) {
        buttons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
                display_text: '🌐 Buka URL',
                url: results[0].url
            })
        })
    }
    
    await sock.sendMessage(m.chat, {
        text: caption,
        contextInfo: {
            externalAdReply: {
                title: '📤 Multi Upload',
                body: `${results.length}/${UPLOADERS.length} host berhasil`,
                thumbnail,
                sourceUrl: results[0]?.url || '',
                mediaType: 1,
                renderLargerThumbnail: true
            }
        },
        interactiveButtons: buttons
    }, { quoted: m })
    
    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
