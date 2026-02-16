const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addtoxic',
    alias: ['tambahtoxic', 'addkata'],
    category: 'group',
    description: 'Tambah kata toxic ke daftar',
    usage: '.addtoxic <kata>',
    example: '.addtoxic kata_kasar',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const word = m.args.join(' ').trim().toLowerCase()
    
    if (!word) {
        return m.reply(
            `📝 *ᴀᴅᴅ ᴛᴏxɪᴄ*\n\n` +
            `> Gunakan: \`.addtoxic <kata>\`\n\n` +
            `\`Contoh: ${m.prefix}addtoxic katakasar\``
        )
    }
    
    if (word.length < 2) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Kata terlalu pendek (min 2 huruf)`)
    }
    
    if (word.length > 30) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Kata terlalu panjang (max 30 huruf)`)
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const toxicWords = groupData.toxicWords || []
    
    if (toxicWords.includes(word)) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Kata \`${word}\` sudah ada di daftar`)
    }
    
    toxicWords.push(word)
    db.setGroup(m.chat, { toxicWords })
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴋᴀᴛᴀ ᴛᴏxɪᴄ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📝 ᴋᴀᴛᴀ: \`${word}\`\n` +
        `┃ 📊 ᴛᴏᴛᴀʟ: \`${toxicWords.length}\` kata\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
