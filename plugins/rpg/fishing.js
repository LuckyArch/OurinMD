
const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'fishing',
    alias: ['fish', 'mancing'],
    category: 'rpg',
    description: 'Memancing untuk mendapatkan ikan',
    usage: '.fishing',
    example: '.fishing',
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
    
    const staminaCost = 15
    user.rpg.stamina = user.rpg.stamina || 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk memancing.\n` +
            `> Stamina kamu: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.reply('🎣 *sᴇᴅᴀɴɢ ᴍᴇᴍᴀɴᴄɪɴɢ...*')
    await new Promise(r => setTimeout(r, 2000))
    
    const drops = [
        { item: 'trash', chance: 20, name: '🗑️ Sampah', exp: 10 },
        { item: 'fish', chance: 50, name: '🐟 Ikan', exp: 100 },
        { item: 'prawn', chance: 30, name: '🦐 Udang', exp: 150 },
        { item: 'octopus', chance: 15, name: '🐙 Gurita', exp: 300 },
        { item: 'shark', chance: 5, name: '🦈 Hiu', exp: 800 },
        { item: 'whale', chance: 1, name: '🐳 Paus', exp: 2000 }
    ]
    
    const rand = Math.random() * 100
    let caught = drops[0]
    
    for (const drop of drops.sort((a, b) => a.chance - b.chance)) {
        if (rand <= drop.chance) {
            caught = drop
            break
        }
    }
    
    const qty = 1
    user.inventory[caught.item] = (user.inventory[caught.item] || 0) + qty
    
    const expReward = caught.exp
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward)
    
    db.save()
    
    let txt = `🎣 *ꜰɪsʜɪɴɢ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 📦 *ʜᴀsɪʟ* 」\n`
    txt += `┃ ${caught.name}: *+${qty}*\n`
    txt += `┃ 🚄 Exp: *+${expReward}*\n`
    txt += `┃ ⚡ Stamina: *-${staminaCost}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
