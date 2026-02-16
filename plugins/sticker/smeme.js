const axios = require('axios')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'smeme',
    alias: ['memesticker', 'memes'],
    category: 'sticker',
    description: 'Membuat sticker meme dari gambar',
    usage: '.smeme <top>|<bottom>',
    example: '.smeme Ketika|Kamu Lupa',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    const isSticker = m.isSticker || (m.quoted && (m.quoted.isSticker || m.quoted.type === 'stickerMessage'))
    
    if (!isImage && !isSticker) {
        return m.reply(`😂 *ᴍᴇᴍᴇ sᴛɪᴄᴋᴇʀ*\n\n> Reply atau kirim gambar/sticker dengan caption\n\n\`Contoh: ${m.prefix}smeme Top|Bottom\``)
    }
    
    const input = m.args.join(' ')
    if (!input || !input.includes('|')) {
        return m.reply(`😂 *ᴍᴇᴍᴇ sᴛɪᴄᴋᴇʀ*\n\n> Format: top|bottom\n\n\`Contoh: ${m.prefix}smeme Ketika|Kamu Lupa\``)
    }
    
    const [top, bottom] = input.split('|').map(s => s.trim())
    
    m.react('😂')
    
    try {
        let mediaBuffer
        
        if (m.quoted) {
            mediaBuffer = await m.quoted.download()
        } else if (m.download) {
            mediaBuffer = await m.download()
        }
        
        if (!mediaBuffer) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh media`)
        }
        
        // Convert ke PNG
        let imageBuffer
        try {
            imageBuffer = await sharp(mediaBuffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .png()
                .toBuffer()
        } catch (e) {
            console.log('[SMEME] Sharp resize failed:', e.message)
            imageBuffer = mediaBuffer
        }
        
        // Upload ke tmpfiles.org (lebih reliable)
        const FormData = require('form-data')
        const form = new FormData()
        form.append('file', imageBuffer, { filename: 'meme.png', contentType: 'image/png' })
        
        let imageUrl
        
        // Coba beberapa host
        try {
            const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
                headers: form.getHeaders(),
                timeout: 30000
            })
            if (uploadRes.data?.data?.url) {
                imageUrl = uploadRes.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
            }
        } catch (e) {
            console.log('[SMEME] tmpfiles failed, trying telegraph...')
        }
        
        // Fallback ke telegraph
        if (!imageUrl) {
            try {
                const form2 = new FormData()
                form2.append('file', imageBuffer, { filename: 'meme.png', contentType: 'image/png' })
                const telegraphRes = await axios.post('https://telegra.ph/upload', form2, {
                    headers: form2.getHeaders(),
                    timeout: 30000
                })
                if (telegraphRes.data?.[0]?.src) {
                    imageUrl = 'https://telegra.ph' + telegraphRes.data[0].src
                }
            } catch (e) {
                console.log('[SMEME] Telegraph failed:', e.message)
            }
        }
        
        if (!imageUrl) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal upload gambar, coba lagi nanti`)
        }
        
        console.log('[SMEME] Image uploaded:', imageUrl)
        
        // Encode text untuk URL memegen.link
        const encodeText = (text) => {
            if (!text) return '_'
            return encodeURIComponent(text)
                .replace(/-/g, '--')
                .replace(/_/g, '__')
                .replace(/%20/g, '_')
        }
        
        const topEncoded = encodeText(top)
        const bottomEncoded = encodeText(bottom)
        const memeUrl = `https://api.memegen.link/images/custom/${topEncoded}/${bottomEncoded}.png?background=${encodeURIComponent(imageUrl)}`
        
        console.log('[SMEME] Meme URL:', memeUrl)
        
        const response = await axios.get(memeUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
        const buffer = Buffer.from(response.data)
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: 'Ourin-AI',
            author: m.pushName || 'User'
        })
        
        m.react('✅')
        
    } catch (error) {
        console.log('[SMEME] Error:', error.message)
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
