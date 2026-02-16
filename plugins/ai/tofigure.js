const axios = require('axios')
const { uploadImage } = require('../../src/lib/uploader')

const pluginConfig = {
    name: 'tofigure',
    alias: ['figure', 'figurestyle'],
    category: 'ai',
    description: 'Ubah gambar ke style Figure/Action',
    usage: '.tofigure (reply gambar)',
    example: '.tofigure',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🎭 *ꜰɪɢᴜʀᴇ sᴛʏʟᴇ*\n\n> Kirim/reply gambar untuk diubah ke style Figure\n\n\`${m.prefix}tofigure\``)
    }
    
    m.react('⏳')
    await m.reply(`🎭 Mengubah ke style Figure...\n> _Proses memerlukan waktu ±20 detik_`)
    
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
        
        const imageUrl = await uploadImage(buffer, 'image.jpg')
        
        const res = await axios.get(`https://api-faa.my.id/faa/tofigura?url=${encodeURIComponent(imageUrl)}`, {
            responseType: 'arraybuffer',
            timeout: 120000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🎭 *ꜰɪɢᴜʀᴇ sᴛʏʟᴇ*`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
