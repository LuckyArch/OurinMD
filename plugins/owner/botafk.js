const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'botafk',
    alias: ['afkbot', 'afkmode'],
    category: 'owner',
    description: 'Mode AFK untuk bot - bot tidak merespon command, hanya reply pesan AFK',
    usage: '.botafk <alasan>',
    example: '.botafk Lagi istirahat',
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
    const currentAfk = db.setting('botAfk')
    
    if (currentAfk && currentAfk.active) {
        db.setting('botAfk', { active: false })
        m.react('✅')
        
        const afkDuration = Date.now() - currentAfk.since
        const duration = formatDuration(afkDuration)
        
        return m.reply(
            `✅ *ʙᴏᴛ ᴋᴇᴍʙᴀʟɪ ᴏɴʟɪɴᴇ*\n\n` +
            `╭┈┈⬡「 📊 *sᴛᴀᴛɪsᴛɪᴋ ᴀꜰᴋ* 」\n` +
            `┃ ⏱️ ᴅᴜʀᴀsɪ: \`${duration}\`\n` +
            `┃ 📝 ᴀʟᴀsᴀɴ: \`${currentAfk.reason || '-'}\`\n` +
            `╰┈┈⬡\n\n` +
            `> Bot siap menerima command!`
        )
    } else {
        const reason = m.args.join(' ') || 'AFK'
        
        db.setting('botAfk', {
            active: true,
            reason: reason,
            since: Date.now()
        })
        
        m.react('💤')
        return m.reply(
            `💤 *ʙᴏᴛ ᴀꜰᴋ ᴀᴋᴛɪꜰ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ᴀʟᴀsᴀɴ: \`${reason}\`\n` +
            `┃ ⏰ sᴇᴊᴀᴋ: \`${require('moment-timezone')().tz('Asia/Jakarta').format('HH:mm:ss')}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🔒 *ᴀᴋsᴇs* 」\n` +
            `┃ ✅ Owner bot\n` +
            `┃ ✅ Bot sendiri (fromMe)\n` +
            `┃ ❌ Semua user lain\n` +
            `╰┈┈⬡\n\n` +
            `> User lain akan dapat pesan AFK\n` +
            `> Ketik \`${m.prefix}botafk\` untuk kembali online`
        )
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} hari ${hours % 24} jam`
    if (hours > 0) return `${hours} jam ${minutes % 60} menit`
    if (minutes > 0) return `${minutes} menit ${seconds % 60} detik`
    return `${seconds} detik`
}

module.exports = {
    config: pluginConfig,
    handler
}
