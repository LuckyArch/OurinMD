const { upload, get } = require('../../src/scraper/hd')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance/upscale gambar menjadi HD (V4)',
    usage: '.remini (reply gambar)',
    example: '.remini',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(`✨ *ʀᴇᴍɪɴɪ ᴇɴʜᴀɴᴄᴇ*\n\n> Kirim/reply gambar untuk di-enhance\n\n\`${m.prefix}remini\``)
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
        const temp = path.join(process.cwd(), 'temp', 'hd.jpg')
        fs.writeFileSync(temp, buffer)
        const codes = await upload(temp);
        const uplot = codes.code;
        await new Promise(resolve => setTimeout(resolve, 10000));
        let result = await get(uplot);
        while (result.status === 'waiting') {
            await new Promise(resolve => setTimeout(resolve, 6000));
            result = await get(uplot);
        }
        fs.unlinkSync(temp)
        m.react('✅')

        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

        await sock.sendMessage(m.chat, {
            image: { url: result.downloadUrls[0] },
            caption: `✨ *ʜᴅ ᴇɴʜᴀɴᴄᴇ*\n\n> ✅ Berhasil enhance gambar!`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
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
