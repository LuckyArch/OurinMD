const axios = require('axios')
const chatgot = require('../tools/chatgot')

const pluginConfig = {
    name: 'gpt4o',
    alias: ['gpt4'],
    category: 'ai',
    description: 'Chat dengan GPT-4o',
    usage: '.gpt4o <pertanyaan>',
    example: '.gpt4o Hai apa kabar?',
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
        return m.reply(`🧠 *ɢᴘᴛ-4ᴏ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}gpt4o Hai apa kabar?\``)
    }
    
    m.react('🧠')
    
    try {
        const url = await chatgot(text, 'gpt4omini')
        
        m.react('✅')
        await m.reply(`🧠 *ɢᴘᴛ-4ᴏ*\n\n\`\`\`\`${url}\`\`\``)
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
