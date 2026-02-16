const axios = require('axios')

const pluginConfig = {
    name: 'txt2qr',
    alias: ['texttoqr', 'qrcode', 'qrcreate'],
    category: 'tools',
    description: 'Generate QR code dari teks',
    usage: '.txt2qr <text>',
    example: '.txt2qr https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(`📱 *ᴛᴇxᴛ ᴛᴏ Qʀ*\n\n> Masukkan teks/URL\n\n\`Contoh: ${m.prefix}txt2qr https://google.com\``)
    }
    
    m.react('📱')
    
    try {
        const url = `https://api-faa.my.id/faa/qr-create?text=${encodeURIComponent(text)}`
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `📱 *Qʀ ᴄᴏᴅᴇ*\n\n> ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
