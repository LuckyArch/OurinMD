const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'topchat',
    alias: ['leaderboardchat', 'chatrank'],
    category: 'group',
    description: 'Leaderboard member paling banyak chat',
    usage: '.topchat',
    example: '.topchat',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const chatStats = groupData.chatStats || {}
    
    if (Object.keys(chatStats).length === 0) {
        return m.reply(
            `╭┈┈⬡「 📊 *ᴛᴏᴘ ᴄʜᴀᴛ* 」
┃ ㊗ ᴅᴀᴛᴀ: Belum ada
╰┈┈⬡

> _Belum ada data chat di grup ini!_`
        )
    }
    
    const sorted = Object.entries(chatStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    
    let leaderboard = ''
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
    const mentions = []
    
    sorted.forEach(([jid, count], index) => {
        if (jid && typeof jid === 'string' && jid.includes('@')) {
            mentions.push(jid)
            const username = jid.split('@')[0]
            const chatCount = typeof count === 'number' ? count : 0
            leaderboard += `┃ ${medals[index]} @${username}: *${chatCount}* pesan\n`
        }
    })
    
    if (!leaderboard) {
        return m.reply(`❌ Data chat tidak valid!`)
    }
    
    m.react('📊')
    
    await sock.sendMessage(m.chat, {
        text: `╭┈┈⬡「 📊 *ᴛᴏᴘ ᴄʜᴀᴛ* 」
${leaderboard}╰┈┈⬡

> _Leaderboard member paling aktif!_`,
        mentions
    }, { quoted: m })
}

async function trackChat(m, db) {
    if (!m.isGroup) return
    if (!m.sender || typeof m.sender !== 'string') return
    
    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.chatStats) groupData.chatStats = {}
    
    const currentCount = groupData.chatStats[m.sender]
    groupData.chatStats[m.sender] = (typeof currentCount === 'number' ? currentCount : 0) + 1
    db.setGroup(m.chat, groupData)
}

module.exports = {
    config: pluginConfig,
    handler,
    trackChat
}
