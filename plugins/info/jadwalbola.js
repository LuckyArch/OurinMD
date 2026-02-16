const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'jadwalbola',
    alias: ['bola', 'football', 'soccer', 'jadwalsepakbola'],
    category: 'info',
    description: 'Lihat jadwal pertandingan sepak bola',
    usage: '.jadwalbola [liga]',
    example: '.jadwalbola inggris',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const LEAGUE_EMOJI = {
    'liga inggris': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'liga italia': '🇮🇹',
    'liga spanyol': '🇪🇸',
    'la liga spanyol': '🇪🇸',
    'liga jerman': '🇩🇪',
    'liga prancis': '🇫🇷',
    'liga belanda': '🇳🇱',
    'liga champions': '🏆',
    'bri super league': '🇮🇩'
}

function getLeagueEmoji(league) {
    const lower = league.toLowerCase()
    for (const [key, emoji] of Object.entries(LEAGUE_EMOJI)) {
        if (lower.includes(key) || key.includes(lower)) {
            return emoji
        }
    }
    return '⚽'
}

async function handler(m, { sock }) {
    const filter = m.args.join(' ').toLowerCase().trim()
    
    m.react('⚽')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/bola?apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!data?.status || !data?.data || data.data.length === 0) {
            throw new Error('Tidak ada jadwal tersedia')
        }
        
        let matches = data.data
        
        if (filter) {
            matches = matches.filter(m => 
                m.league?.toLowerCase().includes(filter) ||
                m.home_team?.toLowerCase().includes(filter) ||
                m.away_team?.toLowerCase().includes(filter) ||
                m.date?.toLowerCase().includes(filter)
            )
        }
        
        if (matches.length === 0) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan jadwal untuk: \`${filter}\``)
        }
        
        const grouped = {}
        for (const match of matches.slice(0, 50)) {
            const date = match.date || 'TBA'
            if (!grouped[date]) grouped[date] = []
            grouped[date].push(match)
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        let text = `⚽ *ᴊᴀᴅᴡᴀʟ ᴘᴇʀᴛᴀɴᴅɪɴɢᴀɴ*\n\n`
        if (filter) text += `> Filter: \`${filter}\`\n\n`
        
        for (const [date, games] of Object.entries(grouped)) {
            text += `╭┈┈⬡「 📅 *${date}* 」\n`
            
            for (const game of games) {
                const emoji = getLeagueEmoji(game.league)
                text += `┃\n`
                text += `┃ ${emoji} *${game.league}*\n`
                text += `┃ ⏰ ${game.time}\n`
                text += `┃ 🏠 ${game.home_team}\n`
                text += `┃ 🆚 ${game.away_team}\n`
            }
            
            text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        }
        
        text += `> Total: *${matches.length}* pertandingan`
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            text,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
