const axios = require('axios')
const crypto = require('crypto')
const { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } = require('ourin')
const config = require('../../config')

const pluginConfig = {
    name: 'ssweb-3hasil',
    alias: ['ssweb3', 'ss3', 'screenshot3', 'screenshotweb3'],
    category: 'tools',
    description: 'Screenshot website dalam 3 versi (desktop, mobile, tablet)',
    usage: '.ssweb-3hasil <url>',
    example: '.ssweb-3hasil https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `📸 *sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ 3 ᴠᴇʀsɪ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ \`${m.prefix}ssweb-3hasil <url>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}ssweb-3hasil https://google.com\``
        )
    }
    
    let targetUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        targetUrl = 'https://' + url
    }
    
    m.react('📸')
    
    try {
        const apiUrl = `https://api-faa.my.id/faa/ssweb-3hasil?url=${encodeURIComponent(targetUrl)}`
        const { data } = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!data?.status || !data?.results) {
            throw new Error('Gagal mengambil screenshot')
        }
        
        const results = data.results
        
        const mediaList = []
        
        for (const [device, imgUrl] of Object.entries(results)) {
            if (!imgUrl) continue
            
            try {
                const imgRes = await axios.get(imgUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 30000 
                })
                
                const deviceEmoji = {
                    'desktop': '🖥️',
                    'mobile': '📱',
                    'tablet': '📲'
                }[device] || '📷'
                
                mediaList.push({
                    image: Buffer.from(imgRes.data),
                    caption: `${deviceEmoji} *${device.toUpperCase()}*\n\n` +
                        `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                        `┃ 🔗 URL: \`${targetUrl}\`\n` +
                        `┃ 📱 Device: *${device}*\n` +
                        `╰┈┈⬡`
                })
            } catch (e) {
                console.log(`[SSWeb3] Failed to download ${device}:`, e.message)
            }
        }
        
        if (mediaList.length === 0) {
            throw new Error('Gagal mengunduh screenshot')
        }
        
        m.react('📤')
        
        try {
            const opener = generateWAMessageFromContent(
                m.chat,
                {
                    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                    albumMessage: {
                        expectedImageCount: mediaList.length,
                        expectedVideoCount: 0
                    }
                },
                {
                    userJid: jidNormalizedUser(sock.user.id),
                    quoted: m,
                    upload: sock.waUploadToServer
                }
            )
            
            await sock.relayMessage(opener.key.remoteJid, opener.message, {
                messageId: opener.key.id
            })
            
            for (const content of mediaList) {
                const msg = await generateWAMessage(opener.key.remoteJid, content, {
                    upload: sock.waUploadToServer
                })
                
                msg.message.messageContextInfo = {
                    messageSecret: crypto.randomBytes(32),
                    messageAssociation: {
                        associationType: 1,
                        parentMessageKey: opener.key
                    }
                }
                
                await sock.relayMessage(msg.key.remoteJid, msg.message, {
                    messageId: msg.key.id
                })
            }
            
            m.react('✅')
            
        } catch (albumErr) {
            console.log('[SSWeb3] Album failed, sending individually:', albumErr.message)
            
            const saluranId = config.saluran?.id || '120363208449943317@newsletter'
            const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
            
            for (const content of mediaList) {
                await sock.sendMessage(m.chat, {
                    image: content.image,
                    caption: content.caption,
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
            }
            
            m.react('✅')
        }
        
    } catch (error) {
        console.error('[SSWeb3] Error:', error.message)
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
