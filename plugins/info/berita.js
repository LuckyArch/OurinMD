const axios = require('axios')
const cheerio = require('cheerio')

const pluginConfig = {
    name: ['antara', 'cnn', 'cnbc', 'merdeka', 'sindonews', 'suara', 'berita'],
    alias: [],
    category: 'berita',
    description: 'Mendapatkan berita terkini dari berbagai sumber',
    usage: '.berita <sumber>',
    example: '.kompas atau .berita cnn',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const NEWS_SOURCES = {
    antara: {
        url: 'https://www.antaranews.com/rss/terkini.xml',
        name: 'Antara News',
        emoji: '📰'
    },
    cnn: {
        url: 'https://www.cnnindonesia.com/nasional/rss',
        name: 'CNN Indonesia',
        emoji: '📺'
    },
    cnbc: {
        url: 'https://www.cnbcindonesia.com/rss',
        name: 'CNBC Indonesia',
        emoji: '💹'
    },
    kompas: {
        url: 'https://rss.kompas.com/kompas-cetak',
        name: 'Kompas',
        emoji: '📰'
    },
    merdeka: {
        url: 'https://www.merdeka.com/feed/',
        name: 'Merdeka',
        emoji: '🇮🇩'
    },
    sindonews: {
        url: 'https://international.sindonews.com/rss',
        name: 'Sindo News',
        emoji: '📰'
    },
    suara: {
        url: 'https://www.suara.com/rss',
        name: 'Suara',
        emoji: '📢'
    }
}

async function fetchRSS(url) {
    const response = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
    })
    
    const $ = cheerio.load(response.data, { xmlMode: true })
    const items = []
    
    $('item').each((i, el) => {
        if (i >= 10) return false
        
        const title = $(el).find('title').text().trim()
        const link = $(el).find('link').text().trim()
        const pubDate = $(el).find('pubDate').text().trim()
        const description = $(el).find('description').text().trim()
            .replace(/<[^>]*>/g, '')
            .substring(0, 150)
        
        if (title && link) {
            items.push({ title, link, pubDate, description })
        }
    })
    
    return items
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr)
        return date.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return dateStr
    }
}

async function handler(m) {
    const cmd = m.command.toLowerCase()
    let source = cmd
    
    if (cmd === 'berita') {
        const arg = m.text?.toLowerCase()?.trim()
        if (!arg) {
            let txt = `📰 *ᴅᴀꜰᴛᴀʀ sᴜᴍʙᴇʀ ʙᴇʀɪᴛᴀ*\n\n`
            for (const [key, val] of Object.entries(NEWS_SOURCES)) {
                txt += `> ${val.emoji} \`${m.prefix}${key}\` - ${val.name}\n`
            }
            txt += `\n_Atau gunakan: \`${m.prefix}berita <sumber>\`_`
            return m.reply(txt)
        }
        
        if (!NEWS_SOURCES[arg]) {
            return m.reply(`❌ Sumber berita tidak ditemukan.\n> Gunakan: \`${m.prefix}berita\` untuk melihat daftar.`)
        }
        source = arg
    }
    
    const newsSource = NEWS_SOURCES[source]
    if (!newsSource) {
        return m.reply(`❌ Sumber berita tidak valid.`)
    }
    
    await m.reply(`⏳ *Mengambil berita dari ${newsSource.name}...*`)
    
    try {
        const articles = await fetchRSS(newsSource.url)
        
        if (articles.length === 0) {
            return m.reply(`❌ Tidak ada berita ditemukan.`)
        }
        
        let txt = `${newsSource.emoji} *${newsSource.name.toUpperCase()}*\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        for (let i = 0; i < Math.min(articles.length, 7); i++) {
            const article = articles[i]
            txt += `*${i + 1}. ${article.title}*\n`
            if (article.description) {
                txt += `> ${article.description}...\n`
            }
            txt += `🔗 ${article.link}\n`
            if (article.pubDate) {
                txt += `📅 _${formatDate(article.pubDate)}_\n`
            }
            txt += `\n`
        }
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `_Total: ${articles.length} artikel tersedia_`
        
        await m.reply(txt)
        m.react('📰')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
