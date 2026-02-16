const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'goodbyeall',
    alias: ['gball', 'globalgoodbye', 'leaveall'],
    category: 'owner',
    description: 'Aktifkan/nonaktifkan goodbye di semua grup',
    usage: '.goodbyeall <on/off>',
    example: '.goodbyeall on',
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
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    if (!action || !['on', 'off'].includes(action)) {
        return m.reply(
            `👋 *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ*\n\n` +
            `> Aktifkan/nonaktifkan goodbye di SEMUA grup sekaligus\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${m.prefix}goodbyeall on\n` +
            `┃ ${m.prefix}goodbyeall off\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    await m.react('⏳')
    
    try {
        const groups = await sock.groupFetchAllParticipating()
        const groupIds = Object.keys(groups)
        const status = action === 'on'
        let count = 0
        
        for (const groupId of groupIds) {
            db.setGroup(groupId, { leave: status })
            count++
        }
        
        await m.react('✅')
        
        if (status) {
            return m.reply(
                `✅ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `╭┈┈⬡「 📊 *ʀᴇsᴜʟᴛ* 」\n` +
                `┃ 🌐 Total Grup: *${count}*\n` +
                `┃ ✅ Goodbye: *AKTIF*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Member yang keluar akan dikirim pesan perpisahan!`
            )
        } else {
            return m.reply(
                `❌ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `╭┈┈⬡「 📊 *ʀᴇsᴜʟᴛ* 」\n` +
                `┃ 🌐 Total Grup: *${count}*\n` +
                `┃ ❌ Goodbye: *NONAKTIF*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Goodbye dinonaktifkan di semua grup.`
            )
        }
    } catch (error) {
        console.error('[GoodbyeAll] Error:', error.message)
        await m.react('❌')
        return m.reply(`❌ Error: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
