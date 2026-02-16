const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'unreg',
    alias: ['unregister', 'hapusdaftar'],
    category: 'user',
    description: 'Hapus data pendaftaran kamu dari bot',
    usage: '.unreg',
    example: '.unreg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user?.isRegistered) {
        return m.reply(
            `❌ Kamu belum terdaftar!\n\n` +
            `> Daftar dengan \`${m.prefix}daftar <nama>\``
        )
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    db.setUser(m.sender, {
        isRegistered: false,
        regName: null,
        regAge: null,
        regGender: null
    })
    
    await db.save()
    
    await sock.sendMessage(m.chat, {
        text: `✅ *ᴜɴʀᴇɢɪsᴛᴇʀ ʙᴇʀʜᴀsɪʟ!*\n\n` +
            `Data pendaftaran kamu sudah dihapus.\n\n` +
            `> Untuk daftar ulang: \`${m.prefix}daftar <nama>\``,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
