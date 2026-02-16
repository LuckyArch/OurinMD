const axios = require('axios')

const pluginConfig = {
    name: 'emojimix',
    alias: ['mixemoji', 'emix'],
    category: 'fun',
    description: 'Gabungkan 2 emoji menjadi 1',
    usage: '.emojimix <emoji1><emoji2>',
    example: '.emojimix 😂🔥',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🎭 *ᴇᴍᴏᴊɪ ᴍɪx*\n\n` +
            `> Gabungkan 2 emoji menjadi 1\n\n` +
            `> Contoh: \`${m.prefix}emojimix 😂🔥\``
        )
    }
    
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojis = text.match(emojiRegex)
    
    if (!emojis || emojis.length < 2) {
        return m.reply(`❌ Masukkan minimal 2 emoji!\n\nContoh: ${m.prefix}emojimix 😂🔥`)
    }
    
    const emoji1 = emojis[0]
    const emoji2 = emojis[1]
    
    m.react('🎭')
    
    try {
        const apiUrl = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
        
        const { data } = await axios.get(apiUrl, { timeout: 15000 })
        
        if (!data.results || data.results.length === 0) {
            return m.reply(`❌ Kombinasi emoji tidak ditemukan!\n\nCoba emoji lain.`)
        }
        
        const imageUrl = data.results[0].url
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🎭 *ᴇᴍᴏᴊɪ ᴍɪx*\n\n> ${emoji1} + ${emoji2}`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
