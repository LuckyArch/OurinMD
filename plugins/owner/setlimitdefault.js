const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'setlimitdefault',
    alias: ['setdefaultlimit', 'limitdefault'],
    category: 'owner',
    description: 'Set default limit untuk user baru',
    usage: '.setlimitdefault <jumlah>',
    example: '.setlimitdefault 50',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const newLimit = parseInt(args[0])
    
    if (!args[0] || isNaN(newLimit)) {
        const db = getDatabase()
        const currentDefault = db.setting('defaultLimit') || config.limits?.default || 25
        
        return m.reply(
            `📊 *sᴇᴛ ᴅᴇғᴀᴜʟᴛ ʟɪᴍɪᴛ*\n\n` +
            `> Limit default saat ini: \`${currentDefault}\`\n\n` +
            `*Cara pakai:*\n` +
            `> \`${m.prefix}setlimitdefault <jumlah>\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}setlimitdefault 50\``
        )
    }
    
    if (newLimit < 1 || newLimit > 1000) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Limit harus antara 1 - 1000`)
    }
    
    const db = getDatabase()
    db.setting('defaultLimit', newLimit)
    
    await m.reply(
        `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
        `> Default limit diubah menjadi: \`${newLimit}\`\n` +
        `> User baru akan mendapat limit ini`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
