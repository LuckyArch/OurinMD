const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'carimusik',
    alias: ['searchmusic', 'scsearch', 'soundcloud', 'findsong'],
    category: 'search',
    description: 'Cari dan download lagu dari SoundCloud',
    usage: '.carimusik <judul>',
    example: '.carimusik komang',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const musicSessions = new Map()

let thumbMusic = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-music.jpg')
    if (fs.existsSync(p)) thumbMusic = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body, thumbnail) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    const thumb = thumbnail || thumbMusic
    if (thumb) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumb,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

async function handler(m, { sock }) {
    const args = m.args || []
    const query = args.join(' ').trim()
    
    if (!query) {
        return m.reply(
            `🎵 *ᴄᴀʀɪ ᴍᴜsɪᴋ*\n\n` +
            `> Cari dan download lagu dari SoundCloud\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}carimusik <judul>\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}carimusik komang\``
        )
    }
    
    m.react('🎵')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/song?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Lagu "${query}" tidak ditemukan`)
        }
        
        const songs = data.data.slice(0, 10)
        
        musicSessions.set(m.sender, {
            songs,
            query,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            musicSessions.delete(m.sender)
        }, 300000)
        
        let text = `🎵 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ*\n\n`
        text += `> Ditemukan *${songs.length}* lagu untuk "${query}"\n\n`
        
        songs.forEach((s, i) => {
            const duration = formatDuration(s.duration || 0)
            const plays = formatNumber(s.playback_count || 0)
            const likes = formatNumber(s.likes_count || 0)
            text += `*${i + 1}. ${s.title}*\n`
            text += `> ⏱️ ${duration} | ▶️ ${plays} | ❤️ ${likes}\n`
            text += `> 👤 ${s.user?.username || '-'}\n\n`
        })
        
        text += `> _Pilih lagu dari list di bawah_`
        
        const listItems = songs.map((s, i) => ({
            header: '',
            title: s.title?.substring(0, 24) || `Song ${i + 1}`,
            description: `${formatDuration(s.duration || 0)} | ${s.user?.username || '-'}`,
            id: `${m.prefix}getmusik ${i + 1}`
        }))
        
        await sock.sendMessage(m.chat, {
            text,
            footer: '🎵 SoundCloud Search',
            contextInfo: getContextInfo('🎵 CARI MUSIK', `${songs.length} hasil`),
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '🎵 Pilih Lagu',
                        sections: [
                            {
                                title: 'Hasil Pencarian',
                                rows: listItems
                            }
                        ]
                    })
                }
            ]
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    musicSessions
}
