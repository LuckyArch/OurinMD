const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ustadz',
    alias: ['ustad', 'quoteustadz', 'canvasustadz'],
    category: 'canvas',
    description: 'Buat quote gaya ustadz',
    usage: '.ustadz <text>',
    example: '.ustadz Jangan lupa sholat',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `👲 *ᴄᴀɴᴠᴀs ᴜsᴛᴀᴅᴢ*\n\n` +
            `> Masukkan teks untuk dijadikan quote.\n\n` +
            `> Contoh: \`${m.prefix}ustadz Jangan lupa bersyukur\``
        )
    }
    
    m.react('🎨')
    
    try {
        const baseUrl = 'https://api.cuki.biz.id/api/canvas/ustadz'
        const apikey = 'cuki-x'
        
        const response = await axios.get(baseUrl, {
            params: {
                apikey: apikey,
                text: text
            },
            headers: {
                'x-api-key': apikey,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        const data = response.data
        
        if (data.statusCode !== 200 || !data.results?.url) {
            throw new Error(data.message || 'Gagal membuat gambar')
        }
        
        const imageUrl = data.results.url
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `👲 *ᴜsᴛᴀᴅᴢ sᴀʏs:*\n\n"${text}"`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Canvas Ustadz]', err)
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Maaf, sedang ada gangguan pada server canvas.\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
