const yts = require('yt-search')

const pluginConfig = {
    name: 'yts',
    alias: ['ytsearch', 'youtubesearch'],
    category: 'search',
    description: 'Cari video di YouTube',
    usage: '.yts <query>',
    example: '.yts neffex grateful',
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
            `> \`${m.prefix}yts <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}yts neffex grateful\``
        )
    }
    
    try {
        const search = await yts(query)
        const videos = search.videos.slice(0, 5)
        
        if (videos.length === 0) {
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }
        
        let txt = `🔍 *ʏᴏᴜᴛᴜʙᴇ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`
        
        videos.forEach((v, i) => {
            txt += `*${i + 1}.* ${v.title}\n`
            txt += `   ├ 👤 ${v.author?.name || 'Unknown'}\n`
            txt += `   ├ ⏱️ ${v.timestamp || '-'}\n`
            txt += `   ├ 👁️ ${v.views || 0} views\n`
            txt += `   └ 🔗 ${v.url}\n\n`
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
