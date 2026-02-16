const axios = require('axios')

const pluginConfig = {
    name: 'dola',
    alias: ['cici', 'ciciai'],
    category: 'ai',
    description: 'Chat dengan Cici AI (Dola)',
    usage: '.dola <pertanyaan>',
    example: '.dola Hai apa kabar?',
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
        return m.reply(`🎀 *ᴅᴏʟᴀ ᴀɪ*\n\n> Masukkan pertanyaan\n\n\`Contoh: ${m.prefix}dola Hai apa kabar?\``)
    }
    
    m.react('🎀')
    
    try {
        const url = `https://api.nexray.web.id/ai/cici?text=${encodeURIComponent(text)}`
        const { data } = await axios.get(url, { timeout: 60000 })
        const chat = data.result
        if(data.result == "") return m.reply('```Cici lagi gak bisa jawab pertanyaan itu, coba ganti pertanyaan lagi```')
        m.react('✅')
        await m.reply(`🎀\`\`\`${chat}\`\`\``)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
