const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'cook',
    alias: ['masak', 'cooking'],
    category: 'rpg',
    description: 'Memasak makanan untuk menambah health',
    usage: '.cook',
    example: '.cook',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

const RECIPES = {
    fish_soup: { name: '🍲 Sup Ikan', materials: { fish: 2 }, heal: 30 },
    grilled_meat: { name: '🍖 Daging Panggang', materials: { rabbit: 1, wood: 1 }, heal: 40 },
    apple_pie: { name: '🥧 Pie Apel', materials: { apple: 3 }, heal: 25 },
    steak: { name: '🥩 Steak', materials: { boar: 1, coal: 1 }, heal: 60 }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    user.rpg.health = user.rpg.health || 100
    user.rpg.maxHealth = user.rpg.maxHealth || 100
    
    if (user.rpg.health >= user.rpg.maxHealth) {
        return m.reply(`❤️ Health sudah penuh!`)
    }
    
    let cooked = null
    for (const [key, recipe] of Object.entries(RECIPES)) {
        let canCook = true
        for (const [mat, qty] of Object.entries(recipe.materials)) {
            if ((user.inventory[mat] || 0) < qty) {
                canCook = false
                break
            }
        }
        if (canCook) {
            cooked = { key, ...recipe }
            break
        }
    }
    
    if (!cooked) {
        let txt = `🍳 *ᴄᴏᴏᴋ - ʀᴇsᴇᴘ*\n\n`
        for (const [key, recipe] of Object.entries(RECIPES)) {
            txt += `╭┈┈⬡「 ${recipe.name} 」\n`
            txt += `┃ ❤️ Heal: +${recipe.heal}\n`
            txt += `┃ 📦 Bahan:\n`
            for (const [mat, qty] of Object.entries(recipe.materials)) {
                const has = user.inventory[mat] || 0
                txt += `┃   ${has >= qty ? '✅' : '❌'} ${mat}: ${has}/${qty}\n`
            }
            txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        }
        return m.reply(txt)
    }
    
    for (const [mat, qty] of Object.entries(cooked.materials)) {
        user.inventory[mat] -= qty
    }
    
    const oldHealth = user.rpg.health
    user.rpg.health = Math.min(user.rpg.health + cooked.heal, user.rpg.maxHealth)
    
    db.save()
    
    let txt = `🍳 *ᴄᴏᴏᴋ sᴜᴋsᴇs*\n\n`
    txt += `> 🍽️ Membuat: ${cooked.name}\n`
    txt += `> ❤️ Health: ${oldHealth} → *${user.rpg.health}*`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
