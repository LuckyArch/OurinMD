const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'bratvermeil',
    alias: ['bratv', 'bratnime'],
    category: 'sticker',
    description: 'Membuat sticker brat versi Vermeil',
    usage: '.bratvermeil <text>',
    example: '.bratvermeil Jangan lupa makan',
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
            `👿 *ʙʀᴀᴛ ᴠᴇʀᴍᴇɪʟ*\n\n` +
            `> Masukkan teks untuk dijadikan sticker.\n\n` +
            `> Contoh: \`${m.prefix}bratvermeil Jangan lupa makan\``
        )
    }
    
    m.react('🎨')
    
    try {
        const baseUrl = 'https://api.cuki.biz.id/api/canvas/brat/bratnime-vermeil'
        const apikey = 'cuki-x'
        
        const response = await axios.get(baseUrl, {
            params: {
                apikey: apikey,
                text: text
            },
            headers: {
                'x-api-key': apikey,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            responseType: 'arraybuffer' // User said "response type image", so we expect buffer
        })
        
        // Check if response is JSON (error)
        try {
            const json = JSON.parse(response.data.toString())
            if (json.statusCode && json.statusCode !== 200) {
                throw new Error(json.message || 'Gagal membuat sticker')
            }
        } catch (e) {
            // Not JSON, continue as image buffer
        }

        const buffer = Buffer.from(response.data)
        
        await sock.sendImageAsSticker(m.chat, buffer, m, {
            packname: config.sticker?.packname || 'Ourin-AI',
            author: config.sticker?.author || 'Brat Vermeil'
        })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Brat Vermeil]', err)
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Maaf, sedang ada gangguan pada server.\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
