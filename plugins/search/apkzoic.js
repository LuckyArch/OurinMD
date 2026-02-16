const axios = require('axios')

const pluginConfig = {
    name: 'apkzoic',
    alias: ['apkz'],
    category: 'search',
    description: 'Cari APK MOD di ApkZoic',
    usage: '.apkzoic <query>',
    example: '.apkzoic Subway Surfer',
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
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}apkzoic <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}apkzoic Subway Surfer\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/apkzoic/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const apps = res.data.result.slice(0, 5)
        
        let txt = `📱 *ᴀᴘᴋᴢᴏɪᴄ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`
        
        apps.forEach((a, i) => {
            txt += `*${i + 1}.* \`\`\`${a.title}\`\`\`\n`
            txt += `   ├ 🏷️ \`${a.categories?.join(', ') || '-'}\`\n`
            txt += `   └ 🔗 \`${a.link}\`\n\n`
        })
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
