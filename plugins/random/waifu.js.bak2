const axios = require('axios')

const pluginConfig = {
    name: 'waifu',
    alias: ['randomwaifu'],
    category: 'random',
    description: 'Random waifu image',
    usage: '.waifu',
    example: '.waifu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: false
}

async function handler(m, { sock }) {
    m.react('🎀')
    
    try {
        const url = `https://api-faa.my.id/faa/waifu`
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🎀 *ʀᴀɴᴅᴏᴍ ᴡᴀɪꜰᴜ*`
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
