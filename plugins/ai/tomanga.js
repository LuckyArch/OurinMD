const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tomanga',
    alias: ['manga', 'mangafy', 'mangastyle'],
    category: 'ai',
    description: 'Ubah foto menjadi gaya manga Jepang',
    usage: '.tomanga (reply/kirim gambar)',
    example: '.tomanga',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into Japanese manga style illustration. 
Apply black and white manga aesthetics with dramatic shading, speed lines, 
expressive eyes, and detailed screentones. Keep the original composition 
but convert it to look like a page from a Japanese manga with bold ink lines, 
dynamic poses, and that distinctive manga art style.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n` +
            `> Kirim/reply gambar untuk diubah ke gaya manga\n\n` +
            `\`${m.prefix}tomanga\``
        )
    }
    
    m.react('⏳')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Gagal mendownload gambar`)
        }
        
        await m.reply(
            `⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n` +
            `> Mengubah gambar ke gaya manga\n` +
            `> Proses ini memakan waktu 1-3 menit\n\n` +
            `_Powered by NanoBanana AI_`
        )
        
        const result = await nanoBanana(buffer, PROMPT, {
            resolution: '4K',
            steps: 25,
            guidance_scale: 8
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result,
            caption: `📖 *ᴛᴏ ᴍᴀɴɢᴀ*\n\n> Gaya: Japanese Manga\n> _Powered by NanoBanana AI_`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}\n\n_Coba lagi nanti_`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
