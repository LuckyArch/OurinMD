const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'iqc',
    alias: ['iqchat', 'iphonechat'],
    category: 'canvas',
    description: 'Membuat gambar chat iPhone style',
    usage: '.iqc <text>',
    example: '.iqc Hai cantik',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> Masukkan teks untuk chat\n\n\`Contoh: ${m.prefix}iqc Hai cantik\``)
    }
    
    m.react('📱')
    
    try {
        const now = new Date()
        const time = require("moment-timezone").tz("Asia/Jakarta").format("HH:mm")

        await sock.sendMessage(m.chat, {
            image: { url: `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(text)}` },
            caption: `📱 *ɪǫᴄ ᴄʜᴀᴛ*\n\n> \`${text}\``
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
