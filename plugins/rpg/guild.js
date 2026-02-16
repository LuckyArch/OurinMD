const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'guild',
    alias: ['clan', 'team', 'kelompok'],
    category: 'rpg',
    description: 'Sistem guild/clan',
    usage: '.guild <create/join/leave/info>',
    example: '.guild create DragonSlayers',
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
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const guildName = args.slice(1).join(' ')
    
    const guilds = db.db?.data?.guilds || {}
    
    if (!action || !['create', 'join', 'leave', 'info', 'list', 'members', 'deposit'].includes(action)) {
        let txt = `🏰 *ɢᴜɪʟᴅ sʏsᴛᴇᴍ*\n\n`
        txt += `> Bergabung/buat guild untuk bonus!\n\n`
        txt += `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n`
        txt += `┃ ${m.prefix}guild create <nama>\n`
        txt += `┃ ${m.prefix}guild join <nama>\n`
        txt += `┃ ${m.prefix}guild leave\n`
        txt += `┃ ${m.prefix}guild info\n`
        txt += `┃ ${m.prefix}guild list\n`
        txt += `┃ ${m.prefix}guild members\n`
        txt += `┃ ${m.prefix}guild deposit <amount>\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        if (user.rpg.guildId) {
            const myGuild = guilds[user.rpg.guildId]
            txt += `> 🏰 Guild kamu: *${myGuild?.name || 'Unknown'}*`
        } else {
            txt += `> ⚠️ Kamu belum bergabung guild`
        }
        return m.reply(txt)
    }
    
    if (action === 'list') {
        const guildList = Object.values(guilds)
        if (guildList.length === 0) {
            return m.reply(`❌ Belum ada guild! Buat dengan \`${m.prefix}guild create <nama>\``)
        }
        
        let txt = `🏰 *ᴅᴀꜰᴛᴀʀ ɢᴜɪʟᴅ*\n\n`
        txt += `╭┈┈⬡「 📋 *ɢᴜɪʟᴅs* 」\n`
        for (const g of guildList.slice(0, 10)) {
            txt += `┃ 🏰 *${g.name}*\n`
            txt += `┃ 👥 Member: ${g.members?.length || 0}\n`
            txt += `┃ 💰 Treasury: ${(g.treasury || 0).toLocaleString()}\n`
            txt += `┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        return m.reply(txt)
    }
    
    if (action === 'create') {
        if (user.rpg.guildId) {
            return m.reply(`❌ Kamu sudah punya guild! Leave dulu.`)
        }
        
        if (!guildName || guildName.length < 3) {
            return m.reply(`❌ Nama guild minimal 3 karakter!`)
        }
        
        if (guildName.length > 20) {
            return m.reply(`❌ Nama guild maksimal 20 karakter!`)
        }
        
        const existingGuild = Object.values(guilds).find(g => g.name.toLowerCase() === guildName.toLowerCase())
        if (existingGuild) {
            return m.reply(`❌ Nama guild sudah digunakan!`)
        }
        
        const createCost = 10000
        if ((user.koin || 0) < createCost) {
            return m.reply(`❌ Butuh ${createCost.toLocaleString()} balance untuk membuat guild!`)
        }
        
        user.koin -= createCost
        
        const guildId = `guild_${Date.now()}`
        if (!db.db.data.guilds) db.db.data.guilds = {}
        
        db.db.data.guilds[guildId] = {
            id: guildId,
            name: guildName,
            leader: m.sender,
            members: [m.sender],
            treasury: 0,
            level: 1,
            exp: 0,
            createdAt: Date.now()
        }
        
        user.rpg.guildId = guildId
        db.save()
        
        return m.reply(
            `🎉 *ɢᴜɪʟᴅ ᴅɪʙᴜᴀᴛ!*\n\n` +
            `╭┈┈⬡「 🏰 *ɪɴꜰᴏ* 」\n` +
            `┃ 🏰 Nama: *${guildName}*\n` +
            `┃ 👑 Leader: *Kamu*\n` +
            `┃ 💰 Cost: *-${createCost.toLocaleString()}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (action === 'join') {
        if (user.rpg.guildId) {
            return m.reply(`❌ Kamu sudah punya guild! Leave dulu.`)
        }
        
        if (!guildName) {
            return m.reply(`❌ Tentukan nama guild!\n\n> Contoh: \`${m.prefix}guild join DragonSlayers\``)
        }
        
        const targetGuild = Object.values(guilds).find(g => g.name.toLowerCase() === guildName.toLowerCase())
        if (!targetGuild) {
            return m.reply(`❌ Guild tidak ditemukan!`)
        }
        
        if (targetGuild.members?.length >= 50) {
            return m.reply(`❌ Guild sudah penuh! (Max 50 member)`)
        }
        
        targetGuild.members = targetGuild.members || []
        targetGuild.members.push(m.sender)
        user.rpg.guildId = targetGuild.id
        db.save()
        
        return m.reply(
            `✅ *ʙᴇʀɢᴀʙᴜɴɢ ɢᴜɪʟᴅ*\n\n` +
            `> Selamat datang di *${targetGuild.name}*!`
        )
    }
    
    if (action === 'leave') {
        if (!user.rpg.guildId) {
            return m.reply(`❌ Kamu tidak dalam guild!`)
        }
        
        const myGuild = guilds[user.rpg.guildId]
        if (!myGuild) {
            user.rpg.guildId = null
            db.save()
            return m.reply(`❌ Guild tidak ditemukan, data dibersihkan.`)
        }
        
        if (myGuild.leader === m.sender && myGuild.members?.length > 1) {
            return m.reply(`❌ Kamu adalah leader! Transfer kepemimpinan dulu atau kick semua member.`)
        }
        
        myGuild.members = (myGuild.members || []).filter(m => m !== m.sender)
        
        if (myGuild.members.length === 0) {
            delete guilds[user.rpg.guildId]
        }
        
        const guildName = myGuild.name
        user.rpg.guildId = null
        db.save()
        
        return m.reply(`✅ Keluar dari guild *${guildName}*`)
    }
    
    if (action === 'info') {
        if (!user.rpg.guildId) {
            return m.reply(`❌ Kamu tidak dalam guild!`)
        }
        
        const myGuild = guilds[user.rpg.guildId]
        if (!myGuild) {
            return m.reply(`❌ Guild tidak ditemukan!`)
        }
        
        return m.reply(
            `🏰 *ɢᴜɪʟᴅ ɪɴꜰᴏ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🏰 Nama: *${myGuild.name}*\n` +
            `┃ 👑 Leader: *${myGuild.leader?.split('@')[0]}*\n` +
            `┃ 👥 Member: *${myGuild.members?.length || 0}/50*\n` +
            `┃ 📊 Level: *${myGuild.level || 1}*\n` +
            `┃ 💰 Treasury: *${(myGuild.treasury || 0).toLocaleString()}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (action === 'members') {
        if (!user.rpg.guildId) {
            return m.reply(`❌ Kamu tidak dalam guild!`)
        }
        
        const myGuild = guilds[user.rpg.guildId]
        if (!myGuild) {
            return m.reply(`❌ Guild tidak ditemukan!`)
        }
        
        const memberList = (myGuild.members || []).map((m, i) => {
            const isLeader = m === myGuild.leader ? ' 👑' : ''
            return `${i + 1}. @${m.split('@')[0]}${isLeader}`
        }).join('\n')
        
        return m.reply(
            `👥 *ɢᴜɪʟᴅ ᴍᴇᴍʙᴇʀs*\n\n` +
            `🏰 *${myGuild.name}*\n\n` +
            memberList,
            { mentions: myGuild.members }
        )
    }
    
    if (action === 'deposit') {
        if (!user.rpg.guildId) {
            return m.reply(`❌ Kamu tidak dalam guild!`)
        }
        
        const myGuild = guilds[user.rpg.guildId]
        if (!myGuild) {
            return m.reply(`❌ Guild tidak ditemukan!`)
        }
        
        const amount = parseInt(args[1]) || 0
        if (amount < 100) {
            return m.reply(`❌ Minimal deposit 100!`)
        }
        
        if ((user.koin || 0) < amount) {
            return m.reply(`❌ Balance kurang!`)
        }
        
        user.koin -= amount
        myGuild.treasury = (myGuild.treasury || 0) + amount
        db.save()
        
        return m.reply(
            `✅ *ᴅᴇᴘᴏsɪᴛ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `> 💰 +${amount.toLocaleString()} ke treasury guild\n` +
            `> 🏰 Total: ${myGuild.treasury.toLocaleString()}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
