const likee = require('../../src/scraper/likee')

const pluginConfig = {
    name: 'likeedl',
    alias: ['lkdl', 'likee', 'lk'],
    category: 'download',
    description: 'Download video Likee',
    usage: '.lkdl <url>',
    example: '.lkdl https://likee.video/@xxx',
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
            `> \`${m.prefix}lkdl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}lkdl https://likee.video/@xxx\``
        )
    }
    
    if (!url.match(/likee\.(video|com)/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link Likee.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const data = await likee(url)
        
        if (!data) {
            return m.reply(`❌ Gagal mengambil video. Coba link lain.`)
        }
        
        const videoUrl = data.without_watermark || data.with_watermark
        
        if (!videoUrl) {
            return m.reply(`❌ Video tidak ditemukan.`)
        }
        
        await sock.sendMessage(m.chat, {
            video: { url: videoUrl },
            caption: `✅ *ʟɪᴋᴇᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                `> 📊 ${data.stats || 'No stats'}`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
