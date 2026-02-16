const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'wikipedia',
    alias: ['wiki', 'ensiklopedia'],
    category: 'info',
    description: 'Cari informasi di Wikipedia',
    usage: '.wikipedia <query>',
    example: '.wikipedia Indonesia',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `📚 *ᴡɪᴋɪᴘᴇᴅɪᴀ*\n\n` +
            `> Masukkan kata kunci pencarian\n\n` +
            `> Contoh: \`${m.prefix}wikipedia Indonesia\``
        )
    }
    
    m.react('📚')
    
    try {
        const apiKey = config.APIkey?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Key tidak ditemukan di config')
        }
        
        const res = await axios.get(`https://api.lolhuman.xyz/api/wiki2?apikey=${apiKey}&query=${encodeURIComponent(query)}&lang=id`, {
            timeout: 30000
        })
        
        if (res.data?.status !== 200 || !res.data?.result) {
            throw new Error('Artikel tidak ditemukan')
        }
        
        const result = res.data.result
        
        let txt = `📚 *ᴡɪᴋɪᴘᴇᴅɪᴀ*\n\n`
        txt += `╭┈┈⬡「 🔍 *${query.toUpperCase()}* 」\n`
        txt += `┃\n`
        txt += `┃ ${result}\n`
        txt += `┃\n`
        txt += `╰┈┈⬡\n\n`
        txt += `> _Sumber: Wikipedia Indonesia_`
        
        await m.reply(txt)
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
