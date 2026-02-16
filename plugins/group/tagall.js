const { getParticipantJid, getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: 'tagall',
    alias: ['all', 'everyone'],
    category: 'group',
    description: 'Tag semua member grup',
    usage: '.tagall <pesan>',
    example: '.tagall Halo semua!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    const text = m.text || 'Tag All Members'

    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []

        if (participants.length === 0) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada member di grup ini.`)
            return
        }

        const mentions = getParticipantJids(participants)
        const memberList = participants.map((p, i) => `${i + 1}. @${getParticipantJid(p).split('@')[0]}`).join('\n')

        await sock.sendMessage(m.chat, {
            text: `📢 *ᴛᴀɢ ᴀʟʟ*\n\n` +
                `> *Pesan:* ${text}\n\n` +
                `\`\`\`━━━ ${participants.length} ᴍᴇᴍʙᴇʀ ━━━\`\`\`\n` +
                memberList,
            mentions
        }, { quoted: m })

    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
