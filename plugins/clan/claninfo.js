const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'claninfo',
    alias: ['infoclan', 'myclan', 'guildinfo'],
    category: 'clan',
    description: 'Lihat info clan',
    usage: '.claninfo [clan_id]',
    example: '.claninfo',
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
    let clanId = m.text?.trim() || user?.clanId
    
    if (!clanId) {
        return m.reply(`❌ Kamu tidak punya clan!\n\n> Buat dengan *.clancreate <nama>*\n> Atau gabung dengan *.clanjoin <id>*`)
    }
    
    if (!db.db.data.clans) db.db.data.clans = {}
    
    const clan = db.db.data.clans[clanId]
    if (!clan) {
        return m.reply(`❌ Clan tidak ditemukan!`)
    }
    
    const winRate = clan.wins + clan.losses > 0 
        ? ((clan.wins / (clan.wins + clan.losses)) * 100).toFixed(1) 
        : '0.0'
    
    let txt = `🏰 *ᴄʟᴀɴ ɪɴғᴏ*\n\n`
    txt += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
    txt += `┃ 📛 Nama: *${clan.name}*\n`
    txt += `┃ 🎖️ Level: *${clan.level}*\n`
    txt += `┃ 🚄 EXP: *${(clan.exp || 0).toLocaleString('id-ID')}*\n`
    txt += `┃ 👥 Members: *${clan.members.length}/50*\n`
    txt += `┃ 👑 Leader: @${clan.leader.split('@')[0]}\n`
    txt += `├┈┈⬡「 🏆 *ᴡᴀʀ sᴛᴀᴛs* 」\n`
    txt += `┃ ✅ Wins: *${clan.wins || 0}*\n`
    txt += `┃ ❌ Losses: *${clan.losses || 0}*\n`
    txt += `┃ 📊 Win Rate: *${winRate}%*\n`
    txt += `├┈┈⬡「 ⚙️ *sᴛᴀᴛᴜs* 」\n`
    txt += `┃ 🔓 Status: ${clan.isOpen ? '*Open*' : '*Closed*'}\n`
    txt += `┃ 🆔 ID: ${clan.id}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> ${clan.description || 'Tidak ada deskripsi'}`
    
    await m.reply(txt, { mentions: [clan.leader] })
}

module.exports = {
    config: pluginConfig,
    handler
}
