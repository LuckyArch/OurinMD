const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'marry',
    alias: ['nikah', 'wedding', 'propose'],
    category: 'rpg',
    description: 'Menikahi player lain',
    usage: '.marry @user',
    example: '.marry @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    
    if (!target) {
        return m.reply(
            `💒 *ᴍᴀʀʀʏ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Tag pasangan yang mau dinikahi\n` +
            `┃ > \`.marry @user\`\n` +
            `┃ > Biaya: Rp 50.000\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (target === m.sender) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Tidak bisa menikahi diri sendiri!`)
    }
    
    const partner = db.getUser(target) || db.setUser(target)
    if (!partner.rpg) partner.rpg = {}
    
    if (user.rpg.spouse) {
        return m.reply(
            `❌ *sᴜᴅᴀʜ ᴍᴇɴɪᴋᴀʜ*\n\n` +
            `> Kamu sudah menikah dengan @${user.rpg.spouse.split('@')[0]}!\n` +
            `> Cerai dulu dengan \`.divorce\``,
            { mentions: [user.rpg.spouse] }
        )
    }
    
    if (partner.rpg.spouse) {
        return m.reply(
            `❌ *ᴛᴀʀɢᴇᴛ sᴜᴅᴀʜ ᴍᴇɴɪᴋᴀʜ*\n\n` +
            `> @${target.split('@')[0]} sudah menikah dengan orang lain!`,
            { mentions: [target] }
        )
    }
    
    const marriageCost = 50000
    if ((user.koin || 0) < marriageCost) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Koin kamu: Rp ${(user.koin || 0).toLocaleString('id-ID')}\n` +
            `> Butuh: Rp ${marriageCost.toLocaleString('id-ID')}`
        )
    }
    
    user.koin -= marriageCost
    user.rpg.spouse = target
    user.rpg.marriedAt = Date.now()
    partner.rpg.spouse = m.sender
    partner.rpg.marriedAt = Date.now()
    
    db.save()
    
    let txt = `💒 *ᴘᴇʀɴɪᴋᴀʜᴀɴ*\n\n`
    txt += `> 💑 @${m.sender.split('@')[0]} & @${target.split('@')[0]}\n`
    txt += `> 💍 Resmi menikah!\n`
    txt += `> 💸 Biaya: Rp ${marriageCost.toLocaleString('id-ID')}\n\n`
    txt += `> _Semoga langgeng! 💕_`
    
    await m.reply(txt, { mentions: [m.sender, target] })
}

module.exports = {
    config: pluginConfig,
    handler
}
