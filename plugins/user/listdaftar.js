const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'listdaftar',
    alias: ['listuser', 'registeredusers', 'daftarlist'],
    category: 'user',
    description: 'Lihat daftar user yang sudah terdaftar',
    usage: '.listdaftar',
    example: '.listdaftar',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const allUsers = db.getAllUsers()
    
    const registeredUsers = Object.values(allUsers).filter(u => u.isRegistered)
    
    if (registeredUsers.length === 0) {
        return m.reply(`❌ Belum ada user yang terdaftar!`)
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    let text = `📋 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ ᴛᴇʀᴅᴀꜰᴛᴀʀ*\n\n`
    text += `> Total: *${registeredUsers.length}* user\n\n`
    
    const displayUsers = registeredUsers.slice(0, 50)
    
    displayUsers.forEach((user, i) => {
        const genderEmoji = user.regGender === 'Laki-laki' ? '👨' : user.regGender === 'Perempuan' ? '👩' : '👤'
        text += `${i + 1}. ${genderEmoji} *${user.regName || 'Unknown'}*\n`
        text += `   > @${user.jid} | ${user.regAge || '?'} tahun\n`
    })
    
    if (registeredUsers.length > 50) {
        text += `\n... dan ${registeredUsers.length - 50} user lainnya`
    }
    
    const mentions = displayUsers.map(u => u.jid + '@s.whatsapp.net')
    
    await sock.sendMessage(m.chat, {
        text,
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
