const axios = require('axios')
const { uploadImage } = require('../../src/lib/uploader')

const pluginConfig = {
    name: 'tofigurev2',
    alias: ['figurev2', 'figure2'],
    category: 'ai',
    description: 'Ubah gambar ke style Figure v2',
    usage: '.tofigurev2 (reply gambar)',
    example: '.tofigurev2',
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
        return m.reply(`🎭 *ꜰɪɢᴜʀᴇ sᴛʏʟᴇ ᴠ2*\n\n> Kirim/reply gambar untuk diubah ke style Figure\n\n\`${m.prefix}tofigurev2\``)
    }
    
    m.react('⏳')
    await m.reply(`🎭 Mengubah ke style Figure v2...\n> _Proses memerlukan waktu ±20 detik_`)
    
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
        
        const url = `https://api-faa.my.id/faa/tofigurav3?url=${encodeURIComponent(imageUrl)}`
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 120000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `🎭 *ꜰɪɢᴜʀᴇ sᴛʏʟᴇ ᴠ2*`
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
