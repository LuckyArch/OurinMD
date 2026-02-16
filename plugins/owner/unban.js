const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'unban',
    alias: ['delban', 'unblock'],
    category: 'owner',
    description: 'Menghapus user dari daftar banned',
    usage: '.unban <nomor/@tag>',
    example: '.unban 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`✅ *ᴜɴʙᴀɴ ᴜsᴇʀ*\n\n> Masukkan nomor atau tag user\n\n\`Contoh: ${m.prefix}unban 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    const cleanTarget = targetNumber.replace(/[^0-9]/g, '')
    const index = config.bannedUsers.findIndex(num => {
        const cleanNum = num.replace(/[^0-9]/g, '')
        return cleanNum.includes(cleanTarget) || cleanTarget.includes(cleanNum)
    })
    
    if (index === -1) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` tidak dalam daftar banned`)
    }
    
    config.bannedUsers.splice(index, 1)
    
    const db = getDatabase()
    db.setting('bannedUsers', config.bannedUsers)
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴜsᴇʀ ᴅɪᴜɴʙᴀɴ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNumber}\`\n` +
        `┃ ✅ sᴛᴀᴛᴜs: \`Unbanned\`\n` +
        `┃ 📊 ᴛᴏᴛᴀʟ: \`${config.bannedUsers.length}\` ᴜsᴇʀ\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
