const axios = require('axios')

const pluginConfig = {
    name: ['carigrup', 'searchgrup', 'grupwa'],
    alias: [],
    category: 'search',
    description: 'Cari grup WhatsApp berdasarkan keyword',
    usage: '.carigrup <keyword>',
    example: '.carigrup coding',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const BASE_URL = 'https://api.denayrestapi.xyz'

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}carigrup <keyword>\`\n\n` +
            `> Contoh: \`${m.prefix}carigrup coding\``
        )
    }
    
    await m.reply(`🔍 *Mencari grup "${query}"...*`)
    
    try {
        const response = await axios.get(`${BASE_URL}/api/v1/search/wagc`, {
            params: { q: query },
            timeout: 30000
        })
        
        const data = response.data
        
        if (data.status !== 200 || !data.result?.length) {
            return m.reply(`❌ Tidak ditemukan grup dengan keyword "${query}"`)
        }
        
        let txt = `🔍 *ʜᴀsɪʟ ᴘᴇɴᴄᴀʀɪᴀɴ ɢʀᴜᴘ*\n`
        txt += `📝 Query: *${query}*\n`
        txt += `📊 Ditemukan: *${data.count || data.result.length}* hasil\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        for (let i = 0; i < Math.min(data.result.length, 5); i++) {
            const item = data.result[i]
            const title = item.title || `Grup ${i + 1}`
            txt += `*${i + 1}. ${title}*\n`
            if (item.date) txt += `📅 ${item.date}\n`
            txt += `🔗 ${item.link}\n\n`
        }
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `_Powered by denayrestapi.xyz_`
        
        if (data.result[0]?.image) {
            await sock.sendMessage(m.chat, {
                image: { url: data.result[0].image },
                caption: txt
            }, { quoted: m })
        } else {
            await m.reply(txt)
        }
        
        m.react('🔍')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
