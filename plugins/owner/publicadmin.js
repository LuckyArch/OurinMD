const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'publicadmin',
    alias: ['adminpublic'],
    category: 'owner',
    description: 'Mode bot public tapi hanya admin yang bisa akses command tertentu',
    usage: '.publicadmin',
    example: '.publicadmin',
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
    const currentMode = db.setting('publicAdmin') || false
    
    if (currentMode) {
        db.setting('publicAdmin', false)
        m.react('❌')
        return m.reply(
            `❌ *ᴘᴜʙʟɪᴄᴀᴅᴍɪɴ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Bot bisa diakses semua orang\n` +
            `> Mode: Public`
        )
    } else {
        db.setting('publicAdmin', true)
        db.setting('selfAdmin', false)
        m.react('✅')
        return m.reply(
            `✅ *ᴘᴜʙʟɪᴄᴀᴅᴍɪɴ ᴀᴋᴛɪꜰ*\n\n` +
            `╭┈┈⬡「 🔒 *ᴀᴋsᴇs ᴅɪ ɢʀᴜᴘ* 」\n` +
            `┃ ✅ Admin grup\n` +
            `┃ ✅ Owner bot\n` +
            `┃ ✅ Bot sendiri (fromMe)\n` +
            `┃ ❌ Member biasa\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📱 *ᴀᴋsᴇs ᴅɪ ᴘʀɪᴠᴀᴛᴇ* 」\n` +
            `┃ ✅ Semua orang\n` +
            `╰┈┈⬡\n\n` +
            `> Ketik lagi untuk menonaktifkan`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
