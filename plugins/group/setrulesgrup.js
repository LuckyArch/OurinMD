const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setrulesgrup',
    alias: ['setgrouprules', 'setaturangrup'],
    category: 'group',
    description: 'Set rules/aturan grup custom (admin only)',
    usage: '.setrulesgrup <text>',
    example: '.setrulesgrup 1. Jangan spam\n2. Hormati sesama',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const text = m.text?.trim() || (m.quoted?.body || m.quoted?.text || '')
    
    if (!text) {
        return m.reply(
            `📝 *sᴇᴛ ɢʀᴜᴘ ʀᴜʟᴇs*\n\n` +
            `> Masukkan teks rules yang baru\n\n` +
            `\`Contoh:\`\n` +
            `\`${m.prefix}setrulesgrup 1. Jangan spam\\n2. Hormati sesama\``
        )
    }
    
    db.setGroup(m.chat, { groupRules: text })
    
    m.reply(
        `✅ *ɢʀᴜᴘ ʀᴜʟᴇs ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
        `> Rules grup berhasil diubah!\n` +
        `> Ketik \`${m.prefix}rulesgrup\` untuk melihat.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
