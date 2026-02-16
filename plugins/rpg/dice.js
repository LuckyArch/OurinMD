const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'dice',
    alias: ['dadu', 'roll'],
    category: 'rpg',
    description: 'Lempar dadu untuk gambling',
    usage: '.dice <1-6> <bet>',
    example: '.dice 6 5000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    const args = m.args || []
    const guess = parseInt(args[0])
    const bet = parseInt(args[1])
    
    if (!guess || guess < 1 || guess > 6) {
        return m.reply(
            `🎲 *ᴅɪᴄᴇ ɢᴀᴍᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Tebak angka 1-6!\n` +
            `┃ > \`.dice 6 5000\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (!bet || bet < 1000) {
        return m.reply(
            `❌ *ɪɴᴠᴀʟɪᴅ ʙᴇᴛ*\n\n` +
            `> Minimal bet Rp 1.000!`
        )
    }
    
    if ((user.koin || 0) < bet) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Koin kamu: Rp ${(user.koin || 0).toLocaleString('id-ID')}\n` +
            `> Butuh: Rp ${bet.toLocaleString('id-ID')}`
        )
    }
    
    user.koin -= bet
    
    await sock.sendMessage(m.chat, { text: `🎲 *ᴍᴇʟᴇᴍᴘᴀʀ ᴅᴀᴅᴜ...*`, contextInfo: getRpgContextInfo('🎲 DICE', 'Rolling!') }, { quoted: m })
    await new Promise(r => setTimeout(r, 1500))
    
    const result = Math.floor(Math.random() * 6) + 1
    const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][result - 1]
    
    const isWin = guess === result
    
    let txt = `🎲 *ᴅɪᴄᴇ ɢᴀᴍᴇ*\n\n`
    txt += `> ${diceEmoji} Hasil: *${result}*\n`
    txt += `> 🎯 Tebakan: *${guess}*\n\n`
    
    if (isWin) {
        const winnings = bet * 5
        user.koin = (user.koin || 0) + winnings
        txt += `✅ *ᴋᴀᴍᴜ ᴍᴇɴᴀɴɢ!*\n`
        txt += `> 💰 Win: *+Rp ${winnings.toLocaleString('id-ID')}* (5x)`
    } else {
        txt += `❌ *ᴋᴀᴍᴜ ᴋᴀʟᴀʜ!*\n`
        txt += `> 💸 Lost: *-Rp ${bet.toLocaleString('id-ID')}*`
    }
    
    db.save()
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('🎲 DICE', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
