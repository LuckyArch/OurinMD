const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'tofigurine',
    alias: ['figurine', 'tofigure', 'bandai', 'actionfigure'],
    category: 'ai',
    description: 'Ubah foto menjadi action figure/figurine koleksi',
    usage: '.tofigurine (reply/kirim gambar)',
    example: '.tofigurine',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 3,
    isEnabled: true
}

const PROMPT = `Using the model, create a 1/7 scale commercialized figurine of the characters in the picture, 
in a realistic style, in a real environment. The figurine is placed on a computer desk. 
The figurine has a round transparent acrylic base, with no text on the base. 
The content on the computer screen is the modeling process of this figurine. 
Next to the computer screen is a BANDAI-style toy packaging box printed with the original artwork. 
The packaging features two-dimensional flat illustrations.`

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && (m.quoted.isImage || m.quoted.type === 'imageMessage'))
    
    if (!isImage) {
        return m.reply(
            `🎭 *ᴛᴏ ꜰɪɢᴜʀɪɴᴇ*\n\n` +
            `> Kirim/reply gambar untuk diubah ke figurine/action figure\n\n` +
            `\`${m.prefix}tofigurine\``
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
            `> Mengubah gambar ke figurine style\n` +
            `> Proses ini memakan waktu 1-3 menit\n\n` +
            `_Powered by NanoBanana AI_`
        )
        
        const result = await nanoBanana(buffer, PROMPT, {
            resolution: '4K',
            steps: 30,
            guidance_scale: 9
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: result,
            caption: `🎭 *ᴛᴏ ꜰɪɢᴜʀɪɴᴇ*\n\n> Gaya: BANDAI-style Action Figure\n> _Powered by NanoBanana AI_`
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
