const { capcut } = require('btch-downloader')

const pluginConfig = {
    name: 'capcutdl',
    alias: ['ccdl', 'capcut', 'cc'],
    category: 'download',
    description: 'Download video CapCut',
    usage: '.ccdl <url>',
    example: '.ccdl https://www.capcut.com/t/xxx',
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
            `> \`${m.prefix}ccdl <url>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}ccdl https://www.capcut.com/t/xxx\``
        )
    }
    
    if (!url.match(/capcut\.com/i)) {
        return m.reply(`❌ URL tidak valid. Gunakan link CapCut.`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ᴠɪᴅᴇᴏ...*`)
    
    try {
        const data = await capcut(url)
        
        if (!data?.status || !data?.originalVideoUrl) {
            return m.reply(`❌ Gagal mengambil video. Coba link lain.`)
        }
        
        await sock.sendMessage(m.chat, {
            video: { url: data.originalVideoUrl },
            caption: `✅ *ᴄᴀᴘᴄᴜᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
                `> 📛 ${data.title || 'CapCut Video'}\n` +
                `> 👤 ${data.authorName || 'Unknown'}`
        }, { quoted: m })
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
