const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'manga',
    alias: ['mangasearch', 'carimanga', 'searchmanga'],
    category: 'search',
    description: 'Cari informasi manga dari AniList',
    usage: '.manga <judul>',
    example: '.manga one piece',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const query = m.args?.join(' ')?.trim()
        
        if (!query) {
            return m.reply(`❌ *Masukkan judul manga!*\n\n> Contoh: .manga one piece`)
        }
        
        await m.react('📚')
        
        const apikey = config.APIkey?.lolhuman || 'APIKey-Milik-Bot-OurinMD(Zann,HyuuSATANN,Keisya,Danzz)'
        const url = `https://api.lolhuman.xyz/api/manga?apikey=${apikey}&query=${encodeURIComponent(query)}`
        
        const response = await axios.get(url, { timeout: 30000 })
        const data = response.data
        
        if (data.status !== 200 || !data.result) {
            await m.react('❌')
            return m.reply(`❌ *Manga tidak ditemukan:* ${query}`)
        }
        
        const manga = data.result
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const title = manga.title?.romaji || manga.title?.english || manga.title?.native || 'Unknown'
        const titleEn = manga.title?.english || '-'
        const titleJp = manga.title?.native || '-'
        
        const startDate = manga.startDate 
            ? `${manga.startDate.day || '??'}/${manga.startDate.month || '??'}/${manga.startDate.year || '????'}`
            : '-'
        const endDate = manga.endDate 
            ? `${manga.endDate.day || '??'}/${manga.endDate.month || '??'}/${manga.endDate.year || '????'}`
            : '-'
        
        let description = manga.description || ''
        description = description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim()
        if (description.length > 500) {
            description = description.substring(0, 500) + '...'
        }
        
        const genres = manga.genres?.join(', ') || '-'
        const characters = manga.characters?.nodes?.slice(0, 8).map(c => c.name?.full).join(', ') || '-'
        
        let caption = `📚 *ᴍᴀɴɢᴀ ɪɴꜰᴏ*\n\n`
        caption += `📖 *ᴛɪᴛʟᴇ:* ${title}\n`
        caption += `🇬🇧 *ᴇɴɢʟɪsʜ:* ${titleEn}\n`
        caption += `🇯🇵 *ɴᴀᴛɪᴠᴇ:* ${titleJp}\n\n`
        caption += `📊 *sᴛᴀᴛᴜs:* ${manga.status || '-'}\n`
        caption += `📕 *ꜰᴏʀᴍᴀᴛ:* ${manga.format || '-'}\n`
        caption += `📄 *ᴄʜᴀᴘᴛᴇʀs:* ${manga.chapters || '-'}\n`
        caption += `📚 *ᴠᴏʟᴜᴍᴇs:* ${manga.volumes || '-'}\n`
        caption += `⭐ *sᴄᴏʀᴇ:* ${manga.averageScore || '-'}/100\n\n`
        caption += `📅 *sᴛᴀʀᴛ:* ${startDate}\n`
        caption += `📅 *ᴇɴᴅ:* ${endDate}\n`
        caption += `🎭 *ɢᴇɴʀᴇs:* ${genres}\n\n`
        caption += `👥 *ᴄʜᴀʀᴀᴄᴛᴇʀs:*\n${characters}\n\n`
        caption += `📝 *sʏɴᴏᴘsɪs:*\n${description}\n\n`
        caption += `> 📚 Source: AniList`
        
        await m.react('📖')
        
        const coverImage = manga.coverImage?.large || manga.coverImage?.medium
        
        if (coverImage) {
            await sock.sendMessage(m.chat, {
                image: { url: coverImage },
                caption,
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
        } else {
            await sock.sendMessage(m.chat, {
                text: caption,
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
        }
        
    } catch (error) {
        await m.react('❌')
        if (error.response?.status === 403) {
            return m.reply(`❌ *API Key tidak valid atau limit tercapai*`)
        }
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
