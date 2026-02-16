/**
 * Putus - End relationship
 */

const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'putus',
    alias: ['breakup', 'cerai'],
    category: 'fun',
    description: 'Memutuskan hubungan dengan pasangan',
    usage: '.putus',
    example: '.putus',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let senderData = db.getUser(m.sender) || {}
    
    if (!senderData.fun) senderData.fun = {}
    
    if (!senderData.fun.pasangan) {
        await m.react('❌')
        return m.reply(
            `❌ *Kamu tidak punya pasangan!*\n\n` +
            `> Cari dulu dengan \`.tembak @tag\``
        )
    }
    
    const exPartner = senderData.fun.pasangan
    let exData = db.getUser(exPartner) || {}
    
    // Clear relationship on both sides
    delete senderData.fun.pasangan
    if (exData.fun?.pasangan === m.sender) {
        delete exData.fun.pasangan
        db.setUser(exPartner, exData)
    }
    
    db.setUser(m.sender, senderData)
    
    await m.react('💔')
    await m.reply(
        `💔 *PUTUS!*\n\n` +
        `@${m.sender.split('@')[0]} & @${exPartner.split('@')[0]} resmi putus.\n\n` +
        `> Semoga mendapat yang lebih baik! 🙏`,
        { mentions: [m.sender, exPartner] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
