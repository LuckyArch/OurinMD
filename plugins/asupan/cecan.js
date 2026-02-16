const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'cecan',
    alias: ['cewek', 'cewekindo'],
    category: 'asupan',
    description: 'Video cewek cantik',
    usage: '.cecan',
    example: '.cecan',
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
        const res = await axios.get(`https://api.betabotz.eu.org/api/api/asupan/cecan?apikey=${apikey}`, { 
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            video: Buffer.from(res.data),
            caption: `💃 *ᴄᴇᴄᴀɴ*\n\n> _Powered by Betabotz API_`
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
