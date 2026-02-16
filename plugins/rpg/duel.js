const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'duel',
    alias: ['pvp', 'fight'],
    category: 'rpg',
    description: 'Duel PvP dengan player lain',
    usage: '.duel @user <bet>',
    example: '.duel @user 5000',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 120,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    const bet = parseInt(args[1]) || 1000
    
    if (!target) {
        return m.reply(
            `⚔️ *ᴅᴜᴇʟ ᴘᴠᴘ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Tag lawan duel!\n` +
            `┃ > \`.duel @user 5000\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (target === m.sender) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Tidak bisa duel diri sendiri!`)
    }
    
    if (bet < 1000) {
        return m.reply(`❌ *ɪɴᴠᴀʟɪᴅ ʙᴇᴛ*\n\n> Minimal bet Rp 1.000!`)
    }
    
    const player1 = db.getUser(m.sender)
    const player2 = db.getUser(target) || db.setUser(target)
    
    if ((player1.koin || 0) < bet) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Koin kamu: Rp ${(player1.koin || 0).toLocaleString('id-ID')}\n` +
            `> Butuh: Rp ${bet.toLocaleString('id-ID')}`
        )
    }
    
    if ((player2.koin || 0) < bet) {
        return m.reply(
            `❌ *ʟᴀᴡᴀɴ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Balance lawan tidak cukup untuk bet!`
        )
    }
    
    if (!player1.rpg) player1.rpg = {}
    if (!player2.rpg) player2.rpg = {}
    
    player1.rpg.health = player1.rpg.health || 100
    player2.rpg.health = player2.rpg.health || 100
    
    if (player1.rpg.health < 30) {
        return m.reply(
            `❌ *ʜᴇᴀʟᴛʜ ᴛᴇʀʟᴀʟᴜ ʀᴇɴᴅᴀʜ*\n\n` +
            `> Minimal 30 HP untuk duel!\n` +
            `> Health kamu: ${player1.rpg.health} HP`
        )
    }
    
    await sock.sendMessage(m.chat, { text: `⚔️ *ᴅᴜᴇʟ ᴅɪᴍᴜʟᴀɪ*\n\n> @${m.sender.split('@')[0]} vs @${target.split('@')[0]}\n> 💰 Bet: Rp ${bet.toLocaleString('id-ID')}`, contextInfo: getRpgContextInfo('⚔️ DUEL', 'Fight!') }, { quoted: m })
    
    await new Promise(r => setTimeout(r, 2000))
    
    const p1Power = (player1.rpg.level || 1) * 10 + Math.random() * 50
    const p2Power = (player2.rpg.level || 1) * 10 + Math.random() * 50
    
    const winner = p1Power > p2Power ? m.sender : target
    const loser = winner === m.sender ? target : m.sender
    const winnerData = winner === m.sender ? player1 : player2
    const loserData = winner === m.sender ? player2 : player1
    
    winnerData.koin = (winnerData.koin || 0) + bet
    loserData.koin = (loserData.koin || 0) - bet
    loserData.rpg.health = Math.max(0, (loserData.rpg.health || 100) - 20)
    
    const expGain = 500
    await addExpWithLevelCheck(sock, { ...m, sender: winner }, db, winnerData, expGain)
    
    db.save()
    
    let txt = `⚔️ *ʜᴀsɪʟ ᴅᴜᴇʟ*\n\n`
    txt += `🏆 Pemenang: @${winner.split('@')[0]}\n`
    txt += `💀 Kalah: @${loser.split('@')[0]}\n\n`
    txt += `> 💰 Hadiah: Rp ${bet.toLocaleString('id-ID')}\n`
    txt += `> 🚄 Exp: +${expGain} (winner)`
    
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('⚔️ DUEL', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
