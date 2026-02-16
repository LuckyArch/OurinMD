const { findParticipantByNumber } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'kick',
    alias: ['remove', 'tendang'],
    category: 'group',
    description: 'Kick member dari grup',
    usage: '.kick @user',
    example: '.kick @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    let targetJid = null

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0]
    }

    if (!targetJid) {
        await m.reply(
            `❌ *ᴛᴀʀɢᴇᴛ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Reply pesan user atau mention!\n` +
            `> Contoh: \`${m.prefix}kick @user\``
        )
        return
    }

    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const targetNumber = targetJid.replace(/@.*$/, '')

    if (targetJid === botNumber || targetNumber === botNumber.replace(/@.*$/, '')) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa kick bot sendiri!`)
        return
    }

    if (targetJid === m.sender) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa kick diri sendiri!`)
        return
    }

    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const targetParticipant = findParticipantByNumber(groupMeta.participants, targetJid)
        
        if (!targetParticipant) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> User tidak ditemukan dalam grup!`)
            return
        }
        
        if (targetParticipant.admin) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak bisa kick admin grup!`)
            return
        }
        
        await sock.groupParticipantsUpdate(m.chat, [targetParticipant.id], 'remove')

        await m.reply(
            `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
            `> @${targetNumber} telah dikeluarkan dari grup.`,
            { mentions: [targetJid] }
        )

    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
