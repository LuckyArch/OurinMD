const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clanleave',
    alias: ['leaveclan', 'guildleave'],
    category: 'clan',
    description: 'Keluar dari clan',
    usage: '.clanleave',
    example: '.clanleave',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user?.clanId) return m.reply(`❌ Kamu tidak punya clan!`)
    if (!db.db.data.clans) db.db.data.clans = {}
    
    const clan = db.db.data.clans[user.clanId]
    if (!clan) {
        db.setUser(m.sender, { clanId: null })
        db.save()
        return m.reply(`❌ Clan tidak ditemukan! Data dibersihkan.`)
    }
    
    if (clan.leader === m.sender) {
        if (clan.members.length > 1) {
            return m.reply(`❌ Kamu adalah leader!\n> Transfer dulu dengan *.clantransfer @user*\n> Atau kick semua member.`)
        }
        delete db.db.data.clans[user.clanId]
        db.setUser(m.sender, { clanId: null })
        db.save()
        return m.reply(`🏰 Clan *${clan.name}* telah dibubarkan.`)
    }
    
    clan.members = clan.members.filter(jid => jid !== m.sender)
    db.setUser(m.sender, { clanId: null })
    db.save()
    
    await m.reply(`🏰 Kamu telah keluar dari clan *${clan.name}*`)
}

module.exports = {
    config: pluginConfig,
    handler
}
