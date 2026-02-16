const os = require('os')

const pluginConfig = {
    name: 'stats',
    alias: ['botstats', 'status', 'stat'],
    category: 'main',
    description: 'Menampilkan statistik bot',
    usage: '.stats',
    example: '.stats',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
}

async function handler(m, { sock, db, uptime, config: botConfig }) {
    try {
        const users = db.db?.data?.users || {}
        const groups = db.db?.data?.groups || {}
        const memUsed = process.memoryUsage()
        const cpuUsage = os.loadavg()[0].toFixed(2)
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem

        const totalUsers = Object.keys(users).length
        const totalGroups = Object.keys(groups).length
        const premiumUsers = Object.values(users).filter(u => u.premium).length

        const statsText = `📊 *ʙᴏᴛ sᴛᴀᴛɪsᴛɪᴄs*\n\n` +
            `\`\`\`━━━ ɪɴꜰᴏ ━━━\`\`\`\n` +
            `> *Bot:* ${botConfig?.bot?.name || 'Ourin-AI'}\n` +
            `> *Version:* v${botConfig?.bot?.version || '1.0.0'}\n` +
            `> *Uptime:* ${formatUptime(uptime)}\n\n` +
            `\`\`\`━━━ ᴅᴀᴛᴀʙᴀsᴇ ━━━\`\`\`\n` +
            `> 👥 Users: ${totalUsers}\n` +
            `> 💎 Premium: ${premiumUsers}\n` +
            `> 👥 Groups: ${totalGroups}\n\n` +
            `\`\`\`━━━ sʏsᴛᴇᴍ ━━━\`\`\`\n` +
            `> *Platform:* ${os.platform()} ${os.arch()}\n` +
            `> *Node:* ${process.version}\n` +
            `> *CPU Load:* ${cpuUsage}%\n` +
            `> *RAM Used:* ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n` +
            `> *Heap:* ${formatBytes(memUsed.heapUsed)} / ${formatBytes(memUsed.heapTotal)}\n\n` +
            `> _Last updated: ${require('moment-timezone')().tz('Asia/Jakarta').format('HH:mm:ss')}_`

        await m.reply(statsText)

    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
