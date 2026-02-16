const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'sistemdaftar',
    alias: ['regmode', 'wajibdaftar', 'togglereg'],
    category: 'owner',
    description: 'Toggle sistem wajib daftar on/off',
    usage: '.sistemdaftar <on/off>',
    example: '.sistemdaftar on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text?.trim().toLowerCase()
    
    const currentStatus = db.setting('registrationRequired') ?? config.registration?.enabled ?? false
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    if (!args) {
        return m.reply(
            `⚙️ *sɪsᴛᴇᴍ ᴅᴀꜰᴛᴀʀ*\n\n` +
            `Status: ${currentStatus ? '✅ ON (Wajib Daftar)' : '❌ OFF'}\n\n` +
            `*Usage:*\n` +
            `> \`${m.prefix}sistemdaftar on\` - Wajibkan daftar\n` +
            `> \`${m.prefix}sistemdaftar off\` - Matikan wajib daftar\n\n` +
            `> Jika ON, user harus \`${m.prefix}daftar\` sebelum pakai command`
        )
    }
    
    if (args === 'on' || args === '1' || args === 'true') {
        db.setting('registrationRequired', true)
        await db.save()
        
        await sock.sendMessage(m.chat, {
            text: `✅ *sɪsᴛᴇᴍ ᴅᴀꜰᴛᴀʀ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!*\n\n` +
                `User sekarang wajib daftar sebelum menggunakan command!\n\n` +
                `> Command: \`${m.prefix}daftar <nama>\``,
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
        return
    }
    
    if (args === 'off' || args === '0' || args === 'false') {
        db.setting('registrationRequired', false)
        await db.save()
        
        await sock.sendMessage(m.chat, {
            text: `❌ *sɪsᴛᴇᴍ ᴅᴀꜰᴛᴀʀ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!*\n\n` +
                `User tidak perlu daftar untuk menggunakan command.`,
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
        
        m.react('❌')
        return
    }
    
    return m.reply(`❌ Option tidak valid!\n\n> Gunakan: \`on\` atau \`off\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
