const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'ssweb',
    alias: ['screenshot', 'ss', 'webss'],
    category: 'tools',
    description: 'Screenshot website',
    usage: '.ssweb <url>',
    example: '.ssweb https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function screenshotWeb(url, options = {}) {
    const { width = 1280, height = 720, fullPage = false, scale = 1 } = options
    
    const { data } = await axios.post('https://gcp.imagy.app/screenshot/createscreenshot', {
        url: url,
        browserWidth: parseInt(width),
        browserHeight: parseInt(height),
        fullPage: fullPage,
        deviceScaleFactor: parseInt(scale),
        format: 'png'
    }, {
        headers: {
            'content-type': 'application/json',
            referer: 'https://imagy.app/full-page-screenshot-taker/',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    })
    
    return data.fileUrl
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `📸 *sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ*\n\n` +
            `> Screenshot halaman website\n\n` +
            `> *Contoh:*\n` +
            `> ${m.prefix}ssweb https://google.com\n` +
            `> ${m.prefix}ss https://github.com --full`
        )
    }
    
    let fullPage = false
    if (text.includes('--full')) {
        fullPage = true
        text = text.replace('--full', '').trim()
    }
    
    if (!text.startsWith('http')) {
        text = 'https://' + text
    }
    
    await m.react('⏳')
    await m.reply(config.messages?.wait || '⏳ Mengambil screenshot...')
    
    try {
        const imageUrl = await screenshotWeb(text, { fullPage })
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `📸 *sᴄʀᴇᴇɴsʜᴏᴛ*\n\n> URL: ${text}\n> Full Page: ${fullPage ? 'Yes' : 'No'}`,
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
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
