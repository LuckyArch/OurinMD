const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'wattpad',
    alias: ['wattpadsearch', 'wattpadcari'],
    category: 'search',
    description: 'Cari cerita di Wattpad',
    usage: '.wattpad <query>',
    example: '.wattpad cinta',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `📖 *ᴡᴀᴛᴛᴘᴀᴅ sᴇᴀʀᴄʜ*\n\n` +
            `> Masukkan judul atau kata kunci\n\n` +
            `> Contoh: \`${m.prefix}wattpad cinta\``
        )
    }
    
    m.react('📖')
    
    try {
        const apiKey = config.APIkey?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Key tidak ditemukan di config')
        }
        
        const res = await axios.get(`https://api.lolhuman.xyz/api/wattpadsearch?apikey=${apiKey}&query=${encodeURIComponent(query)}`, {
            timeout: 30000
        })
        
        if (res.data?.status !== 200 || !res.data?.result?.length) {
            throw new Error('Cerita tidak ditemukan')
        }
        
        const stories = res.data.result.slice(0, 5)
        
        let txt = `📖 *ᴡᴀᴛᴛᴘᴀᴅ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        stories.forEach((story, i) => {
            txt += `╭─「 📚 *${i + 1}. ${story.title}* 」\n`
            txt += `┃ 👤 Author: *${story.author?.name || '-'}*\n`
            txt += `┃ 📄 Parts: *${story.parts || 0}*\n`
            txt += `┃ 👁️ Reads: *${formatNumber(story.readCount)}*\n`
            txt += `┃ ⭐ Votes: *${formatNumber(story.voteCount)}*\n`
            txt += `┃ 💬 Comments: *${formatNumber(story.commentCount)}*\n`
            
            if (story.description) {
                const desc = story.description.length > 100 
                    ? story.description.substring(0, 100) + '...' 
                    : story.description
                txt += `┃\n┃ 📝 ${desc}\n`
            }
            
            txt += `┃\n┃ 🔗 ${story.url}\n`
            txt += `╰━━━━━━━━━━━━━━\n\n`
        })
        
        await m.reply(txt.trim())
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
