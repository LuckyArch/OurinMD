const { getDatabase } = require('../../src/lib/database')
const { getParticipantJid } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'mute',
    alias: ['bisukan'],
    category: 'group',
    description: 'Bisukan member (tidak bisa kirim pesan)',
    usage: '.mute @user [durasi_menit]',
    example: '.mute @user 30',
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
            `> Reply pesan user + \`${m.prefix}mute 30\`\n` +
            `> Atau: \`${m.prefix}mute @user 30\`\n\n` +
            `> Durasi dalam menit (default: 30)`
        )
        return
    }
    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const participant = groupMeta.participants.find(p => getParticipantJid(p) === targetUser)
        if (participant?.admin) {
            await m.reply(`❌ Tidak bisa mute admin grup.`)
            return
        }
    } catch (e) {}
    
    const durationArg = m.text?.replace(/@\d+/g, '').trim()
    const duration = parseInt(durationArg) || 30
    
    if (duration < 1 || duration > 1440) {
        await m.reply(`⚠️ Durasi harus 1-1440 menit (max 24 jam).`)
        return
    }
    
    let groupData = db.getGroup(m.chat) || {}
    let mutedUsers = groupData.mutedUsers || {}
    
    const targetName = targetUser.split('@')[0]
    const unmuteTime = Date.now() + (duration * 60 * 1000)
    
    mutedUsers[targetUser] = {
        until: unmuteTime,
        by: m.sender,
        time: Date.now()
    }
    
    db.setGroup(m.chat, { ...groupData, mutedUsers: mutedUsers })
    
    await m.reply(
        `🔇 *ᴍᴜᴛᴇᴅ*\n\n` +
        `> @${targetName} dibisukan!\n` +
        `> Durasi: *${duration} menit*\n\n` +
        `_Pesan dari user ini akan dihapus otomatis._`,
        { mentions: [targetUser] }
    )
}
function isMuted(groupJid, userJid, db) {
    const groupData = db.getGroup(groupJid) || {}
    const mutedUsers = groupData.mutedUsers || {}
    const muteData = mutedUsers[userJid]
    
    if (!muteData) return false
    if (Date.now() > muteData.until) {
        delete mutedUsers[userJid]
        db.setGroup(groupJid, { ...groupData, mutedUsers: mutedUsers })
        return false
    }
    
    return true
}

module.exports = {
    config: pluginConfig,
    handler,
    isMuted
}
