const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'exp',
    alias: ['cekexp', 'myexp', 'xp'],
    category: 'user',
    description: 'Cek exp user',
    usage: '.exp [@user]',
    example: '.exp',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function getLevel(exp) {
    if (exp >= 1000000000) return { level: 100, title: 'Legendary' }
    if (exp >= 500000000) return { level: 90, title: 'Mythical' }
    if (exp >= 100000000) return { level: 80, title: 'Divine' }
    if (exp >= 50000000) return { level: 70, title: 'Immortal' }
    if (exp >= 10000000) return { level: 60, title: 'Master' }
    if (exp >= 5000000) return { level: 50, title: 'Expert' }
    if (exp >= 1000000) return { level: 40, title: 'Pro' }
    if (exp >= 500000) return { level: 30, title: 'Veteran' }
    if (exp >= 100000) return { level: 20, title: 'Advanced' }
    if (exp >= 50000) return { level: 15, title: 'Intermediate' }
    if (exp >= 10000) return { level: 10, title: 'Beginner' }
    if (exp >= 1000) return { level: 5, title: 'Newbie' }
    return { level: 1, title: 'Starter' }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let targetJid = m.sender
    let targetName = m.pushName || 'Kamu'
    
    if (m.quoted) {
        targetJid = m.quoted.sender
        targetName = m.quoted.pushName || targetJid.split('@')[0]
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
        targetName = targetJid.split('@')[0]
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const expDisplay = formatNumber(user.exp || 0)
    const { level, title } = getLevel(user.exp || 0)
    
    let text = `╭━━━━━━━━━━━━━━━━━╮\n`
    text += `┃  ⭐ *ᴇxᴘ ɪɴꜰᴏ*\n`
    text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    text += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
    text += `┃ 👤 ᴜsᴇʀ: *${targetName}*\n`
    text += `┃ ⭐ ᴇxᴘ: *${expDisplay}*\n`
    text += `┃ 🏆 ʟᴇᴠᴇʟ: *${level}*\n`
    text += `┃ 🎖️ ᴛɪᴛʟᴇ: *${title}*\n`
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    text += `> Main game untuk dapat EXP! 🎮`
    
    await m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
