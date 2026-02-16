const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'meditation',
    alias: ['rest', 'istirahat', 'tidur', 'sleep'],
    category: 'rpg',
    description: 'Istirahat untuk pulihkan HP dan stamina',
    usage: '.meditation',
    example: '.meditation',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 600,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const currentStamina = user.rpg.stamina ?? 100
    const currentHealth = user.rpg.health || 100
    const currentMana = user.rpg.mana || 50
    
    const maxStamina = 100
    const maxHealth = 100 + ((user.level || 1) * 5)
    const maxMana = 50 + ((user.level || 1) * 3)
    
    if (currentStamina >= maxStamina && currentHealth >= maxHealth && currentMana >= maxMana) {
        return m.reply(
            `💤 *sᴜᴅᴀʜ ꜰᴜʟʟ*\n\n` +
            `> ⚡ Stamina: ${currentStamina}/${maxStamina}\n` +
            `> ❤️ Health: ${currentHealth}/${maxHealth}\n` +
            `> 💙 Mana: ${currentMana}/${maxMana}\n\n` +
            `💡 Kamu sudah dalam kondisi prima!`
        )
    }
    
    await m.react('💤')
    await m.reply(`💤 *ʙᴇʀɪsᴛɪʀᴀʜᴀᴛ...*\n\n> Memulihkan energi...`)
    await new Promise(r => setTimeout(r, 3000))
    
    const staminaRecovered = Math.min(maxStamina - currentStamina, 40 + Math.floor(Math.random() * 20))
    const healthRecovered = Math.min(maxHealth - currentHealth, 30 + Math.floor(Math.random() * 20))
    const manaRecovered = Math.min(maxMana - currentMana, 25 + Math.floor(Math.random() * 15))
    
    user.rpg.stamina = Math.min(maxStamina, currentStamina + staminaRecovered)
    user.rpg.health = Math.min(maxHealth, currentHealth + healthRecovered)
    user.rpg.mana = Math.min(maxMana, currentMana + manaRecovered)
    
    db.save()
    
    await m.react('✨')
    return m.reply(
        `✨ *ɪsᴛɪʀᴀʜᴀᴛ sᴇʟᴇsᴀɪ!*\n\n` +
        `╭┈┈⬡「 💖 *ᴘᴜʟɪʜ* 」\n` +
        `┃ ⚡ Stamina: *+${staminaRecovered}* (${user.rpg.stamina}/${maxStamina})\n` +
        `┃ ❤️ Health: *+${healthRecovered}* (${user.rpg.health}/${maxHealth})\n` +
        `┃ 💙 Mana: *+${manaRecovered}* (${user.rpg.mana}/${maxMana})\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> Kamu merasa lebih segar! 🌟`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
