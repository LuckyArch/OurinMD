const { cocofun } = require('btch-downloader')

const pluginConfig = {
    name: 'cocofundl',
    alias: ['cfdl', 'cocofun', 'cf'],
    category: 'download',
    description: 'Download video CocoFun',
    usage: '.cfdl <url>',
    example: '.cfdl https://www.cocofun.com/share/post/xxx',
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
            `> \`${m.prefix}cfdl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}cfdl https://www.cocofun.com/share/post/xxx\``
        )
    }
    
    if (!url.match(/cocofun\.com/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link CocoFun.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const data = await cocofun(url)
        
        if (!data?.status || !data?.result) {
            return m.reply(`❌ Gagal mengambil video. Coba link lain.`)
        }
        
        const result = data.result
        const videoUrl = result.no_watermark || result.watermark
        
        if (!videoUrl) {
            return m.reply(`❌ Video tidak ditemukan.`)
        }
        
        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: `✅ *ᴄᴏᴄᴏꜰᴜɴ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                `> 📛 ${result.topic || 'CocoFun Video'}\n` +
                `> ▶️ ${result.play || 0} plays\n` +
                `> ❤️ ${result.like || 0} likes`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
