const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')
const { downloadMediaMessage } = require('ourin')
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'faceswap',
    alias: ['fs', 'swapface'],
    category: 'ai',
    description: 'Tukar wajah dari 2 gambar',
    usage: '.faceswap (kirim/reply 2 gambar)',
    example: '.faceswap',
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

const faceswapSessions = new Map()

let thumbAI = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-ai.jpg')
    if (fs.existsSync(p)) thumbAI = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbAI) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbAI,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000
    })
    
    if (!res.data?.data?.url) throw new Error('Upload gagal')
    return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

async function handler(m, { sock }) {
    const session = faceswapSessions.get(m.sender)
    
    let imageBuffer = null
    
    if (m.quoted?.message) {
        const quotedType = Object.keys(m.quoted.message)[0]
        if (quotedType === 'imageMessage' || m.quoted.message?.imageMessage) {
            try {
                imageBuffer = await downloadMediaMessage(
                    { key: m.quoted.key, message: m.quoted.message },
                    'buffer',
                    {}
                )
            } catch {}
        }
    }
    
    if (!imageBuffer && m.message) {
        const msgType = Object.keys(m.message)[0]
        if (msgType === 'imageMessage' || m.message?.imageMessage) {
            try {
                imageBuffer = await m.download()
            } catch {}
        }
    }
    
    if (!session) {
        if (!imageBuffer) {
            return m.reply(
                `🔄 *ꜰᴀᴄᴇsᴡᴀᴘ*\n\n` +
                `> Tukar wajah dari 2 gambar\n\n` +
                `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
                `┃ 1. Kirim gambar pertama (wajah sumber)\n` +
                `┃ 2. Kirim gambar kedua (target)\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Kirim gambar pertama + caption \`${m.prefix}faceswap\``
            )
        }
        
        await m.react('1️⃣')
        
        const sourceUrl = await uploadToTmpFiles(imageBuffer, 'source.jpg')
        
        faceswapSessions.set(m.sender, {
            sourceUrl,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            faceswapSessions.delete(m.sender)
        }, 300000)
        
        return m.reply(
            `✅ *ɢᴀᴍʙᴀʀ 1 ᴅɪsɪᴍᴘᴀɴ*\n\n` +
            `> Sekarang kirim gambar kedua (target)\n` +
            `> dengan caption \`${m.prefix}faceswap\`\n\n` +
            `> ⏱️ Session berlaku 5 menit`
        )
    }
    
    if (!imageBuffer) {
        return m.reply(
            `⚠️ *ᴋɪʀɪᴍ ɢᴀᴍʙᴀʀ ᴋᴇᴅᴜᴀ*\n\n` +
            `> Kirim gambar kedua (target) + caption \`${m.prefix}faceswap\``
        )
    }
    
    await m.react('2️⃣')
    
    try {
        const targetUrl = await uploadToTmpFiles(imageBuffer, 'target.jpg')
        
        await m.reply('🔄 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Menukar wajah, tunggu sebentar...')
        
        const apiUrl = `https://api.neoxr.eu/api/faceswap?source=${encodeURIComponent(session.sourceUrl)}&target=${encodeURIComponent(targetUrl)}&apikey=${NEOXR_APIKEY}`
        
        const { data } = await axios.get(apiUrl, { timeout: 120000 })
        
        faceswapSessions.delete(m.sender)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon atau error')
        }
        
        await sock.sendMessage(m.chat, {
            image: { url: data.data.url },
            caption: `🔄 *ꜰᴀᴄᴇsᴡᴀᴘ ʙᴇʀʜᴀsɪʟ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📁 File: ${data.data.filename || '-'}\n` +
                `┃ 📦 Size: ${data.data.size || '-'}\n` +
                `╰┈┈┈┈┈┈┈┈⬡`,
            contextInfo: getContextInfo('🔄 FACESWAP', 'AI Face Swap')
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        faceswapSessions.delete(m.sender)
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
