const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addkoin',
    alias: ['tambahkoin', 'givekoin', 'addcoin', 'adddcoin'],
    category: 'owner',
    description: 'Tambah koin user (max 9 Triliun)',
    usage: '.addkoin <jumlah> @user',
    example: '.addkoin 100000 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const MAX_KOIN = 9000000000000

function formatKoin(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args
    
    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    let amount = parseInt(numArg) || 0
    
    let targetJid = extractTarget(m)
    
    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || amount <= 0) {
        return m.reply(
            `💰 *ᴀᴅᴅ ᴋᴏɪɴ*\n\n` +
            `> \`.addkoin <jumlah>\` - ke diri sendiri\n` +
            `> \`.addkoin <jumlah> @user\` - ke orang lain\n` +
            `> Max: 9.000.000.000.000 (9T)\n\n` +
            `\`Contoh: ${m.prefix}addkoin 100000\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Jumlah koin harus lebih dari 0`)
    }
    
    if (amount > MAX_KOIN) {
        amount = MAX_KOIN
    }
    
    const newKoin = db.updateKoin(targetJid, amount)
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴋᴏɪɴ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 👤 ᴜsᴇʀ: @${targetJid.split('@')[0]}\n` +
        `┃ ➕ ᴛᴀᴍʙᴀʜ: *+${formatKoin(amount)}*\n` +
        `┃ 💰 ᴛᴏᴛᴀʟ: *${formatKoin(newKoin)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
