const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'berburu',
    alias: ['huntanimal', 'buru'],
    category: 'rpg',
    description: 'Berburu hewan untuk mendapat item',
    usage: '.berburu',
    example: '.berburu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energi: 1,
    isEnabled: true
}

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🏹 *ʙᴇʀʙᴜʀᴜ*', body = 'Hasil Buruan') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbRpg) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbRpg,
            mediaType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const staminaCost = 25
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk berburu\n` +
            `> Stamina kamu: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.react('🏹')
    await m.reply(`🏹 *sᴇᴅᴀɴɢ ʙᴇʀʙᴜʀᴜ...*`)
    await new Promise(r => setTimeout(r, 3000))
    
    const animals = [
        { name: '🐰 Kelinci', item: 'daging_kelinci', chance: 80, min: 1, max: 3, exp: 50, money: 500 },
        { name: '🦌 Rusa', item: 'daging_rusa', chance: 50, min: 1, max: 2, exp: 100, money: 1500 },
        { name: '🐗 Babi Hutan', item: 'daging_babi', chance: 40, min: 1, max: 2, exp: 150, money: 2000 },
        { name: '🦊 Rubah', item: 'bulu_rubah', chance: 30, min: 1, max: 1, exp: 200, money: 3000 },
        { name: '🐻 Beruang', item: 'cakar_beruang', chance: 15, min: 1, max: 1, exp: 500, money: 10000 },
        { name: '🦁 Singa', item: 'taring_singa', chance: 5, min: 1, max: 1, exp: 1000, money: 25000 }
    ]
    
    const caught = animals.filter(a => Math.random() * 100 <= a.chance)
    
    if (caught.length === 0) {
        await m.react('😢')
        db.save()
        return m.reply(
            `🏹 *ʙᴇʀʙᴜʀᴜ ɢᴀɢᴀʟ*\n\n` +
            `> Kamu tidak mendapat buruan kali ini\n` +
            `> Stamina: *-${staminaCost}*`
        )
    }
    
    let results = []
    let totalExp = 0
    let totalMoney = 0
    
    for (const animal of caught.slice(0, 3)) {
        const qty = Math.floor(Math.random() * (animal.max - animal.min + 1)) + animal.min
        user.inventory[animal.item] = (user.inventory[animal.item] || 0) + qty
        totalExp += animal.exp * qty
        totalMoney += animal.money * qty
        results.push({ name: animal.name, qty, money: animal.money * qty })
    }
    
    user.koin = (user.koin || 0) + totalMoney
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, totalExp)
    
    db.save()
    
    await m.react('✅')
    
    let txt = `🏹 *ʙᴇʀʙᴜʀᴜ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 🎯 *ʜᴀsɪʟ ʙᴜʀᴜᴀɴ* 」\n`
    for (const r of results) {
        txt += `┃ ${r.name}: *+${r.qty}*\n`
    }
    txt += `┃ ─────────\n`
    txt += `┃ 💵 Jual: *+Rp ${totalMoney.toLocaleString('id-ID')}*\n`
    txt += `┃ 🚄 Exp: *+${totalExp}*\n`
    txt += `┃ ⚡ Stamina: *-${staminaCost}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
