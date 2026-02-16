const config = require('../../config')
const fs = require('fs')
const sadCommands = ['sad']
for (let i = 1; i <= 55; i++) {
    sadCommands.push(`sad${i}`)
}

const pluginConfig = {
    name: sadCommands,
    alias: [],
    category: 'media',
    description: 'Kirim musik sad (sad1 - sad55)',
    usage: '.sad1 atau .sad55',
    example: '.sad1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const command = m.command?.toLowerCase()
    
    if (command === 'sad' || !command.startsWith('sad')) {
        return m.reply(
            `🎵 *sᴀᴅ ᴍᴜsɪᴄ*\n\n` +
            `> Tersedia: sad1 - sad55\n` +
            `> Contoh: \`${m.prefix}sad1\``
        )
    }
    
    const num = parseInt(command.replace('sad', ''))
    if (isNaN(num) || num < 1 || num > 55) {
        return m.reply(`❌ Pilihan tidak valid. Gunakan sad1 sampai sad55.`)
    }
    
    try {
        const link = `https://raw.githubusercontent.com/Leoo7z/Music/main/sad-music/${command}.mp3`
        
        await sock.sendMessage(m.chat, {
            audio: { url: link },
            mimetype: 'audio/mpeg',
            fileLength: 99999999999999,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `🎵 Sad Music #${num}`,
                    body: config.bot?.name || 'Ourin MD',
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    thumbnail: fs.readFileSync('./assets/images/ourin2.jpg'),
                    sourceUrl: config.info.website,
                    
                }
            }
        }, { quoted: m })
        
        m.react('🎵')
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
