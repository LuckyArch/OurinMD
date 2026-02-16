const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'cmdvn',
    alias: ['voicecommand', 'vncmd'],
    category: 'owner',
    description: 'Aktifkan command via voice note',
    usage: '.cmdvn <on/off>',
    example: '.cmdvn on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()

    const current = db.setting('cmdVn') || false

    if (!subCmd || subCmd === 'status') {
        const status = current ? '✅ ON' : '❌ OFF'
        return m.reply(
            `🎤 *ᴄᴍᴅ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ*\n\n` +
            `> Status: *${status}*\n\n` +
            `> \`${m.prefix}cmdvn on\` — Command via VN\n` +
            `> \`${m.prefix}cmdvn off\` — Command via text (default)\n\n` +
            `> Saat ON, kirim VN berisi nama command\n` +
            `> Contoh: VN "menu" → trigger .menu`
        )
    }

    if (subCmd === 'on') {
        db.setting('cmdVn', true)
        return m.reply(
            `✅ *ᴄᴍᴅ ᴠɴ ᴀᴋᴛɪꜰ*\n\n` +
            `> Kirim voice note berisi nama command\n` +
            `> Bot akan transkrip dan jalankan otomatis\n` +
            `> Contoh: VN "menu" → trigger .menu`
        )
    }

    if (subCmd === 'off') {
        db.setting('cmdVn', false)
        return m.reply(`❌ CMD VN *dinonaktifkan*. Command via text normal.`)
    }

    return m.reply(`❌ Gunakan \`${m.prefix}cmdvn on\` atau \`${m.prefix}cmdvn off\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
