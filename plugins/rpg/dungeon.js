const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')

const pluginConfig = {
    name: 'dungeon',
    alias: ['dg', 'explore', 'labirin'],
    category: 'rpg',
    description: 'Jelajahi dungeon dan lawan monster',
    usage: '.dungeon',
    example: '.dungeon',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 300,
    energi: 2,
    isEnabled: true
}

const DUNGEONS = [
    { name: '🌲 Hutan Gelap', difficulty: 1, monsters: ['Goblin', 'Slime', 'Wolf'], minReward: 100, maxReward: 300 },
    { name: '🏰 Kastil Tua', difficulty: 2, monsters: ['Skeleton', 'Zombie', 'Ghost'], minReward: 200, maxReward: 500 },
    { name: '🌋 Gunung Api', difficulty: 3, monsters: ['Fire Elemental', 'Magma Golem', 'Dragon Whelp'], minReward: 400, maxReward: 800 },
    { name: '🧊 Gua Es', difficulty: 4, monsters: ['Ice Golem', 'Frost Giant', 'Yeti'], minReward: 600, maxReward: 1200 },
    { name: '👹 Neraka', difficulty: 5, monsters: ['Demon', 'Succubus', 'Devil Lord'], minReward: 1000, maxReward: 2500 }
]

const LOOT_TABLE = [
    { item: 'iron', chance: 40, qty: [1, 5] },
    { item: 'gold', chance: 20, qty: [1, 3] },
    { item: 'diamond', chance: 5, qty: [1, 2] },
    { item: 'potion', chance: 30, qty: [1, 3] },
    { item: 'herb', chance: 25, qty: [2, 6] },
    { item: 'leather', chance: 35, qty: [2, 5] },
    { item: 'mysterybox', chance: 3, qty: [1, 1] }
]

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const staminaCost = 30
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk dungeon.\n` +
            `> Stamina kamu: ${user.rpg.stamina}\n\n` +
            `💡 *Tips:* Gunakan \`${m.prefix}rest\` atau makan makanan`
        )
    }
    
    const userLevel = user.level || 1
    const availableDungeons = DUNGEONS.filter(d => userLevel >= d.difficulty * 5)
    
    if (availableDungeons.length === 0) {
        return m.reply(`❌ Level kamu terlalu rendah! Minimal level 5 untuk dungeon.`)
    }
    
    const dungeon = availableDungeons[Math.floor(Math.random() * availableDungeons.length)]
    const monster = dungeon.monsters[Math.floor(Math.random() * dungeon.monsters.length)]
    
    user.rpg.stamina -= staminaCost
    
    await m.react('⚔️')
    await m.reply(`🚪 *ᴍᴀsᴜᴋ ${dungeon.name.toUpperCase()}...*\n\n> Stamina: -${staminaCost}`)
    await new Promise(r => setTimeout(r, 1500))
    
    await m.reply(`👹 *ᴍᴇɴᴇᴍᴜᴋᴀɴ* ${monster}!\n\n> Bersiap untuk bertarung...`)
    await new Promise(r => setTimeout(r, 2000))
    
    const userPower = (user.rpg.attack || 10) + userLevel * 3 + Math.floor(Math.random() * 20)
    const monsterPower = dungeon.difficulty * 15 + Math.floor(Math.random() * 30)
    
    const isWin = userPower >= monsterPower || Math.random() > 0.3
    
    let txt = ``
    
    if (isWin) {
        const expReward = 150 * dungeon.difficulty + Math.floor(Math.random() * 100)
        const goldReward = Math.floor(Math.random() * (dungeon.maxReward - dungeon.minReward)) + dungeon.minReward
        
        const droppedItems = []
        for (const loot of LOOT_TABLE) {
            if (Math.random() * 100 < loot.chance * (dungeon.difficulty * 0.5)) {
                const qty = Math.floor(Math.random() * (loot.qty[1] - loot.qty[0] + 1)) + loot.qty[0]
                user.inventory[loot.item] = (user.inventory[loot.item] || 0) + qty
                droppedItems.push(`${loot.item} x${qty}`)
            }
        }
        
        user.koin = (user.koin || 0) + goldReward
        await addExpWithLevelCheck(sock, m, db, user, expReward)
        
        txt = `🎉 *ᴋᴇᴍᴇɴᴀɴɢᴀɴ!*\n\n`
        txt += `> Berhasil mengalahkan ${monster} di ${dungeon.name}!\n\n`
        txt += `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅ* 」\n`
        txt += `┃ ✨ EXP: *+${expReward}*\n`
        txt += `┃ 💰 Gold: *+${goldReward.toLocaleString()}*\n`
        if (droppedItems.length > 0) {
            txt += `┃ 📦 Loot: *${droppedItems.join(', ')}*\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        await m.react('🏆')
    } else {
        const goldLoss = Math.floor((user.koin || 0) * 0.1)
        user.koin = Math.max(0, (user.koin || 0) - goldLoss)
        user.rpg.health = Math.max(10, (user.rpg.health || 100) - 30)
        
        txt = `💀 *ᴋᴇᴋᴀʟᴀʜᴀɴ!*\n\n`
        txt += `> Dikalahkan oleh ${monster}...\n\n`
        txt += `╭┈┈⬡「 💔 *ᴘᴇɴᴀʟᴛʏ* 」\n`
        txt += `┃ 💸 Gold: *-${goldLoss.toLocaleString()}*\n`
        txt += `┃ ❤️ HP: *-30*\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `💡 *Tips:* Tingkatkan level dan equipment`
        
        await m.react('💀')
    }
    
    db.save()
    return m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
