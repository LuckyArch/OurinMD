const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'delprem',
    alias: ['delpremium', 'rmprem', 'removeprem'],
    category: 'owner',
    description: 'Menghapus user dari daftar premium',
    usage: '.delprem <nomor/@tag>',
    example: '.delprem 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let targetNumber = ''
    
    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    }
    
    if (!targetNumber) {
        return m.reply(`💎 *ᴅᴇʟ ᴘʀᴇᴍɪᴜᴍ*\n\n> Masukkan nomor atau tag user\n\n\`Contoh: ${m.prefix}delprem 6281234567890\``)
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (!db.data.premium) db.data.premium = []
    const premiumList = db.data.premium
    
    const index = premiumList.findIndex(num => {
        const cleanNum = num?.replace(/[^0-9]/g, '') || ''
        return cleanNum.includes(targetNumber) || targetNumber.includes(cleanNum)
    })
    
    if (index === -1) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Nomor \`${targetNumber}\` bukan premium`)
    }
    
    const removedNumber = db.data.premium.splice(index, 1)[0]
    
    // Sync to user object
    const jid = removedNumber + '@s.whatsapp.net'
    const user = db.getUser(jid)
    if (user) {
        user.isPremium = false
        db.setUser(jid, user)
    }
    
    db.save()
    
    m.react('✅')
    
    await m.reply(
        `🗑️ *ᴘʀᴇᴍɪᴜᴍ ᴅɪʜᴀᴘᴜs*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📱 ɴᴏᴍᴏʀ: \`${removedNumber}\`\n` +
        `┃ 🆓 sᴛᴀᴛᴜs: \`Free User\`\n` +
        `┃ 📊 sɪsᴀ: \`${db.data.premium.length}\` ᴜsᴇʀ\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
