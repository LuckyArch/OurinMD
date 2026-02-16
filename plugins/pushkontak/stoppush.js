const { getDatabase } = require('../../src/lib/database')
const { getGroupMode } = require('../group/botmode')

const pluginConfig = {
    name: 'stoppush',
    alias: ['stoppushkontak', 'stoppus'],
    category: 'pushkontak',
    description: 'Hentikan proses pushkontak',
    usage: '.stoppush',
    example: '.stoppush',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!global.statuspush) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada pushkontak yang sedang berjalan`)
    }
    
    global.stoppush = true
    
    m.react('⏹️')
    await m.reply(`⏹️ *sᴛᴏᴘ ᴘᴜsʜ*\n\n> Menghentikan proses pushkontak...`)
}

module.exports = {
    config: pluginConfig,
    handler
}
