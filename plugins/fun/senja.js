const axios = require('axios')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'senja',
    alias: ['katacinta', 'romanticquotes'],
    category: 'fun',
    description: 'Random kata-kata senja/romantis',
    usage: '.senja',
    example: '.senja',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🌅')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/senja?apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.data?.text) {
            m.react('❌')
            return m.reply(`❌ Gagal mengambil kata senja`)
        }
        
        const text = `🌅 *ᴋᴀᴛᴀ sᴇɴᴊᴀ*\n\n` +
            `"${res.data.data.text}"\n\n` +
            `_Ketik \`${m.prefix}senja\` untuk kata lainnya_`
        
        await m.reply(text)
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
