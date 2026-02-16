const axios = require('axios')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'carianime',
    alias: ['searchanime', 'animesearch'],
    category: 'search',
    description: 'Cari anime dan download batch',
    usage: '.carianime <judul>',
    example: '.carianime jujutsu kaisen',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (query?.startsWith('--get ')) {
        const animeUrl = query.replace('--get ', '').trim()
        return await getAnimeDetail(m, sock, animeUrl)
    }
    
    if (!query) {
        return m.reply(
            `🎬 *ᴄᴀʀɪ ᴀɴɪᴍᴇ*\n\n` +
            `> Masukkan judul anime\n\n` +
            `> Contoh: \`${m.prefix}carianime jujutsu kaisen\``
        )
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/anime?q=${encodeURIComponent(query)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan anime dengan judul: ${query}`)
        }
        
        const animeList = res.data.data.slice(0, 10)
        
        const rows = animeList.map((anime, i) => ({
            title: anime.title,
            description: `⭐ Score: ${anime.score || 'N/A'} | 📺 ${anime.type || 'Unknown'}`,
            id: `${m.prefix}carianime --get ${anime.url}`
        }))
        
        const imagePath = path.join(process.cwd(), 'assets', 'images', 'ourin-v8.jpg')
        let imageBuffer = null
        if (fs.existsSync(imagePath)) {
            imageBuffer = fs.readFileSync(imagePath)
        }
        
        const caption = `🎬 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ ᴀɴɪᴍᴇ*\n\n` +
            `> 🔍 Query: *${query}*\n` +
            `> 📊 Ditemukan: *${animeList.length}* anime\n\n` +
            `> Pilih anime dari list di bawah:`
        
        await sock.interactiveButtons(m.chat, {
            image: imageBuffer,
            caption: caption,
            footer: `${config.bot?.name || 'Ourin-AI'} • Anime Search`,
            buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📺 Pilih Anime',
                    sections: [{
                        title: 'Hasil Pencarian',
                        highlight_label: '🔥 Anime',
                        rows: rows
                    }]
                })
            }]
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

async function getAnimeDetail(m, sock, animeUrl) {
    m.react('⏳')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/anime-get?url=${encodeURIComponent(animeUrl)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil detail anime.`)
        }
        
        const anime = res.data.data
        const episodes = anime.episode || []
        
        let caption = `🎬 *${anime.title}*\n\n`
        caption += `> 📺 Status: ${anime.status || 'Unknown'}\n`
        caption += `> 🎭 Type: ${anime.type || 'Unknown'}\n`
        caption += `> 🏢 Studio: ${anime.studio || 'Unknown'}\n`
        caption += `> ⏱️ Durasi: ${anime.duration || 'Unknown'}\n`
        caption += `> 🎭 Genre: ${anime.genre || 'Unknown'}\n`
        caption += `> ⭐ Score: ${anime.score || 'N/A'}\n`
        caption += `> 👁️ Views: ${anime.views || '0'}\n\n`
        caption += `📝 *Sinopsis:*\n${(anime.description || 'Tidak ada sinopsis').substring(0, 500)}...\n\n`
        caption += `📺 *Episode Tersedia:* ${episodes.length} episode`
        
        if (episodes.length > 0) {
            const rows = episodes.slice(0, 20).map((ep, i) => {
                const qualities = ep.link?.map(l => l.quality).filter(Boolean).join(', ') || 'Unknown'
                return {
                    title: ep.episode || `Episode ${i + 1}`,
                    description: `🎬 Quality: ${qualities}`,
                    id: `${m.prefix}animelink ${JSON.stringify({ episode: ep.episode, links: ep.link })}`
                }
            })
            
            await sock.interactiveButtons(m.chat, {
                image: { url: anime.thumbnail },
                caption: caption,
                footer: `${config.bot?.name || 'Ourin-AI'} • Anime Detail`,
                buttons: [{
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '📺 Pilih Episode',
                        sections: [{
                            title: 'Episode List',
                            highlight_label: '🎬 Episode',
                            rows: rows
                        }]
                    })
                }]
            }, { quoted: m })
        } else {
            await sock.sendMessage(m.chat, {
                image: { url: anime.thumbnail },
                caption: caption
            }, { quoted: m })
        }
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
