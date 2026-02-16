const axios = require('axios')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'ukhty',
    alias: ['ukht'],
    category: 'asupan',
    description: 'Video ukhty',
    usage: '.ukhty',
    example: '.ukhty',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function loadJsonData(filename) {
    try {
        const filePath = path.join(process.cwd(), 'src', 'tiktok', filename)
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        }
    } catch {}
    return []
}

async function handler(m, { sock }) {
    m.react('⏳')
    
    try {
        const data = loadJsonData('ukhty.json')
        
        if (data.length === 0) {
            m.react('❌')
            return m.reply(`❌ Data tidak tersedia`)
        }
        
        const item = data[Math.floor(Math.random() * data.length)]
        
        const res = await axios.get(item.url, { 
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            video: Buffer.from(res.data),
            caption: `🧕 *ᴜᴋʜᴛʏ*`
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
