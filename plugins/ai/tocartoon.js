const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tocartoon',
    alias: ['cartoon', 'cartoonify', 'tooncartoon'],
    category: 'ai',
    description: 'Ubah foto menjadi gaya kartun',
    usage: '.tocartoon (reply/kirim gambar)',
    example: '.tocartoon',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Transform this image into a vibrant cartoon style like Disney or Pixar animation. 
Apply bold colors, smooth shading, exaggerated features, and that playful cartoon aesthetic. 
Keep the original composition but make it look like a frame from an animated movie with 
clean lines, expressive faces, and bright cheerful colors.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `🎬 *ᴛᴏ ᴄᴀʀᴛᴏᴏɴ*\n\n` +
            `> Kirim/reply gambar untuk diubah ke gaya kartun\n\n` +
            `\`${m.prefix}tocartoon\``
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
            `> Mengubah gambar ke gaya kartun\n` +
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
            caption: `🎬 *ᴛᴏ ᴄᴀʀᴛᴏᴏɴ*\n\n> Gaya: Disney/Pixar Style\n> _Powered by NanoBanana AI_`
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
