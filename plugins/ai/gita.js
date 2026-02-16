const axios = require('axios')

const pluginConfig = {
    name: 'gita',
    alias: ['gitagpt', 'bhagavadgita'],
    category: 'ai',
    description: 'Chat dengan Gita GPT (Bhagavad Gita AI)',
    usage: '.gita <pertanyaan>',
    example: '.gita What is dharma?',
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
        return m.reply(`📿 *ɢɪᴛᴀ ɢᴘᴛ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gita What is dharma?\``)
    }
    
    m.react('📿')
    
    try {
        const url = `https://api.nexray.web.id/ai/gitagpt?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        
        const content = data.result
        
        m.react('✅')
        await m.reply(`📿 *ɢɪᴛᴀ ɢᴘᴛ*\n\n\`\`\`${content}\`\`\``)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
