const axios = require('axios')
const cheerio = require('cheerio')
const CryptoJS = require('crypto-js')
const config = require('../../config')

const pluginConfig = {
    name: 'aio',
    alias: ['allinone', 'download', 'dl'],
    category: 'downloader',
    description: 'All in one downloader (IG, TikTok, FB, Twitter, dll)',
    usage: '.aio <url>',
    example: '.aio https://instagram.com/p/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function scrapeAIO(targetUrl) {
    const baseUrl = 'https://allinonedownloader.com'
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

    try {
        const initRes = await axios.get(baseUrl, {
            headers: { 'User-Agent': ua }
        })

        const $ = cheerio.load(initRes.data)
        const token = $('#token').val()
        const apiPath = $('#scc').val()
        const cookies = initRes.headers['set-cookie']?.map(c => c.split(';')[0]).join('; ')

        if (!token || !apiPath) throw new Error('Token tidak ditemukan')

        const jsPath = $('script[src*="template/main/assets/js/main.js"]').attr('src')
        const jsUrl = new URL(jsPath, baseUrl).href
        const { data: jsContent } = await axios.get(jsUrl, {
            headers: { 'User-Agent': ua, 'Cookie': cookies }
        })

        const ivMatch = jsContent.match(/CryptoJS\.enc\.Hex\.parse\(['"]([a-f0-9]{32})['"]\)/)
        const ivHex = ivMatch ? ivMatch[1] : 'afc4e290725a3bf0ac4d3ff826c43c10'

        const key = CryptoJS.enc.Hex.parse(token)
        const iv = CryptoJS.enc.Hex.parse(ivHex)
        const urlhash = CryptoJS.AES.encrypt(targetUrl, key, {
            iv: iv,
            padding: CryptoJS.pad.ZeroPadding
        }).toString()

        const apiUrl = apiPath.startsWith('http') ? apiPath : `${baseUrl}${apiPath}`

        const { data } = await axios.post(apiUrl, 
            new URLSearchParams({
                url: targetUrl,
                token: token,
                urlhash: urlhash
            }).toString(), 
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': baseUrl,
                    'Cookie': cookies,
                    'User-Agent': ua
                }
            }
        )

        return data
    } catch (err) {
        return { error: err.message }
    }
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `📥 *ᴀʟʟ ɪɴ ᴏɴᴇ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ*\n\n` +
            `> Download dari berbagai platform!\n\n` +
            `╭┈┈⬡「 🌐 *ᴘʟᴀᴛꜰᴏʀᴍ* 」\n` +
            `┃ • Instagram\n` +
            `┃ • TikTok\n` +
            `┃ • Facebook\n` +
            `┃ • Twitter/X\n` +
            `┃ • YouTube\n` +
            `┃ • Dan lainnya...\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> *Contoh:* ${m.prefix}aio https://instagram.com/p/xxx`
        )
    }
    
    if (!url.startsWith('http')) {
        return m.reply(`❌ URL tidak valid! Harus dimulai dengan http/https`)
    }
    
    await m.react('⏳')
    await m.reply(config.messages?.wait || '⏳ Tunggu sebentar...')
    
    try {
        const result = await scrapeAIO(url)
        
        if (result.error) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error}`)
        }
        
        if (!result.links || result.links.length === 0) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengambil media dari URL tersebut`)
        }
        
        const title = result.title || 'Media Download'
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        for (const link of result.links.slice(0, 5)) {
            try {
                const mediaUrl = link.url
                const type = link.type?.toLowerCase() || ''
                const isVideo = ['mp4', 'mov', 'webm', 'video'].some(t => type.includes(t))
                const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'image'].some(t => type.includes(t))
                
                const caption = `📥 *${title}*\n\n` +
                    `> Type: ${link.type || 'Unknown'}\n` +
                    `> Quality: ${link.quality || 'HD'}\n` +
                    `> Size: ${link.size || '?'}`
                
                const contextInfo = {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
                
                if (isVideo) {
                    await sock.sendMessage(m.chat, {
                        video: { url: mediaUrl },
                        caption,
                        contextInfo
                    }, { quoted: m })
                } else if (isImage) {
                    await sock.sendMessage(m.chat, {
                        image: { url: mediaUrl },
                        caption,
                        contextInfo
                    }, { quoted: m })
                } else {
                    await sock.sendMessage(m.chat, {
                        document: { url: mediaUrl },
                        fileName: `download.${link.type || 'mp4'}`,
                        mimetype: `video/${link.type || 'mp4'}`,
                        caption,
                        contextInfo
                    }, { quoted: m })
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000))
                
            } catch (err) {
                console.error('Media send failed:', err.message)
            }
        }
        
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
