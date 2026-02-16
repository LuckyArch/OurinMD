const config = require('../../config')

const pluginConfig = {
    name: 'listprem',
    alias: ['listpremium', 'premlist'],
    category: 'owner',
    description: 'Melihat daftar premium user',
    usage: '.listprem',
    example: '.listprem',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = require('../../src/lib/database').getDatabase()
    const premiumUsers = db.data.premium || []
    
    if (premiumUsers.length === 0) {
        return m.reply(`💎 *ʟɪsᴛ ᴘʀᴇᴍɪᴜᴍ*\n\n> Tidak ada premium user yang terdaftar\n\n\`Gunakan: ${m.prefix}addprem <nomor>\``)
    }
    
    let txt = `💎 *ʟɪsᴛ ᴘʀᴇᴍɪᴜᴍ*\n\n`
    txt += `╭┈┈⬡「 👑 *ᴜsᴇʀs* 」\n`
    
    for (let i = 0; i < premiumUsers.length; i++) {
        txt += `┃ ${i + 1}. \`${premiumUsers[i]}\`\n`
    }
    
    txt += `╰┈┈⬡\n\n`
    txt += `> ᴛᴏᴛᴀʟ: \`${premiumUsers.length}\` ᴘʀᴇᴍɪᴜᴍ ᴜsᴇʀ`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
