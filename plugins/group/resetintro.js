const { getDatabase } = require('../../src/lib/database')
const { DEFAULT_INTRO } = require('./intro')

const pluginConfig = {
    name: 'resetintro',
    alias: ['introdel', 'delintro', 'deleteintro'],
    category: 'group',
    description: 'Reset intro grup ke default (admin only)',
    usage: '.resetintro',
    example: '.resetintro',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true
}

async function handler(m) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || db.setGroup(m.chat)
    
    if (!groupData.intro) {
        return m.reply(`❌ Grup ini sudah menggunakan intro default!`)
    }
    
    delete groupData.intro
    db.setGroup(m.chat, groupData)
    db.save()
    
    await m.reply(
        `✅ *ɪɴᴛʀᴏ ᴅɪʀᴇsᴇᴛ!*\n\n` +
        `> Intro grup dikembalikan ke default.\n\n` +
        `> Ketik *.intro* untuk melihat hasilnya.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
