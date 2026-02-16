const axios = require('axios')

const pluginConfig = {
    name: 'gpt41',
    alias: ['gpt4.1'],
    category: 'ai',
    description: 'Chat dengan GPT-4.1',
    usage: '.gpt41 <pertanyaan>',
    example: '.gpt41 Hai apa kabar?',
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
        return m.reply(`🧠 *ɢᴘᴛ-4.1*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gpt41 Hai apa kabar?\``)
    }
    
    m.react('🧠')
    
    try {
        const url = await chatgot(text, 'gpt41mini')
        
        m.react('✅')
        await m.reply(`🧠 *ɢᴘᴛ-4.1*\n\n\`\`\`\`${url}\`\`\``)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
