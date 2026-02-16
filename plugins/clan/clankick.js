const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clankick',
    alias: ['kickclan'],
    category: 'clan',
    description: 'Kick member dari clan (leader only)',
    usage: '.clankick @user',
    example: '.clankick @user',
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
    if (!clan) return m.reply(`❌ Clan tidak ditemukan!`)
    if (clan.leader !== m.sender) return m.reply(`❌ Hanya leader yang bisa kick member!`)
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) return m.reply(`🏰 *ᴄʟᴀɴ ᴋɪᴄᴋ*\n\n> Tag atau reply member!\n\n> Contoh: .clankick @user`)
    if (target === m.sender) return m.reply(`❌ Tidak bisa kick diri sendiri!`)
    if (!clan.members.includes(target)) return m.reply(`❌ User tersebut bukan member clan!`)
    
    clan.members = clan.members.filter(jid => jid !== target)
    db.setUser(target, { clanId: null })
    db.save()
    
    await m.reply(`🏰 @${target.split('@')[0]} telah dikick dari clan *${clan.name}*`, { mentions: [target] })
}

module.exports = {
    config: pluginConfig,
    handler
}
