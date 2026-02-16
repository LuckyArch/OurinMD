const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'slot',
    alias: ['slots', 'mesin'],
    category: 'rpg',
    description: 'Main slot machine gambling',
    usage: '.slot <bet>',
    example: '.slot 5000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    const args = m.args || []
    let bet = parseInt(args[0])
    
    if (!bet || bet < 1000) {
        return m.reply(
            `❌ *ɪɴᴠᴀʟɪᴅ ʙᴇᴛ*\n\n` +
            `> Minimal bet Rp 1.000!\n` +
            `> Contoh: \`.slot 5000\``
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
    
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣']
    const weights = [30, 25, 20, 15, 7, 3]
    
    function spin() {
        const rand = Math.random() * 100
        let cumulative = 0
        for (let i = 0; i < symbols.length; i++) {
            cumulative += weights[i]
            if (rand <= cumulative) return symbols[i]
        }
        return symbols[0]
    }
    
    const result = [spin(), spin(), spin()]
    
    await sock.sendMessage(m.chat, { text: `🎰 *sᴘɪɴɴɪɴɢ...*`, contextInfo: getRpgContextInfo('🎰 SLOT', 'Spin!') }, { quoted: m })
    await new Promise(r => setTimeout(r, 1500))
    
    let multiplier = 0
    let winText = ''
    
    if (result[0] === result[1] && result[1] === result[2]) {
        if (result[0] === '7️⃣') {
            multiplier = 10
            winText = '🎉 JACKPOT!!!'
        } else if (result[0] === '💎') {
            multiplier = 5
            winText = '💎 DIAMOND!'
        } else {
            multiplier = 3
            winText = '✨ TRIPLE!'
        }
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        multiplier = 1.5
        winText = '👍 DOUBLE!'
    }
    
    const winnings = Math.floor(bet * multiplier)
    user.koin = (user.koin || 0) + winnings
    
    let txt = `🎰 *sʟᴏᴛ ᴍᴀᴄʜɪɴᴇ*\n\n`
    txt += `╔═══════════╗\n`
    txt += `║ ${result[0]} │ ${result[1]} │ ${result[2]} ║\n`
    txt += `╚═══════════╝\n\n`
    
    if (multiplier > 0) {
        txt += `> ${winText}\n`
        txt += `> 💰 Win: *+Rp ${winnings.toLocaleString('id-ID')}*`
    } else {
        txt += `> 😢 Kalah!\n`
        txt += `> 💸 Lost: *-Rp ${bet.toLocaleString('id-ID')}*`
    }
    
    db.save()
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('🎰 SLOT', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
