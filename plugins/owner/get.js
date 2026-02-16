const config = require('../../config')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'get',
    alias: ['fetch', 'http', 'request', 'curl'],
    category: 'owner',
    description: 'Advanced HTTP GET/POST request (Owner Only)',
    usage: '.get <url> [--post] [--json body]',
    example: '.get https://api.example.com --post --json {"key":"value"}',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

const MAX_CHAT_LENGTH = 1500

function detectExtension(contentType = '') {
    if (contentType.includes('json')) return 'json'
    if (contentType.includes('html')) return 'html'
    if (contentType.includes('xml')) return 'xml'
    if (contentType.includes('javascript')) return 'js'
    if (contentType.includes('css')) return 'css'
    if (contentType.includes('yaml')) return 'yml'
    if (contentType.includes('text')) return 'txt'
    if (contentType.includes('png')) return 'png'
    if (contentType.includes('jpeg')) return 'jpg'
    if (contentType.includes('mp4')) return 'mp4'
    if (contentType.includes('mpeg')) return 'mp3'
    return 'bin'
}

function getMimeCategory(type = '') {
if (type === 'image/gif') return 'gif'
if (type.startsWith('audio/')) return 'audio'
if (type.startsWith('video/')) return 'video'
if (type.startsWith('image/')) return 'image'
if (type.startsWith('text/') || type.includes('json')) return 'text'
return 'document'
}

function isBlockedUrl(url) {
    return (
        url.includes('localhost') ||
        url.includes('127.0.0.1') ||
        url.includes('0.0.0.0')
    )
}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *Owner Only!*')
    }

    let input = m.fullArgs?.trim() || m.text?.trim()
    if (!input) {
        return m.reply(
            `🌐 *HTTP REQUEST*\n\n` +
            `> .get <url>\n` +
            `> .get <url> --post\n` +
            `> .get <url> --post --json {"key":"value"}`
        )
    }

    const isPost = input.includes('--post')
    input = input.replace(/--post/gi, '').trim()

    let jsonBody = null
    const jsonMatch = input.match(/--json\s+(\{[\s\S]*\})/i)
    if (jsonMatch) {
        try {
            jsonBody = JSON.parse(jsonMatch[1])
            input = input.replace(/--json\s+\{[\s\S]*\}/i, '').trim()
        } catch (e) {
            return m.reply(`❌ Invalid JSON\n> ${e.message}`)
        }
    }

    let url = input
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
    }

    if (isBlockedUrl(url)) {
        return m.reply('❌ Localhost / internal address blocked')
    }

    try {
        new URL(url)
    } catch {
        return m.reply('❌ Invalid URL')
    }

    await m.reply(`⏳ Fetching ${isPost ? 'POST' : 'GET'} ${url}`)

    try {
        const startTime = Date.now()

        const axiosConfig = {
            timeout: 120000,
            maxRedirects: 5,
            validateStatus: () => true,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Ourin-Bot/2.0',
                'Accept': '*/*',
                ...(isPost ? { 'Content-Type': 'application/json' } : {})
            }
        }

        const response = isPost
            ? await axios.post(url, jsonBody, axiosConfig)
            : await axios.get(url, axiosConfig)

        const elapsed = Date.now() - startTime
        const contentType = response.headers['content-type'] || ''
        const mimeType = contentType.split(';')[0]
        const ext = detectExtension(contentType)
        const category = getMimeCategory(mimeType)

        const buffer = Buffer.from(response.data)
        const size = buffer.length
        const statusEmoji = response.status >= 200 && response.status < 300 ? '✅' : '⚠️'

        const header =
`🌐 *HTTP RESPONSE*

╭┈┈⬡「 📋 INFO 」
┃ ${statusEmoji} Status: ${response.status} ${response.statusText}
┃ ⏱️ Time: ${elapsed}ms
┃ 📦 Size: ${size} bytes
┃ 📄 Type: ${mimeType || 'unknown'}
╰┈┈┈┈┈┈┈┈⬡`
if (category === 'gif') {
await sock.sendMessage(m.chat, {
video: buffer,
gifPlayback: true,
mimetype: 'video/mp4',
caption: header
}, { quoted: m })
        } else
        if (category === 'audio') {
            await sock.sendMessage(m.chat, {
                audio: buffer,
                mimetype: mimeType
            }, { quoted: m })

        } else if (category === 'video') {
            await sock.sendMessage(m.chat, {
                video: buffer,
                mimetype: mimeType,
                caption: header
            }, { quoted: m })

        } else if (category === 'image') {
            await sock.sendMessage(m.chat, {
                image: buffer,
                mimetype: mimeType,
                caption: header
            }, { quoted: m })

        } else if (category === 'text' && buffer.length <= MAX_CHAT_LENGTH) {
            const text = buffer.toString()
            await m.reply(header + `\n\n\`\`\`${text}\`\`\``)

        } else {
            const fileName = `response_${Date.now()}.${ext}`
            await sock.sendMessage(m.chat, {
                document: buffer,
                fileName,
                mimetype: mimeType || 'application/octet-stream',
                caption: header + '\n\n📎 Full response dikirim sebagai file'
            }, { quoted: m })
        }

    } catch (e) {
        await m.reply(
            `❌ *REQUEST FAILED*\n\n> ${e.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}