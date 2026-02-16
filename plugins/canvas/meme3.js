const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'meme3',
    alias: ['3panel'],
    category: 'canvas',
    description: 'Membuat meme 3 panel',
    usage: '.meme3 <text1>|<text2>|<text3>',
    example: '.meme3 Kemarin ada apa?|Gak tau mau tidur|Kemaren kan lu belom beli',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const input = m.text?.trim() || ''
    const parts = input.split('|').map(s => s.trim())
    
    if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) {
        return m.reply(
            `🎭 *ᴍᴇᴍᴇ 3 ᴘᴀɴᴇʟ*\n\n` +
            `> Masukkan 3 teks dengan pemisah |\n\n` +
            `> Contoh: \`${m.prefix}meme3 Text1|Text2|Text3\``
        )
    }
    
    const text1 = parts[0]
    const text2 = parts[1]
    const text3 = parts[2]
    
    const apikey = config.APIkey?.lolhuman
    if (!apikey) {
        return m.reply(`❌ API key lolhuman tidak dikonfigurasi!`)
    }
    
    m.react('🎭')
    
    try {
        const apiUrl = `https://api.lolhuman.xyz/api/meme6?apikey=${apikey}&text1=${encodeURIComponent(text1)}&text2=${encodeURIComponent(text2)}&text3=${encodeURIComponent(text3)}`
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `🎭 *ᴍᴇᴍᴇ 3 ᴘᴀɴᴇʟ*`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
