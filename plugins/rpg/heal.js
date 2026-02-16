const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'heal',
    alias: ['sembuh', 'recover'],
    category: 'rpg',
    description: 'Pulihkan health dengan istirahat (gratis tapi lama)',
    usage: '.heal',
    example: '.heal',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 600,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    user.rpg.health = user.rpg.health || 100
    user.rpg.maxHealth = user.rpg.maxHealth || 100
    user.rpg.stamina = user.rpg.stamina || 100
    user.rpg.maxStamina = user.rpg.maxStamina || 100
    
    if (user.rpg.health >= user.rpg.maxHealth && user.rpg.stamina >= user.rpg.maxStamina) {
        return m.reply(`✅ Health dan Stamina sudah penuh!`)
    }
    
    await m.reply('💤 *sᴇᴅᴀɴɢ ɪsᴛɪʀᴀʜᴀᴛ...*')
    await new Promise(r => setTimeout(r, 3000))
    
    const healthRecover = 30
    const staminaRecover = 50
    
    const oldHealth = user.rpg.health
    const oldStamina = user.rpg.stamina
    
    user.rpg.health = Math.min(user.rpg.health + healthRecover, user.rpg.maxHealth)
    user.rpg.stamina = Math.min(user.rpg.stamina + staminaRecover, user.rpg.maxStamina)
    
    let txt = `💚 *ʜᴇᴀʟ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 ✨ *ʀᴇᴄᴏᴠᴇʀʏ* 」\n`
    txt += `┃ ❤️ Health: ${oldHealth} → *${user.rpg.health}*\n`
    txt += `┃ ⚡ Stamina: ${oldStamina} → *${user.rpg.stamina}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> Tip: Gunakan \`.use potion\` untuk heal instant!`
    
    db.save()
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
