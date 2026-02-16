const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'mining',
    alias: ['mine', 'tambang'],
    category: 'rpg',
    description: 'Menambang untuk mendapatkan ores dan gems',
    usage: '.mining',
    example: '.mining',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const staminaCost = 20
    user.rpg.stamina = user.rpg.stamina || 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk mining.\n` +
            `> Stamina kamu: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.reply('⛏️ *sᴇᴅᴀɴɢ ᴍᴇɴᴀᴍʙᴀɴɢ...*')
    await new Promise(r => setTimeout(r, 2000))
    
    const drops = [
        { item: 'rock', chance: 80, name: '🪨 Batu', min: 2, max: 5 },
        { item: 'coal', chance: 50, name: '⚫ Batubara', min: 1, max: 3 },
        { item: 'iron', chance: 30, name: '⛓️ Besi', min: 1, max: 2 },
        { item: 'gold', chance: 15, name: '🥇 Emas', min: 1, max: 1 },
        { item: 'diamond', chance: 5, name: '💠 Berlian', min: 1, max: 1 },
        { item: 'emerald', chance: 2, name: '💚 Emerald', min: 1, max: 1 }
    ]
    
    let results = []
    for (const drop of drops) {
        if (Math.random() * 100 <= drop.chance) {
            const qty = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min
            user.inventory[drop.item] = (user.inventory[drop.item] || 0) + qty
            results.push({ name: drop.name, qty })
        }
    }
    
    if (results.length === 0) {
        user.inventory['rock'] = (user.inventory['rock'] || 0) + 1
        results.push({ name: '🪨 Batu', qty: 1 })
    }
    
    const expGain = Math.floor(Math.random() * 500) + 100
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain)
    
    db.save()
    
    let txt = `⛏️ *ᴍɪɴɪɴɢ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 📦 *ʜᴀsɪʟ* 」\n`
    for (const r of results) {
        txt += `┃ ${r.name}: *+${r.qty}*\n`
    }
    txt += `┃ 🚄 Exp: *+${expGain}*\n`
    txt += `┃ ⚡ Stamina: *-${staminaCost}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
