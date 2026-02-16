const { getDatabase } = require('../../src/lib/database')
const { DEFAULT_TOXIC_WORDS } = require('./antitoxic')

const pluginConfig = {
    name: 'listtoxic',
    alias: ['toxiclist', 'katatoxic', 'lihatkata'],
    category: 'group',
    description: 'Lihat daftar kata toxic',
    usage: '.listtoxic',
    example: '.listtoxic',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    
    const customWords = groupData.toxicWords || []
    const defaultWords = DEFAULT_TOXIC_WORDS || []
    
    let text = `📋 *ᴅᴀꜰᴛᴀʀ ᴋᴀᴛᴀ ᴛᴏxɪᴄ*\n\n`
    
    if (customWords.length > 0) {
        text += `╭┈┈⬡「 ✏️ *ᴄᴜsᴛᴏᴍ* (${customWords.length}) 」\n`
        for (let i = 0; i < customWords.length; i++) {
            text += `┃ ${i + 1}. ${customWords[i]}\n`
        }
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    }
    
    text += `╭┈┈⬡「 📦 *ᴅᴇꜰᴀᴜʟᴛ* (${defaultWords.length}) 」\n`
    
    const showCount = Math.min(defaultWords.length, 10)
    for (let i = 0; i < showCount; i++) {
        text += `┃ ${i + 1}. ${defaultWords[i]}\n`
    }
    
    if (defaultWords.length > 10) {
        text += `┃ ... dan ${defaultWords.length - 10} lainnya\n`
    }
    
    text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    text += `> Total: *${customWords.length + defaultWords.length}* kata\n`
    text += `> \`.addtoxic <kata>\` untuk tambah\n`
    text += `> \`.deltoxic <kata>\` untuk hapus`
    
    await m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
