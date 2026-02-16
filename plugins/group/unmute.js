const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'unmute',
    alias: ['unbisukan'],
    category: 'group',
    description: 'Membatalkan mute member',
    usage: '.unmute @user',
    example: '.unmute @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let targetUser = null
    if (m.quoted) {
        targetUser = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0]
    }
    
    if (!targetUser) {
        await m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Reply pesan user + \`${m.prefix}unmute\`\n` +
            `> Atau: \`${m.prefix}unmute @user\``
        )
        return
    }
    
    let groupData = db.getGroup(m.chat) || {}
    let mutedUsers = groupData.mutedUsers || {}
    
    const targetName = targetUser.split('@')[0]
    
    if (!mutedUsers[targetUser]) {
        await m.reply(`✅ @${targetName} tidak sedang di-mute.`, { mentions: [targetUser] })
        return
    }
    
    delete mutedUsers[targetUser]
    db.setGroup(m.chat, { ...groupData, mutedUsers: mutedUsers })
    
    await m.reply(
        `🔊 *ᴜɴᴍᴜᴛᴇᴅ*\n\n` +
        `> @${targetName} bisa mengirim pesan lagi!`,
        { mentions: [targetUser] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
