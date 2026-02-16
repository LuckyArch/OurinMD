const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')

const pluginConfig = {
    name: 'arena',
    alias: ['pvp', 'battle', 'fight'],
    category: 'rpg',
    description: 'Bertarung di arena PvP',
    usage: '.arena <@user>',
    example: '.arena @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 180,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const mentioned = m.mentionedJid?.[0] || m.quoted?.sender
    if (!mentioned) {
        return m.reply(
            `⚔️ *ᴀʀᴇɴᴀ ᴘᴠᴘ*\n\n` +
            `> Tantang player lain untuk duel!\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${m.prefix}arena @user\n` +
            `┃ Reply pesan user + ${m.prefix}arena\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `⚠️ *Risiko:* Kalah = -20% balance`
        )
    }
    
    if (mentioned === m.sender) {
        return m.reply(`❌ Tidak bisa bertarung dengan diri sendiri!`)
    }
    
    const opponent = db.getUser(mentioned)
    if (!opponent) {
        return m.reply(`❌ Lawan belum terdaftar di database!`)
    }
    
    if (!opponent.rpg) opponent.rpg = {}
    
    const myHealth = user.rpg.health || 100
    const myAttack = (user.rpg.attack || 10) + (user.level || 1) * 2
    const myDefense = (user.rpg.defense || 5) + (user.level || 1)
    
    const oppHealth = opponent.rpg.health || 100
    const oppAttack = (opponent.rpg.attack || 10) + (opponent.level || 1) * 2
    const oppDefense = (opponent.rpg.defense || 5) + (opponent.level || 1)
    
    await m.react('⚔️')
    await m.reply(`⚔️ *ᴘᴇʀᴛᴀʀᴜɴɢᴀɴ ᴅɪᴍᴜʟᴀɪ...*\n\n> @${m.sender.split('@')[0]} vs @${mentioned.split('@')[0]}`, { mentions: [m.sender, mentioned] })
    await new Promise(r => setTimeout(r, 2000))
    
    let myHp = myHealth
    let oppHp = oppHealth
    let round = 0
    let battleLog = []
    
    while (myHp > 0 && oppHp > 0 && round < 10) {
        round++
        
        const myDmg = Math.max(5, myAttack - oppDefense + Math.floor(Math.random() * 10))
        oppHp -= myDmg
        battleLog.push(`🔥 Kamu menyerang: *-${myDmg} HP*`)
        
        if (oppHp <= 0) break
        
        const oppDmg = Math.max(5, oppAttack - myDefense + Math.floor(Math.random() * 10))
        myHp -= oppDmg
        battleLog.push(`💢 Lawan menyerang: *-${oppDmg} HP*`)
    }
    
    const isWin = myHp > oppHp
    
    let txt = `⚔️ *ʜᴀsɪʟ ᴘᴇʀᴛᴀʀᴜɴɢᴀɴ*\n\n`
    txt += `╭┈┈⬡「 📊 *sᴛᴀᴛs* 」\n`
    txt += `┃ 🧑 Kamu: ${Math.max(0, myHp)}/${myHealth} HP\n`
    txt += `┃ 👤 Lawan: ${Math.max(0, oppHp)}/${oppHealth} HP\n`
    txt += `┃ 🔄 Round: ${round}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    txt += `📜 *Battle Log:*\n`
    txt += battleLog.slice(-6).map(l => `> ${l}`).join('\n')
    txt += `\n\n`
    
    if (isWin) {
        const expReward = 300 + (opponent.level || 1) * 50
        const goldReward = Math.floor((opponent.koin || 0) * 0.1)
        
        user.koin = (user.koin || 0) + goldReward
        opponent.koin = Math.max(0, (opponent.koin || 0) - goldReward)
        
        await addExpWithLevelCheck(sock, m, db, user, expReward)
        
        txt += `🎉 *ᴋᴇᴍᴇɴᴀɴɢᴀɴ!*\n`
        txt += `> ✨ EXP: +${expReward}\n`
        txt += `> 💰 Gold: +${goldReward.toLocaleString()}`
        
        await m.react('🏆')
    } else {
        const goldLoss = Math.floor((user.koin || 0) * 0.2)
        user.koin = Math.max(0, (user.koin || 0) - goldLoss)
        
        txt += `💀 *ᴋᴇᴋᴀʟᴀʜᴀɴ!*\n`
        txt += `> 💸 Gold: -${goldLoss.toLocaleString()}`
        
        await m.react('💀')
    }
    
    db.setUser(m.sender, user)
    db.setUser(mentioned, opponent)
    db.save()
    
    return m.reply(txt, { mentions: [m.sender, mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
