const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'anime-gen',
    alias: ['animegen', 'aianimegen', 'genai-anime'],
    category: 'ai',
    description: 'Generate AI anime art dari prompt',
    usage: '.anime-gen <prompt>',
    example: '.anime-gen girl, vibrant color, smilling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 3,
    isEnabled: true
}

let thumbAnime = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-ai.jpg')
    if (fs.existsSync(p)) thumbAnime = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body, thumbnail) {
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

    const thumb = thumbnail || thumbAnime
    if (thumb) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumb,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function handler(m, { sock }) {
    const prompt = m.text?.trim() || ''
    
    if (!prompt) {
        return m.reply(
            `🎨 *ᴀɴɪᴍᴇ ᴀʀᴛ ɢᴇɴᴇʀᴀᴛᴏʀ*\n\n` +
            `> Generate gambar anime AI dari prompt!\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}anime-gen <deskripsi>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}anime-gen girl, vibrant color, smilling, yellow pink gradient hair\`\n` +
            `> \`${m.prefix}anime-gen boy, dark aesthetic, silver hair, red eyes\`\n\n` +
            `*ᴛɪᴘs:*\n` +
            `> • Gunakan bahasa Inggris\n` +
            `> • Makin detail prompt, makin bagus hasil\n` +
            `> • Tambahkan style: vibrant, dark, pastel, etc`
        )
    }
    
    m.react('🎨')
    await m.reply(`⏳ *ɢᴇɴᴇʀᴀᴛɪɴɢ...*\n\n> Prompt: _${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}_`)
    
    try {
        const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'
        const apiUrl = `https://api.neoxr.eu/api/ai-anime?q=${encodeURIComponent(prompt)}&apikey=${NEOXR_APIKEY}`
        
        const { data } = await axios.get(apiUrl, { timeout: 120000 })
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Gagal generate gambar. Coba lagi nanti!')
        }
        
        const result = data.data
        
        let thumbBuffer = null
        try {
            const thumbRes = await axios.get(result.url, { 
                responseType: 'arraybuffer', 
                timeout: 30000 
            })
            thumbBuffer = Buffer.from(thumbRes.data)
        } catch {}
        
        const caption = `🎨 *ᴀɴɪᴍᴇ ᴀʀᴛ ɢᴇɴᴇʀᴀᴛᴇᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🎭 Prompt:\n` +
            `┃ _${result.prompt || prompt}_\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> ${config.bot?.name || 'Ourin-AI'}`
        
        await sock.sendMessage(m.chat, {
            image: { url: result.url },
            caption,
            contextInfo: getContextInfo('🎨 AI ANIME', result.prompt || prompt, thumbBuffer)
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        if (error.code === 'ECONNABORTED') {
            m.reply('⏱️ *ᴛɪᴍᴇᴏᴜᴛ*\n\n> Request terlalu lama. Coba lagi!')
        } else {
            m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
