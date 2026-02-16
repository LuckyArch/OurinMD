const axios = require('axios')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'asupan',
    alias: ['asupanrandom'],
    category: 'asupan',
    description: 'Random video asupan',
    usage: '.asupan',
    example: '.asupan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

function loadJsonData() {
    const tiktokDir = path.join(process.cwd(), 'src', 'tiktok')
    const files = ['bocil.json', 'gheayubi.json', 'kayes.json', 'notnot.json', 'panrika.json', 'santuy.json', 'tiktokgirl.json', 'ukhty.json']
    let allUrls = []
    
    for (const file of files) {
        try {
            const filePath = path.join(tiktokDir, file)
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
                allUrls = allUrls.concat(data.map(d => d.url))
            }
        } catch {}
    }
    
    return allUrls
}

async function handler(m, { sock }) {
    m.react('⏳')
    
    try {
        const urls = loadJsonData()
        
        if (urls.length === 0) {
            m.react('❌')
            return m.reply(`❌ Data asupan tidak tersedia`)
        }
        
        const url = urls[Math.floor(Math.random() * urls.length)]
        
        const res = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 60000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            video: Buffer.from(res.data),
            caption: `🔞 *ᴀsᴜᴘᴀɴ ʀᴀɴᴅᴏᴍ*`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Video asupan tidak ditemukan`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
