const axios = require('axios')
const config = require('../../config')
const { downloadContentFromMessage } = require('ourin')
const FormData = require('form-data') 
const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'animeapaini',
    alias: ['whatanime', 'animesearch', 'sauceanime', 'searchanime'],
    category: 'search',
    description: 'Identifikasi anime dari gambar/screenshot',
    usage: '.animeapaini (reply gambar)',
    example: '.animeapaini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}


async function uploadToTempfiles(buffer) {
    const form = new FormData()
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    
    const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000
    })
    
    if (response.data?.data?.url) {
        return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    throw new Error('Upload gagal')
}


async function handler(m, { sock }) {
    let imageBuffer = null
    let imageMsg = null
    
    if (m.isImage && m.message?.imageMessage) {
        imageMsg = m.message.imageMessage
    } else if (m.quoted?.isImage && m.quoted?.message?.imageMessage) {
        imageMsg = m.quoted.message.imageMessage
    } else if (m.quoted?.isImage) {
        try {
            imageBuffer = await m.quoted.download()
        } catch (e) {}
    }
    
    if (m.isVideo || m.quoted?.isVideo) {
        return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴅᴜᴋᴜɴɢ*\n\n> Hanya gambar/screenshot yang didukung\n> Video tidak bisa diproses\n\n\`Reply atau kirim gambar dengan caption ${m.prefix}animeapaini\``)
    }
    
    if (!imageMsg && !imageBuffer) {
        return m.reply(
            `🔍 *ᴀɴɪᴍᴇ ᴀᴘᴀ ɪɴɪ?*\n\n` +
            `> Kirim gambar dengan caption:\n` +
            `> \`${m.prefix}animeapaini\`\n\n` +
            `> Atau reply gambar dengan:\n` +
            `> \`${m.prefix}animeapaini\`\n\n` +
            `⚠️ *Catatan:* Video tidak didukung, hanya gambar/screenshot`
        )
    }
    
    m.react('🔍')
    
    try {
        if (!imageBuffer && imageMsg) {
            const stream = await downloadContentFromMessage(imageMsg, 'image')
            let chunks = []
            for await (const chunk of stream) {
                chunks.push(chunk)
            }
            imageBuffer = Buffer.concat(chunks)
        }
        
        if (!imageBuffer || imageBuffer.length < 100) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil gambar. Coba kirim ulang.`)
        }
        
        await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ᴀɴɪᴍᴇ...*\n\n> _Mengupload dan menganalisis gambar..._`)
        
        const imageUrl = await uploadToTempfiles(imageBuffer)
        
        const res = await axios.get(`https://api.neoxr.eu/api/whatanime?url=${encodeURIComponent(imageUrl)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data) {
            m.react('❌')
            return m.reply(`❌ Anime tidak ditemukan. Coba dengan screenshot yang lebih jelas.`)
        }
        
        const d = res.data.data
        
        const similarity = ((d.similarity || 0) * 100).toFixed(2)
        
        const formatTime = (seconds) => {
            if (!seconds) return '00:00'
            const mins = Math.floor(seconds / 60)
            const secs = Math.floor(seconds % 60)
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        
        const filename = d.filename || 'Unknown'
        const animeName = filename.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/\.mp4|\.mkv|\.avi/gi, '').trim() || 'Unknown Anime'
        
        const caption = `🔍 *ᴀɴɪᴍᴇ ᴀᴘᴀ ɪɴɪ?*\n\n` +
            `🎬 *Anime:* ${animeName}\n` +
            `📺 *Episode:* ${d.episode || 'Movie/OVA'}\n` +
            `🆔 *AniList ID:* ${d.anilist || '-'}\n\n` +
            `⏱️ *Timestamp:*\n` +
            `  ◦ From: \`${formatTime(d.from)}\`\n` +
            `  ◦ To: \`${formatTime(d.to)}\`\n\n` +
            `📊 *Similarity:* ${similarity}%\n\n` +
            `🔗 https://anilist.co/anime/${d.anilist || ''}`
        
        m.react('✅')
        
        if (d.image) {
            await sock.sendMessage(m.chat, {
                image: { url: d.image },
                caption
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }
        
        if (d.video) {
            await sock.sendMessage(m.chat, {
                video: { url: d.video },
                caption: `🎬 *Preview Scene*\n\n> ${animeName}\n> Episode ${d.episode || 'Movie'} @ ${formatTime(d.at)}`,
            }, { quoted: m })
        }
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
