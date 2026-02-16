const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'filmget',
    alias: ['getfilm', 'filmdetail', 'filminfo'],
    category: 'search',
    description: 'Ambil detail film',
    usage: '.filmget <url>',
    example: '.filmget https://tv.neoxr.eu/film/civil-war-2024',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

let thumbFilm = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-film.jpg')
    if (fs.existsSync(p)) thumbFilm = fs.readFileSync(p)
} catch {}

async function handler(m, { sock }) {
    const args = m.args || []
    const url = args[0]?.trim()
    
    if (!url || !url.includes('neoxr.eu')) {
        return m.reply(
            `🎬 *ꜰɪʟᴍ ᴅᴇᴛᴀɪʟ*\n\n` +
            `> Ambil detail film dari URL\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}filmget <url>\`\n\n` +
            `> Gunakan \`${m.prefix}film <judul>\` untuk cari film dulu`
        )
    }
    
    m.react('🎬')
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/film-get?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`
        const { data } = await axios.get(apiUrl, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> Film tidak ditemukan')
        }
        
        const film = data.data
        const streams = data.stream || []
        const downloads = data.download || []
        
        let thumbBuffer = null
        if (film.thumbnail) {
            try {
                const thumbRes = await axios.get(film.thumbnail, { responseType: 'arraybuffer', timeout: 10000 })
                thumbBuffer = Buffer.from(thumbRes.data)
            } catch {}
        }
        
        let text = `🎬 *${film.title || 'Film'}*\n\n`
        text += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
        text += `┃ ⭐ Rating: ${film.rating || '-'}\n`
        text += `┃ 📺 Quality: ${film.quality || '-'}\n`
        text += `┃ ⏱️ Duration: ${film.duration || '-'}\n`
        text += `┃ 📅 Release: ${film.release || '-'}\n`
        text += `┃ 🎭 Genre: ${film.tags || '-'}\n`
        text += `┃ 🎬 Director: ${film.director || '-'}\n`
        text += `┃ 👥 Actors: ${film.actors || '-'}\n`
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        text += `📝 *Synopsis:*\n`
        text += `> ${film.synopsis || '-'}\n\n`
        
        if (streams.length > 0) {
            text += `▶️ *Streaming:*\n`
            streams.forEach((s, i) => {
                text += `> ${i + 1}. ${s.server}\n`
            })
            text += `\n`
        }
        
        if (downloads.length > 0) {
            text += `📥 *Download:*\n`
            downloads.forEach((d, i) => {
                text += `> ${i + 1}. ${d.provider}\n`
            })
        }
        
        const buttons = []
        
        if (streams.length > 0) {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: `▶️ ${streams[0].server}`,
                    url: streams[0].url
                })
            })
        }
        
        downloads.slice(0, 2).forEach(d => {
            buttons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: `📥 ${d.provider}`,
                    url: d.url
                })
            })
        })
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const msgContent = {
            text,
            footer: `🎬 Nonton Film Online`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }
        
        if (thumbBuffer) {
            msgContent.contextInfo.externalAdReply = {
                title: film.title || 'Film',
                body: `⭐ ${film.rating} | ${film.quality}`,
                thumbnail: thumbBuffer,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: url
            }
        }
        
        if (buttons.length > 0) {
            msgContent.interactiveButtons = buttons
        }
        
        await sock.sendMessage(m.chat, msgContent, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
