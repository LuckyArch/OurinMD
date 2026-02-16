const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'energi',
    alias: ['cekenergi', 'myenergi', 'energy', 'limit', 'ceklimit'],
    category: 'user',
    description: 'Cek energi user',
    usage: '.energi [@user]',
    example: '.energi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ Unlimited'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let targetJid = m.sender
    let targetName = m.pushName || 'Kamu'
    
    if (m.quoted) {
        targetJid = m.quoted.sender
        targetName = m.quoted.pushName || targetJid.split('@')[0]
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
        targetName = targetJid.split('@')[0]
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const isOwner = config.owner?.number?.includes(targetJid.replace(/[^0-9]/g, '')) || config.isOwner?.(targetJid)
    const finalEnergi = isOwner ? -1 : user.energi
    const isUnlimited = finalEnergi === -1
    const energiDisplay = formatNumber(finalEnergi)
    
    const isSelf = targetJid === m.sender
    
    let userStatus = 'Free'
    if (isOwner) userStatus = 'Owner'
    else if (user.isPremium) userStatus = 'Premium'
    
    let text = `╭━━━━━━━━━━━━━━━━━╮\n`
    text += `┃  ⚡ *ᴇɴᴇʀɢɪ ɪɴꜰᴏ*\n`
    text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    text += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
    text += `┃ 👤 ᴜsᴇʀ: *${targetName}*\n`
    text += `┃ ⚡ ᴇɴᴇʀɢɪ: *${energiDisplay}*\n`
    text += `┃ 💎 sᴛᴀᴛᴜs: *${userStatus}*\n`
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    if (isSelf && !isUnlimited && finalEnergi < 10) {
        text += `> ⚠️ Energi hampir habis!\n`
        text += `> Gunakan \`.buyenergi\` untuk beli`
    } else if (isUnlimited) {
        text += `> ✨ Energi unlimited aktif!`
    }
    
    await m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
