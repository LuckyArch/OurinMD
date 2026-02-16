const config = require('../../config')
const fs = require("fs")
const soundCommands = ['sound']
for (let i = 1; i <= 250; i++) {
    soundCommands.push(`sound${i}`)
}

const pluginConfig = {
    name: soundCommands,
    alias: [],
    category: 'media',
    description: 'Kirim sound effect (sound1 - sound250)',
    usage: '.sound1 atau .sound250',
    example: '.sound1',
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
    
    if (command === 'sound' || !command.startsWith('sound')) {
        return m.reply(
            `🔊 *sᴏᴜɴᴅ ᴇꜰꜰᴇᴄᴛ*\n\n` +
            `> Tersedia: sound1 - sound250\n` +
            `> Contoh: \`${m.prefix}sound1\``
        )
    }
    
    const num = parseInt(command.replace('sound', ''))
    if (isNaN(num) || num < 1 || num > 250) {
        return m.reply(`❌ Pilihan tidak valid. Gunakan sound1 sampai sound250.`)
    }
    
    try {
        const link = `https://raw.githubusercontent.com/Leoo7z/Music/main/${command}.mp3`
        
        await sock.sendMessage(m.chat, {
            audio: { url: link },
            mimetype: 'audio/mpeg',
            fileLength: 99999999999999,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                                    title: `🎵 Sound #${num}`,
                                    body: config.bot?.name || 'Ourin MD',
                                    mediaType: 1,
                                    renderLargerThumbnail: false,
                                    thumbnail: fs.readFileSync('./assets/images/ourin2.jpg'),
                                    sourceUrl: config.info.website,
                                    
                                }
            }
        }, { quoted: m })
        
        m.react('🔊')
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
