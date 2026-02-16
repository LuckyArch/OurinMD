const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: ['fakecall', 'fakecallwa'],
    alias: [],
    category: 'fun',
    description: 'Membuat gambar fake call WhatsApp',
    usage: '.fakecall <nama> | <durasi>',
    example: '.fakecall Marin | 19.00',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function uploadToTmpFiles(buffer) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename: 'avatar.jpg', contentType: 'image/jpeg' })
        
        const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        
        if (response.data?.status === 'success' && response.data?.data?.url) {
            return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        }
        return null
    } catch (e) {
        console.log('Upload error:', e.message)
        return null
    }
}

async function handler(m, { sock }) {
    const text = m.text
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}fakecall <nama> | <durasi>\`\n\n` +
            `> Contoh: \`${m.prefix}fakecall Marin | 19.00\`\n\n` +
            `💡 *Tips:* Reply gambar untuk custom avatar`
        )
    }
    
    const [nama, durasi] = text.split('|').map(s => s.trim())
    
    if (!nama) {
        return m.reply(`❌ Nama tidak boleh kosong!`)
    }
    
    await m.reply(`⏳ *Membuat fake call...*`)
    
    try {
        let avatar = 'https://files.catbox.moe/nwvkbt.png'
        
        if (m.isImage) {
            try {
                const buffer = await m.download()
                const uploadedUrl = await uploadToTmpFiles(buffer)
                if (uploadedUrl) {
                    avatar = uploadedUrl
                }
            } catch {}
        } else if (m.quoted?.isImage) {
            try {
                const buffer = await m.quoted.download()
                const uploadedUrl = await uploadToTmpFiles(buffer)
                if (uploadedUrl) {
                    avatar = uploadedUrl
                }
            } catch {}
        } else {
            try {
                avatar = await sock.profilePictureUrl(m.sender, 'image')
            } catch {}
        }
        
        const apiUrl = `https://api.zenzxz.my.id/api/maker/fakecall?nama=${encodeURIComponent(nama)}&durasi=${encodeURIComponent(durasi || '00:00')}&avatar=${encodeURIComponent(avatar)}`
        
        await sock.sendMessage(m.chat, {
            image: { url: apiUrl },
            caption: `📞 *Fake Call*\n> Nama: ${nama}\n> Durasi: ${durasi || '-'}`
        }, { quoted: m })
        
        m.react('📞')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
