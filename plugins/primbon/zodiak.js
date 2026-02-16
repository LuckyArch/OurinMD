const axios = require('axios')

const pluginConfig = {
    name: 'zodiak',
    alias: ['horoscope', 'ramalan'],
    category: 'primbon',
    description: 'Ramalan zodiak',
    usage: '.zodiak <nama zodiak>',
    example: '.zodiak aries',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const validZodiacs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagitarius', 'capricorn', 'aquarius', 'pisces']

async function handler(m, { sock }) {
    const zodiac = m.args[0]?.toLowerCase()
    
    if (!zodiac || !validZodiacs.includes(zodiac)) {
        return m.reply(`⭐ *ᴢᴏᴅɪᴀᴋ*\n\n> Masukkan nama zodiak:\n\n${validZodiacs.map(z => `• ${z}`).join('\n')}\n\n\`Contoh: ${m.prefix}zodiak aries\``)
    }
    
    m.react('⭐')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/zodiak?zodiak=${zodiac}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mendapatkan ramalan`)
        }
        
        const r = data.data
        const response = `⭐ *ᴢᴏᴅɪᴀᴋ ${zodiac.toUpperCase()}*\n\n` +
            `${r.zodiak}\n\n` +
            `🔢 *ɴᴏᴍᴏʀ:* ${r.nomor_keberuntungan}\n` +
            `🌸 *ʙᴜɴɢᴀ:* ${r.bunga_keberuntungan}\n` +
            `🎨 *ᴡᴀʀɴᴀ:* ${r.warna_keberuntungan}\n` +
            `💎 *ʙᴀᴛᴜ:* ${r.batu_keberuntungan}\n` +
            `🔥 *ᴇʟᴇᴍᴇɴ:* ${r.elemen_keberuntungan}\n` +
            `🪐 *ᴘʟᴀɴᴇᴛ:* ${r.planet_yang_mengitari}\n` +
            `💕 *ᴘᴀsᴀɴɢᴀɴ:* ${r.pasangan_zodiak}`
        
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
