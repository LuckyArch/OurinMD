const axios = require('axios')

const pluginConfig = {
    name: 'bitly',
    alias: ['shortlink', 'shorturl'],
    category: 'tools',
    description: 'Shorten URL dengan Bitly',
    usage: '.bitly <url>',
    example: '.bitly https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.args[0]
    
    if (!url) {
        return m.reply(`🔗 *ʙɪᴛʟʏ sʜᴏʀᴛʟɪɴᴋ*\n\n> Masukkan URL\n\n\`Contoh: ${m.prefix}bitly https://google.com\``)
    }
    
    if (!url.match(/^https?:\/\//i)) {
        return m.reply(`❌ URL tidak valid! Harus dimulai dengan http:// atau https://`)
    }
    
    m.react('🔗')
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/tools/shortlink/bitly?url=${encodeURIComponent(url)}`, {
            timeout: 30000
        })
        
        if (!res.data?.success || !res.data?.result) {
            m.react('❌')
            return m.reply(`❌ Gagal memperpendek URL`)
        }
        
        const shortUrl = res.data.result
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            text: `🔗 *ʙɪᴛʟʏ sʜᴏʀᴛʟɪɴᴋ*\n\n> *Original:* ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}\n> *Short:* ${shortUrl}`,
            contextInfo: {
                externalAdReply: {
                    title: 'Bitly Shortlink',
                    body: shortUrl,
                    sourceUrl: shortUrl,
                    mediaType: 1
                }
            }
        }, { quoted: m })
        
        await sock.sendMessage(m.chat, {
            text: shortUrl,
            interactiveMessage: {
                body: { text: `🔗 *ʙɪᴛʟʏ sʜᴏʀᴛʟɪɴᴋ*\n\n${shortUrl}` },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'cta_copy',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📋 Copy Link',
                                copy_code: shortUrl
                            })
                        }
                    ]
                }
            }
        })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
