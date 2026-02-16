const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'divorce',
    alias: ['cerai', 'pisah'],
    category: 'rpg',
    description: 'Bercerai dari pasangan',
    usage: '.divorce',
    example: '.divorce',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    if (!user.rpg.spouse) {
        return m.reply(
            `❌ *ʙᴇʟᴜᴍ ᴍᴇɴɪᴋᴀʜ*\n\n` +
            `> Kamu belum menikah!\n` +
            `> Nikah dengan \`.marry @user\``
        )
    }
    
    const spouseJid = user.rpg.spouse
    const partner = db.getUser(spouseJid)
    
    const divorceCost = 25000
    if ((user.koin || 0) < divorceCost) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Koin kamu: Rp ${(user.koin || 0).toLocaleString('id-ID')}\n` +
            `> Butuh: Rp ${divorceCost.toLocaleString('id-ID')}`
        )
    }
    
    user.koin -= divorceCost
    user.rpg.spouse = null
    user.rpg.marriedAt = null
    
    if (partner && partner.rpg) {
        partner.rpg.spouse = null
        partner.rpg.marriedAt = null
    }
    
    db.save()
    
    let txt = `💔 *ᴘᴇʀᴄᴇʀᴀɪᴀɴ*\n\n`
    txt += `> 😢 @${m.sender.split('@')[0]} & @${spouseJid.split('@')[0]}\n`
    txt += `> Resmi bercerai!\n`
    txt += `> 💸 Biaya: Rp ${divorceCost.toLocaleString('id-ID')}\n\n`
    txt += `> _Move on yaa..._`
    
    await m.reply(txt, { mentions: [m.sender, spouseJid] })
}

module.exports = {
    config: pluginConfig,
    handler
}
