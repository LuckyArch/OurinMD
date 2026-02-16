const axios = require('axios')

const pluginConfig = {
    name: 'apkcombo',
    alias: ['apk', 'apksearch'],
    category: 'search',
    description: 'Cari APK di ApkCombo',
    usage: '.apkcombo <query>',
    example: '.apkcombo WhatsApp',
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
            `> \`${m.prefix}apkcombo <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}apkcombo WhatsApp\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/apkcombo/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        const apps = res.data.result.slice(0, 5)
        
        let txt = `📦 *ᴀᴘᴋᴄᴏᴍʙᴏ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`
        
        apps.forEach((a, i) => {
            txt += `*${i + 1}.* \`\`\`${a.name}\`\`\`\n`
            txt += `   ├ 👤 \`${a.author}\`\n`
            txt += `   ├ ⭐ \`${a.rating}/5\`\n`
            txt += `   ├ 📥 \`${a.downloaded}\`\n`
            txt += `   ├ 📦 \`${a.size}\`\n`
            txt += `   └ 🔗 \`${a.url}\`\n\n`
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
