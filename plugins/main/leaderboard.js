const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'leaderboard',
    alias: ['lb', 'top', 'topbalance', 'topbal', 'toplimit', 'topexp', 'topxp', 'ranking'],
    category: 'main',
    description: 'Lihat leaderboard (balance, exp, energi)',
    usage: '.leaderboard',
    example: '.topbalance',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    
    const users = []
    const dbData = db.db?.data?.users || {}
    
    for (const [jid, userData] of Object.entries(dbData)) {
        if (!jid || jid === 'undefined') continue
        users.push({
            jid,
            balance: userData.koin || 0,
            exp: userData.exp || 0,
            energi: userData.energi || 0,
            level: userData.level || 1,
            name: userData.name || jid.split('@')[0]
        })
    }
    
    if (users.length === 0) {
        return m.reply(`📊 *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ*\n\n> Belum ada data user terdaftar.`)
    }
    
    let sortedUsers
    let title
    let emoji
    let field
    
    if (['topbalance', 'topbal'].includes(cmd)) {
        sortedUsers = users.sort((a, b) => b.koin - a.koin).slice(0, 10)
        title = 'TOP BALANCE'
        emoji = '💰'
        field = 'balance'
    } else if (['topenergi'].includes(cmd)) {
        sortedUsers = users.sort((a, b) => b.energi - a.energi).slice(0, 10)
        title = 'TOP ENERGI'
        emoji = '⚡'
        field = 'energi'
    } else if (['topexp', 'topxp'].includes(cmd)) {
        sortedUsers = users.sort((a, b) => b.exp - a.exp).slice(0, 10)
        title = 'TOP EXP'
        emoji = '✨'
        field = 'exp'
    } else {
        const totalBalance = users.reduce((sum, u) => sum + u.koin, 0)
        const totalExp = users.reduce((sum, u) => sum + u.exp, 0)
        const totalEnergi = users.reduce((sum, u) => sum + u.energi, 0)
        
        const maxBalUser = users.reduce((a, b) => a.koin > b.koin ? a : b)
        const maxExpUser = users.reduce((a, b) => a.exp > b.exp ? a : b)
        const maxEnergiUser = users.reduce((a, b) => a.energi > b.energi ? a : b)
        
        const balPct = totalBalance > 0 ? ((maxBaluser.koin / totalBalance) * 100).toFixed(1) : 0
        const expPct = totalExp > 0 ? ((maxExpUser.exp / totalExp) * 100).toFixed(1) : 0
        const energiPct = totalEnergi > 0 ? ((maxEnergiUser.energi / totalEnergi) * 100).toFixed(1) : 0
        
        const mentions = [maxBalUser.jid, maxExpUser.jid, maxEnergiUser.jid]
        
        return sock.sendMessage(m.chat, {
            text: `🏆 *ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ ᴏᴠᴇʀᴠɪᴇᴡ*\n\n` +
                `📊 Total User: *${users.length}*\n\n` +
                `╭┈┈⬡「 💰 *ᴛᴏᴘ ʙᴀʟᴀɴᴄᴇ* 」\n` +
                `┃ 👤 @${maxBalUser.jid.split('@')[0]}\n` +
                `┃ 💵 ${formatNumber(maxBaluser.koin)} (${balPct}%)\n` +
                `╰┈┈⬡\n\n` +
                `╭┈┈⬡「 ✨ *ᴛᴏᴘ ᴇxᴘ* 」\n` +
                `┃ 👤 @${maxExpUser.jid.split('@')[0]}\n` +
                `┃ ⭐ ${formatNumber(maxExpUser.exp)} (${expPct}%)\n` +
                `╰┈┈⬡\n\n` +
                `╭┈┈⬡「 ⚡ *ᴛᴏᴘ ᴇɴᴇʀɢɪ* 」\n` +
                `┃ 👤 @${maxEnergiUser.jid.split('@')[0]}\n` +
                `┃ ⚡ ${formatNumber(maxEnergiUser.energi)} (${energiPct}%)\n` +
                `╰┈┈⬡\n\n` +
                `> Gunakan \`.topbalance\`, \`.topexp\`, \`.topenergi\`\n` +
                `> untuk melihat ranking lengkap.`,
            mentions
        }, { quoted: m })
    }
    
    let text = `${emoji} *${title}*\n\n`
    text += `📊 Total: *${users.length}* user\n\n`
    
    const total = users.reduce((sum, u) => sum + u[field], 0)
    const mentions = []
    
    sortedUsers.forEach((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
        const pct = total > 0 ? ((u[field] / total) * 100).toFixed(1) : 0
        text += `${medal} @${u.jid.split('@')[0]}\n`
        text += `   └ ${formatNumber(u[field])} (${pct}%)\n\n`
        mentions.push(u.jid)
    })
    
    text += `> Ranking berdasarkan ${field}`
    
    await sock.sendMessage(m.chat, {
        text,
        mentions
    }, { quoted: m })
}

function formatNumber(num) {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
    return num.toString()
}

module.exports = {
    config: pluginConfig,
    handler
}
