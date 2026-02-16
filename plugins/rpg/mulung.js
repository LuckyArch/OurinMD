const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'mulung',
    alias: ['scavenge', 'kumpulsampah'],
    category: 'rpg',
    description: 'Memulung untuk mengumpulkan barang',
    usage: '.mulung',
    example: '.mulung',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 300,
    energi: 1,
    isEnabled: true
}

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🗑️ *ᴍᴜʟᴜɴɢ*', body = 'Mengumpulkan barang') {
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
    
    const staminaCost = 15
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Butuh ${staminaCost} stamina untuk memulung\n` +
            `> Stamina kamu: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.react('⏳')
    await m.reply(`🗑️ *sᴇᴅᴀɴɢ ᴍᴇᴍᴜʟᴜɴɢ...*`)
    await new Promise(r => setTimeout(r, 2000))
    
    const drops = [
        { item: 'botol', name: '🍶 Botol', min: 1, max: 10 },
        { item: 'kaleng', name: '🥫 Kaleng', min: 1, max: 8 },
        { item: 'kardus', name: '📦 Kardus', min: 1, max: 5 },
        { item: 'sampah', name: '🗑️ Sampah', min: 1, max: 15 },
        { item: 'koran', name: '📰 Koran', min: 0, max: 3 }
    ]
    
    let results = []
    let moneyEarned = 0
    
    for (const drop of drops) {
        const qty = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min
        if (qty > 0) {
            user.inventory[drop.item] = (user.inventory[drop.item] || 0) + qty
            results.push({ name: drop.name, qty })
            moneyEarned += qty * Math.floor(Math.random() * 50 + 10)
        }
    }
    
    user.koin = (user.koin || 0) + moneyEarned
    
    const expGain = Math.floor(Math.random() * 200) + 50
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain)
    
    db.save()
    
    await m.react('✅')
    
    let txt = `🗑️ *ᴍᴜʟᴜɴɢ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 📦 *ʜᴀsɪʟ* 」\n`
    for (const r of results) {
        txt += `┃ ${r.name}: *+${r.qty}*\n`
    }
    txt += `┃ ─────────\n`
    txt += `┃ 💵 Jual: *+Rp ${moneyEarned.toLocaleString('id-ID')}*\n`
    txt += `┃ 🚄 Exp: *+${expGain}*\n`
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
