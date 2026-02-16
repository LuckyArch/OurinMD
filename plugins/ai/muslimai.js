const axios = require('axios')

const pluginConfig = {
    name: 'muslimai',
    alias: ['islamai', 'quranai'],
    category: 'ai',
    description: 'AI untuk bertanya tentang Islam dan Al-Quran',
    usage: '.muslimai <pertanyaan>',
    example: '.muslimai Apa itu sholat?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`☪️ *ᴍᴜsʟɪᴍ ᴀɪ*\n\n> Masukkan pertanyaan tentang Islam\n\n\`Contoh: ${m.prefix}muslimai Apa itu sholat?\``)
    }
    
    m.react('☪️')
    
    try {
        const url = `https://api.nexray.web.id/ai/muslim?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        const answer = data.result
        let response = `☪️ *ᴍᴜsʟɪᴍ ᴀɪ*\n\n\`\`\`${answer}\`\`\``
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
