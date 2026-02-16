const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'onlypc',
    alias: ['onlyprivate', 'privateonly'],
    category: 'owner',
    description: 'Toggle mode bot hanya di private chat',
    usage: '.onlypc',
    example: '.onlypc',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const currentMode = db.setting('onlyPc') || false
    
    if (currentMode) {
        db.setting('onlyPc', false)
        m.react('❌')
        return m.reply(`❌ *ᴏɴʟʏ ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Bot bisa diakses di mana saja`)
    } else {
        db.setting('onlyPc', true)
        db.setting('onlyGc', false)
        m.react('✅')
        return m.reply(`✅ *ᴏɴʟʏ ᴘʀɪᴠᴀᴛᴇ ᴍᴏᴅᴇ ᴀᴋᴛɪꜰ*\n\n> Bot hanya bisa diakses di private chat!`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
