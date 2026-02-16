const { upload, get } = require('../../src/scraper/hd')
const axios = require('axios')
const config = require('../../config')
const sharp = require('sharp')
const FormData = require('form-data')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'hd2',
    alias: ['enhance2', 'upscale2', 'aienhancer'],
    category: 'tools',
    description: 'Enhance gambar menjadi HD dengan AI (V3)',
    usage: '.hd2 (reply gambar)',
    example: '.hd2',
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
        return m.reply(`✨ *ʜᴅ ᴇɴʜᴀɴᴄᴇ ᴠ2*\n\n> Kirim/reply gambar untuk di-enhance\n\n\`${m.prefix}hd2\`\n\n> ⏳ Proses membutuhkan waktu ±1 menit`)
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

        await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ɢᴀᴍʙᴀʀ...*\n\n> Estimasi waktu: ±1 menit\n> Mohon tunggu...`)

        const temp = path.join(process.cwd(), 'temp', 'hd.jpg')
        fs.writeFileSync(temp, buffer)
        const codes = await upload(temp);
        fs.unlinkSync(temp)
        const uplot = codes.code;
        await new Promise(resolve => setTimeout(resolve, 10000));
        let result = await get(uplot);
        while (result.status === 'waiting') {
            await new Promise(resolve => setTimeout(resolve, 6000));
            result = await get(uplot);
        }

        if (!result) {
            m.react('❌')
            return m.reply(`❌ Gagal enhance gambar. Coba lagi nanti.`)
        }
        
        m.react('✅')

        await sock.sendMessage(m.chat, {
            document: { url: result.downloadUrls[0] },
            mimetype: 'image/png',
            jpegThumbnail: await sharp(await axios.get(result.downloadUrls[0], { responseType: 'arraybuffer' }).then(res => Buffer.from(res.data))).resize(50, 50).jpeg({ quality: 30 }).toBuffer(),
            fileLength: 99999999999999,
            fileName: `CONVERTED BY ${config.bot.name}`,
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
