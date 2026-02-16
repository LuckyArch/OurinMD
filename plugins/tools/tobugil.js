const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'tobugil',
    alias: ['totelanjang', 'nudify', 'undress'],
    category: 'tools',
    description: 'AI image processing (18+)',
    usage: '.tobugil',
    example: '.tobugil (reply foto)',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 5,
    isEnabled: true
}

async function uploadToCatbox(buffer) {
    const form = new FormData()
    form.append('fileToUpload', buffer, { filename: 'image.jpg' })
    form.append('reqtype', 'fileupload')
    
    const res = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders()
    })
    return res.data
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Kirim foto dengan caption:\n` +
            `> \`${m.prefix}tobugil\`\n\n` +
            `> Atau reply foto dengan:\n` +
            `> \`${m.prefix}tobugil\`\n\n` +
            `> ⚠️ Fitur ini 18+ dan hanya untuk premium user.`
        )
    }
    
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ɢᴀᴍʙᴀʀ...*\n\n> Mohon tunggu sebentar...`)
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMedia) {
            buffer = await m.quoted.download()
        } else if (m.isMedia) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Gagal mendownload gambar!`)
        }
        
        const directLink = await uploadToCatbox(buffer)
        
        if (!directLink || !directLink.startsWith('http')) {
            throw new Error('Gagal upload gambar ke server')
        }
        
        const apiRes = await axios.get(`https://api.baguss.xyz/api/edits/tobugil?image=${encodeURIComponent(directLink)}`, {
            timeout: 60000
        })
        
        if (!apiRes.data?.url) {
            throw new Error('API tidak mengembalikan hasil')
        }
        
        const resultUrl = apiRes.data.url
        
        await sock.sendMessage(m.chat, {
            image: { url: resultUrl },
            caption: `✅ *ᴅᴏɴᴇ*\n\n> ⚠️ Konten ini hanya untuk hiburan.\n> Jangan disalahgunakan.`
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[ToBugil] Error:', err)
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
