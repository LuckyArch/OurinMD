const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'maling',
    alias: ['copet', 'pickpocket'],
    category: 'rpg',
    description: 'Mencopet orang (lebih berisiko dari crime)',
    usage: '.maling',
    example: '.maling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 180,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    user.rpg.health = user.rpg.health || 100
    
    if (user.rpg.health < 40) {
        return m.reply(
            `❌ *ʜᴇᴀʟᴛʜ ᴛᴇʀʟᴀʟᴜ ʀᴇɴᴅᴀʜ*\n\n` +
            `> Minimal 40 HP untuk maling!\n` +
            `> Health kamu: ${user.rpg.health} HP`
        )
    }
    
    await sock.sendMessage(m.chat, { text: '🦹 *sᴇᴅᴀɴɢ ᴍᴇɴᴄᴏᴘᴇᴛ...*', contextInfo: getRpgContextInfo('🦹 MALING', 'Picking!') }, { quoted: m })
    await new Promise(r => setTimeout(r, 2500))
    
    const outcomes = [
        { success: true, type: 'big', money: 20000, exp: 500, msg: 'Berhasil copet dompet sultan!' },
        { success: true, type: 'medium', money: 8000, exp: 200, msg: 'Dapat dompet tipis...' },
        { success: true, type: 'small', money: 2000, exp: 50, msg: 'Cuma dapat receh.' },
        { success: false, type: 'caught', fine: 15000, health: 30, msg: 'Ketangkap dan dipukuli massa!' },
        { success: false, type: 'police', fine: 25000, health: 10, msg: 'Ditangkap polisi!' },
        { success: false, type: 'fail', fine: 0, health: 0, msg: 'Target kabur, gagal total.' }
    ]
    
    const weights = [5, 20, 30, 15, 10, 20]
    const rand = Math.random() * 100
    let cumulative = 0
    let outcome = outcomes[5]
    
    for (let i = 0; i < outcomes.length; i++) {
        cumulative += weights[i]
        if (rand <= cumulative) {
            outcome = outcomes[i]
            break
        }
    }
    
    let txt = ''
    
    if (outcome.success) {
        user.koin = (user.koin || 0) + outcome.money
        await addExpWithLevelCheck(sock, m, db, user, outcome.exp)
        
        txt = `✅ *ᴍᴀʟɪɴɢ sᴜᴋsᴇs*\n\n`
        txt += `> ${outcome.msg}\n`
        txt += `> 💰 Dapat: *+Rp ${outcome.money.toLocaleString('id-ID')}*\n`
        txt += `> 🚄 Exp: *+${outcome.exp}*`
    } else {
        const actualFine = Math.min(outcome.fine, user.koin || 0)
        user.koin = Math.max(0, (user.koin || 0) - actualFine)
        user.rpg.health = Math.max(0, user.rpg.health - outcome.health)
        
        txt = `❌ *ᴍᴀʟɪɴɢ ɢᴀɢᴀʟ*\n\n`
        txt += `> ${outcome.msg}\n`
        if (outcome.fine > 0) txt += `> 💸 Denda: *-Rp ${actualFine.toLocaleString('id-ID')}*\n`
        if (outcome.health > 0) txt += `> ❤️ Health: *-${outcome.health}*`
        
        if (user.rpg.health <= 0) {
            user.rpg.health = 0
            user.rpg.exp = Math.floor((user.rpg.exp || 0) / 2)
            txt += `\n\n💀 *ᴋᴀᴍᴜ ᴍᴀᴛɪ*\n> Exp berkurang 50%!`
        }
    }
    
    db.save()
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('🦹 MALING', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
