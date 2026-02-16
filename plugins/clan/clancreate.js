const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'clancreate',
    alias: ['createclan', 'guildcreate'],
    category: 'clan',
    description: 'Buat clan baru',
    usage: '.clancreate <nama>',
    example: '.clancreate DragonSlayer',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const CLAN_CREATE_COST = 50000
const MAX_CLAN_NAME = 20

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const clanName = m.text?.trim()
    
    if (!clanName) {
        return m.reply(`🏰 *ᴄʟᴀɴ ᴄʀᴇᴀᴛᴇ*\n\n> Masukkan nama clan!\n> Biaya: *Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}*\n\n> Contoh: .clancreate DragonSlayer`)
    }
    
    if (clanName.length > MAX_CLAN_NAME) {
        return m.reply(`❌ Nama clan maksimal ${MAX_CLAN_NAME} karakter!`)
    }
    
    if (!/^[a-zA-Z0-9\s]+$/.test(clanName)) {
        return m.reply(`❌ Nama clan hanya boleh huruf, angka, dan spasi!`)
    }
    
    if (!db.db.data.clans) db.db.data.clans = {}
    
    if (user.clanId) {
        return m.reply(`❌ Kamu sudah punya clan!\n> Keluar dulu dengan *.clanleave*`)
    }
    
    const existingClan = Object.values(db.db.data.clans).find(c => c.name.toLowerCase() === clanName.toLowerCase())
    if (existingClan) {
        return m.reply(`❌ Nama clan *${clanName}* sudah digunakan!`)
    }
    
    if ((user.koin || 0) < CLAN_CREATE_COST) {
        return m.reply(`❌ Balance tidak cukup!\n\n> Dibutuhkan: *Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}*\n> Kamu punya: *Rp ${(user.koin || 0).toLocaleString('id-ID')}*`)
    }
    
    const clanId = `clan_${Date.now()}`
    const clan = {
        id: clanId,
        name: clanName,
        leader: m.sender,
        members: [m.sender],
        exp: 0,
        level: 1,
        wins: 0,
        losses: 0,
        createdAt: new Date().toISOString(),
        description: 'Clan baru',
        isOpen: true
    }
    
    db.db.data.clans[clanId] = clan
    db.updateKoin(m.sender, -CLAN_CREATE_COST)
    db.setUser(m.sender, { clanId: clanId })
    await db.save()
    
    let txt = `🏰 *ᴄʟᴀɴ ᴄʀᴇᴀᴛᴇᴅ!*\n\n`
    txt += `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n`
    txt += `┃ 📛 Nama: *${clanName}*\n`
    txt += `┃ 👑 Leader: @${m.sender.split('@')[0]}\n`
    txt += `┃ 🆔 ID: ${clanId}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> -Rp ${CLAN_CREATE_COST.toLocaleString('id-ID')}`
    
    await m.reply(txt, { mentions: [m.sender] })
}

module.exports = {
    config: pluginConfig,
    handler
}
