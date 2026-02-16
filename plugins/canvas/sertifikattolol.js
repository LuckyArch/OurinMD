const axios = require('axios')

const pluginConfig = {
    name: 'sertifikattolol',
    alias: ['sertiftolol', 'tolol', 'sertifikatolol'],
    category: 'canvas',
    description: 'Membuat sertifikat tolol',
    usage: '.sertifikattolol <nama>',
    example: '.sertifikattolol Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text && m.quoted) {
        text = m.quoted.pushName || m.quoted.sender?.split('@')[0]
    }
    
    if (!text) {
        return m.reply(
            `📜 *sᴇʀᴛɪꜰɪᴋᴀᴛ ᴛᴏʟᴏʟ*\n\n` +
            `> Masukkan nama untuk sertifikat\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> 1. \`${m.prefix}sertifikattolol <nama>\`\n` +
            `> 2. Reply pesan seseorang dengan \`${m.prefix}sertifikattolol\`\n\n` +
            `> Contoh: \`${m.prefix}sertifikattolol Budi\``
        )
    }
    
    m.react('📜')
    await m.reply(`⏳ *ᴍᴇᴍʙᴜᴀᴛ sᴇʀᴛɪꜰɪᴋᴀᴛ...*`)
    
    try {
        const apiUrl = `https://zelapioffciall.koyeb.app/canvas/sertifikatolol?text=${encodeURIComponent(text)}`
        const response = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            timeout: 60000 
        })
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `📜 *sᴇʀᴛɪꜰɪᴋᴀᴛ ᴛᴏʟᴏʟ*\n\n> Penerima: *${text}*\n\n> _Selamat atas prestasi luar biasa ini! 🎉_`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
