const { getAllJadibotSessions } = require('../../src/lib/jadibotManager')
const config = require('../../config')

const pluginConfig = {
    name: 'listjadibot',
    alias: ['jadibotlist', 'alljadibot'],
    category: 'owner',
    description: 'Lihat semua session jadibot',
    usage: '.listjadibot',
    example: '.listjadibot',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const sessions = getAllJadibotSessions()
    
    if (sessions.length === 0) {
        return m.reply(`❌ Tidak ada session jadibot tersimpan`)
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    let txt = `🤖 *ᴅᴀꜰᴛᴀʀ ᴊᴀᴅɪʙᴏᴛ*\n\n`
    txt += `> Total: *${sessions.length}* session\n\n`
    
    sessions.forEach((s, i) => {
        const status = s.isActive ? '🟢 Aktif' : '⚫ Offline'
        txt += `${i + 1}. @${s.id}\n`
        txt += `   Status: ${status}\n`
    })
    
    txt += `\n*ᴄᴏᴍᴍᴀɴᴅs:*\n`
    txt += `> \`${m.prefix}listjadibotaktif\` - Lihat yang aktif\n`
    txt += `> \`${m.prefix}stopalljadibot\` - Stop semua\n`
    txt += `> \`${m.prefix}stopdandeletejadibot @user\` - Hapus session`
    
    const mentions = sessions.map(s => s.jid)
    
    await sock.sendMessage(m.chat, {
        text: txt,
        mentions,
        contextInfo: {
            mentionedJid: mentions,
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
