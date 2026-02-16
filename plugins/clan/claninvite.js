const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'claninvite',
    alias: ['inviteclan'],
    category: 'clan',
    description: 'Invite user ke clan',
    usage: '.claninvite @user',
    example: '.claninvite @user',
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
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    if (!target) return m.reply(`🏰 *ᴄʟᴀɴ ɪɴᴠɪᴛᴇ*\n\n> Tag atau reply user!\n\n> Contoh: .claninvite @user`)
    
    const targetUser = db.getUser(target)
    if (targetUser?.clanId) return m.reply(`❌ User tersebut sudah punya clan!`)
    if (clan.members.length >= 50) return m.reply(`❌ Clan sudah penuh! (50/50)`)
    
    let txt = `🏰 *ᴄʟᴀɴ ɪɴᴠɪᴛᴇ*\n\n`
    txt += `> @${m.sender.split('@')[0]} mengundang @${target.split('@')[0]}\n`
    txt += `> ke clan *${clan.name}*!\n\n`
    txt += `> Untuk bergabung, ketik:\n`
    txt += `> *.clanjoin ${clan.id}*`
    
    await m.reply(txt, { mentions: [m.sender, target] })
}

module.exports = {
    config: pluginConfig,
    handler
}
