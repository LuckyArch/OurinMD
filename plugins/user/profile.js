const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const fs = require('fs')

const pluginConfig = {
    name: 'profile',
    alias: ['me', 'profil', 'myprofile', 'my', 'stats', 'status'],
    category: 'user',
    description: 'Melihat profil user dengan RPG stats',
    usage: '.profile [@user]',
    example: '.profile',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function getRole(level) {
    if (level >= 100) return 'Mythic'
    if (level >= 80) return 'Legend'
    if (level >= 60) return 'Epic'
    if (level >= 40) return 'Grandmaster'
    if (level >= 20) return 'Master'
    if (level >= 10) return 'Elite'
    return 'Warrior'
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num
}

function getLevelBar(current, target) {
    const totalBars = 10
    const filledBars = Math.min(Math.floor((current / target) * totalBars), totalBars)
    const emptyBars = totalBars - filledBars
    return '▰'.repeat(filledBars) + '▱'.repeat(emptyBars)
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender
    
    const user = db.getUser(target) || db.setUser(target)
    
    if (!user.rpg) user.rpg = {}
    const userExp = user.exp || 0
    const userLevel = Math.floor(userExp / 20000) + 1
    user.rpg.level = userLevel
    user.rpg.health = user.rpg.health || 100
    user.rpg.maxHealth = 100 + (userLevel - 1) * 10
    user.rpg.mana = user.rpg.mana || 100
    user.rpg.maxMana = 100 + (userLevel - 1) * 5
    user.rpg.stamina = user.rpg.stamina || 100
    user.rpg.maxStamina = 100 + (userLevel - 1) * 5
    
    const levelUpExp = userLevel * 20000
    const role = getRole(userLevel)
    const isOwner = config.isOwner(target)
    const isPremium = config.isPremium(target)
    
    let ppMedia = null
    try {
        const ppUrl = await sock.profilePictureUrl(target, 'image')
        if (ppUrl) {
            ppMedia = { url: ppUrl }
        } else {
            throw new Error('No PP')
        }
    } catch {
        const fallbackPath = './assets/images/pp-kosong.jpg'
        if (fs.existsSync(fallbackPath)) {
            ppMedia = fs.readFileSync(fallbackPath)
        } else {
            ppMedia = { url: 'https://i.imgur.com/TuItj4L.png' }
        }
    }

    let caption = `╭━━━━━━━━━━━━━━━━━╮\n`
    caption += `┃ 👤 *ᴜsᴇʀ ᴘʀᴏꜰɪʟᴇ*\n`
    caption += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    caption += `🏷️ Name: *${user.name || m.pushName || 'User'}*\n`
    caption += `🆔 Tag: @${target.split('@')[0]}\n`
    caption += `👑 Status: *${isOwner ? 'Owner' : isPremium ? 'Premium' : 'Free'}*\n\n`
    
    caption += `╭┈┈⬡「 ⚔️ *ʀᴘɢ sᴛᴀᴛs* 」\n`
    caption += `┃ 🛡️ Role: *${role}*\n`
    caption += `┃ 📊 Level: *${user.rpg.level}*\n`
    caption += `┃ 🚄 Exp: *${formatNumber(userExp)} / ${formatNumber(levelUpExp)}*\n`
    caption += `┃ ${getLevelBar(userExp, levelUpExp)}\n`
    caption += `┃\n`
    caption += `┃ ❤️ Health: *${user.rpg.health} / ${user.rpg.maxHealth}*\n`
    caption += `┃ 💧 Mana: *${user.rpg.mana} / ${user.rpg.maxMana}*\n`
    caption += `┃ ⚡ Stamina: *${user.rpg.stamina} / ${user.rpg.maxStamina}*\n`
    caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    caption += `╭┈┈⬡「 💰 *ᴀssᴇᴛs* 」\n`
    caption += `┃ 🪙 Koin: *Rp ${user.koin?.toLocaleString('id-ID') || 0}*\n`
    caption += `┃ 🏦 Bank: *Rp ${user.rpg.bank?.toLocaleString('id-ID') || 0}*\n`
    caption += `┃ ⚡ Energi: *${isOwner || isPremium ? '∞ Unlimited' : user.energi}*\n`
    if (user.rpg.spouse) {
        caption += `┃ 💑 Spouse: @${user.rpg.spouse.split('@')[0]}\n`
    }
    caption += `╰┈┈┈┈┈┈┈┈⬡`

    const mentions = [target]
    if (user.rpg.spouse) mentions.push(user.rpg.spouse)
    
    const msgOptions = { caption, mentions }
    if (ppMedia) {
        msgOptions.image = ppMedia
    }
    
    await sock.sendMessage(m.chat, msgOptions, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
