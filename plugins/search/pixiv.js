const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'pixiv',
    alias: ['pixivsearch', 'caripixiv'],
    category: 'search',
    description: 'Cari artwork di Pixiv',
    usage: '.pixiv <query>',
    example: '.pixiv rem',
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
            return m.reply(`❌ *Masukkan kata kunci pencarian!*\n\n> Contoh: .pixiv rem`)
        }
        
        await m.react('🔍')
        
        const apikey = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'
        const url = `https://api.neoxr.eu/api/pixiv-search?q=${encodeURIComponent(query)}&apikey=${apikey}`
        
        const response = await axios.get(url, { timeout: 30000 })
        const data = response.data
        
        if (!data.status || !data.data || data.data.length === 0) {
            await m.react('❌')
            return m.reply(`❌ *Tidak ditemukan hasil untuk:* ${query}`)
        }
        
        const results = data.data.slice(0, 10)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        let caption = `🎨 *ᴘɪxɪᴠ sᴇᴀʀᴄʜ*\n`
        caption += `📝 *ᴋᴜᴇʀʏ:* ${query}\n`
        caption += `📊 *ʜᴀsɪʟ:* ${results.length} artwork\n\n`
        
        results.forEach((art, i) => {
            const aiLabel = art.aiType === 2 ? ' 🤖' : ''
            const isNsfw = art.xRestrict > 0 ? ' 🔞' : ''
            caption += `*${i + 1}.* ${art.title}${aiLabel}${isNsfw}\n`
            caption += `   👤 ${art.userName}\n`
            caption += `   📐 ${art.width}x${art.height} • 📄 ${art.pageCount} page\n`
            caption += `   🔗 ${art.url}\n\n`
        })
        
        caption += `> 🎨 Powered by Pixiv`
        
        const buttons = results.slice(0, 5).map((art, i) => ({
            title: `${art.title.slice(0, 20)}${art.title.length > 20 ? '...' : ''}`,
            description: `by ${art.userName}`,
            id: `.pixivget ${art.url}`
        }))
        
        await m.react('🎨')
        
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
