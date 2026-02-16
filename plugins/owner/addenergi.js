const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addenergi',
    alias: ['tambahenergi', 'giveenergi', 'addenergy'],
    category: 'owner',
    description: 'Tambah energi user',
    usage: '.addenergi <jumlah> @user',
    example: '.addenergi 100 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ Unlimited'
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
    
    let amount = 0
    let isUnlimited = false
    
    // Parsing argumen yang lebih robust
    const allArgs = m.text.split(' ').slice(1) // Ambil semua setelah command
    
    // Cari angka di argument
    const numArg = allArgs.find(a => !isNaN(a) && !a.includes('@') && !a.startsWith('-'))
    if (numArg) amount = parseInt(numArg)
    
    // Cek flag unlimited
    if (m.text.toLowerCase().includes('--unlimited') || m.text.toLowerCase().includes('--unli')) {
        isUnlimited = true
    }
    
    let targetJid = extractTarget(m)
    
    // Jika tidak ada target dari quote/mention, cek argumen string yang mungkin nomor
    if (!targetJid) {
        const potentialNumber = allArgs.find(a => a.length > 5 && !isNaN(a.replace(/[^0-9]/g, '')))
        if (potentialNumber) {
            targetJid = potentialNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        }
    }
    
    if (!targetJid && (amount > 0 || isUnlimited)) {
        targetJid = m.sender
    }
    
    if (!targetJid || (!isUnlimited && amount <= 0)) {
        return m.reply(
            `⚡ *ᴀᴅᴅ ᴇɴᴇʀɢɪ*\n\n` +
            `> \`.addenergi <jumlah>\` - ke diri sendiri\n` +
            `> \`.addenergi <jumlah> @user\` - ke user\n` +
            `> \`.addenergi --unlimited\` - unlimited\n\n` +
            `\`Contoh: ${m.prefix}addenergi 100\``
        )
    }
    
    if (!isUnlimited && amount <= 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Jumlah energi harus lebih dari 0`)
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const oldEnergi = user.energi
    
    if (isUnlimited) {
        db.setUser(targetJid, { energi: -1 })
        
        m.react('✅')
        await m.reply(
            `✅ *ᴇɴᴇʀɢɪ ᴜɴʟɪᴍɪᴛᴇᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 👤 ᴜsᴇʀ: @${targetJid.split('@')[0]}\n` +
            `┃ ⚡ ᴇɴᴇʀɢɪ: *∞ Unlimited*\n` +
            `╰┈┈⬡`,
            { mentions: [targetJid] }
        )
    } else {
        const newEnergi = db.updateEnergi(targetJid, amount)
        
        m.react('✅')
        await m.reply(
            `✅ *ᴇɴᴇʀɢɪ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 👤 ᴜsᴇʀ: @${targetJid.split('@')[0]}\n` +
            `┃ ➕ ᴛᴀᴍʙᴀʜ: *+${formatNumber(amount)}*\n` +
            `┃ ⚡ ᴛᴏᴛᴀʟ: *${formatNumber(newEnergi)}*\n` +
            `╰┈┈⬡`,
            { mentions: [targetJid] }
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
