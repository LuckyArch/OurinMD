const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clanmembers',
    alias: ['clanmember', 'guildmembers'],
    category: 'clan',
    description: 'Lihat daftar member clan',
    usage: '.clanmembers',
    example: '.clanmembers',
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
    const user = db.getUser(m.sender)
    
    if (!user?.clanId) return m.reply(`❌ Kamu tidak punya clan!`)
    if (!db.db.data.clans) db.db.data.clans = {}
    
    const clan = db.db.data.clans[user.clanId]
    if (!clan) return m.reply(`❌ Clan tidak ditemukan!`)
    
    let txt = `🏰 *${clan.name}* - Members\n\n`
    const mentions = []
    
    clan.members.forEach((jid, i) => {
        const memberUser = db.getUser(jid)
        const isLeader = jid === clan.leader
        const role = isLeader ? '👑' : '👤'
        const level = memberUser?.rpg?.level || memberUser?.level || 1
        
        txt += `${i + 1}. ${role} @${jid.split('@')[0]}\n`
        txt += `   > Lv.${level} | Bal: Rp ${(memberUser?.koin || 0).toLocaleString('id-ID')}\n`
        mentions.push(jid)
    })
    
    txt += `\n> Total: *${clan.members.length}/50* members`
    
    await m.reply(txt, { mentions })
}

module.exports = {
    config: pluginConfig,
    handler
}
