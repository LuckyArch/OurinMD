const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clanleaderboard',
    alias: ['clanlb', 'topclan', 'guildrank'],
    category: 'clan',
    description: 'Lihat ranking clan',
    usage: '.clanleaderboard',
    example: '.clanleaderboard',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    
    if (!db.db.data.clans) db.db.data.clans = {}
    
    const clans = Object.values(db.db.data.clans)
    if (clans.length === 0) return m.reply(`🏰 Belum ada clan terdaftar!\n\n> Buat dengan *.clancreate <nama>*`)
    
    clans.sort((a, b) => {
        const scoreA = ((a.wins || 0) * 100) + (a.exp || 0) + ((a.level || 1) * 500)
        const scoreB = ((b.wins || 0) * 100) + (b.exp || 0) + ((b.level || 1) * 500)
        return scoreB - scoreA
    })
    
    const medals = ['🥇', '🥈', '🥉']
    
    let txt = `🏰 *ᴄʟᴀɴ ʟᴇᴀᴅᴇʀʙᴏᴀʀᴅ*\n\n`
    
    clans.slice(0, 10).forEach((clan, i) => {
        const medal = medals[i] || `${i + 1}.`
        const winRate = clan.wins + clan.losses > 0 
            ? ((clan.wins / (clan.wins + clan.losses)) * 100).toFixed(0) 
            : '0'
        
        txt += `${medal} *${clan.name}*\n`
        txt += `   > Lv.${clan.level || 1} | W:${clan.wins || 0} L:${clan.losses || 0} (${winRate}%)\n`
        txt += `   > 👥 ${clan.members.length} | ID: ${clan.id}\n\n`
    })
    
    txt += `> Total *${clans.length}* clans terdaftar`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
