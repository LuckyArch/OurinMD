const axios = require('axios')

const MUSIC_LIST = []
for (let i = 1; i <= 65; i++) {
    MUSIC_LIST.push(`music${i}`)
}

const pluginConfig = {
    name: 'music',
    alias: MUSIC_LIST,
    category: 'media',
    description: 'Koleksi musik 1-65',
    usage: '.music1 sampai .music65',
    example: '.music1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, command }) {
    const musicNum = command.replace('music', '')
    const num = parseInt(musicNum)
    
    if (isNaN(num) || num < 1 || num > 65) {
        return m.reply(`🎵 *ᴍᴜsɪᴄ ᴄᴏʟʟᴇᴄᴛɪᴏɴ*\n\n> Tersedia: .music1 - .music65`)
    }
    
    m.react('🎵')
    
    try {
        const musicUrl = `https://github.com/Rez4-3yz/Music-rd/raw/master/music/music${num}.mp3`
        
        const response = await axios.get(musicUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        })
        
        await sock.sendMessage(m.chat, {
            audio: Buffer.from(response.data),
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Musik tidak ditemukan atau gagal diambil.`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
