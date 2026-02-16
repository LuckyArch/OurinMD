const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'onlygc',
    alias: ['onlygroup', 'grouponly'],
    category: 'owner',
    description: 'Toggle mode bot hanya di grup',
    usage: '.onlygc',
    example: '.onlygc',
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
    const currentMode = db.setting('onlyGc') || false
    
    if (currentMode) {
        db.setting('onlyGc', false)
        m.react('❌')
        return m.reply(`❌ *ᴏɴʟʏ ɢʀᴏᴜᴘ ᴍᴏᴅᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Bot bisa diakses di mana saja`)
    } else {
        db.setting('onlyGc', true)
        db.setting('onlyPc', false)
        m.react('✅')
        return m.reply(`✅ *ᴏɴʟʏ ɢʀᴏᴜᴘ ᴍᴏᴅᴇ ᴀᴋᴛɪꜰ*\n\n> Bot hanya bisa diakses di grup!`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
