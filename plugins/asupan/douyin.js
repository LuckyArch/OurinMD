const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'douyin',
    alias: ['douyinvid'],
    category: 'asupan',
    description: 'Video douyin',
    usage: '.douyin',
    example: '.douyin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const apikey = config.APIkey?.betabotz || 'KxUCMqPK'
    
    m.react('⏳')
    
    try {
        const res = await axios.get(`https://api.betabotz.eu.org/api/asupan/douyin?apikey=${apikey}`, { 
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            video: Buffer.from(res.data),
            caption: `🎵 *ᴅᴏᴜʏɪɴ*\n\n> _Powered by Betabotz API_`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Video tidak ditemukan`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
