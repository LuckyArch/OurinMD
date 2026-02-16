const { snackvideo } = require('btch-downloader')

const pluginConfig = {
    name: 'snackvideodl',
    alias: ['svdl', 'snackvideo', 'sv'],
    category: 'download',
    description: 'Download video SnackVideo',
    usage: '.svdl <url>',
    example: '.svdl https://www.snackvideo.com/@xxx/video/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}svdl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}svdl https://www.snackvideo.com/@xxx/video/xxx\``
        )
    }
    
    if (!url.match(/snackvideo\.com/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link SnackVideo.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const data = await snackvideo(url)
        
        if (!data?.status || !data?.result?.videoUrl) {
            return m.reply(`❌ Gagal mengambil video. Coba link lain.`)
        }
        
        const result = data.result
        
        await sock.sendMessage(m.chat, {
            video: { url: result.videoUrl },
            caption: `✅ *sɴᴀᴄᴋᴠɪᴅᴇᴏ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                `> 📛 ${result.creator?.name || 'Unknown'}\n` +
                `> 👁️ ${result.interaction?.views || 0} views\n` +
                `> ❤️ ${result.interaction?.likes || 0} likes`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
