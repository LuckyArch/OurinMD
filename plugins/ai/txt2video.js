const axios = require('axios')
const crypto = require('crypto')
const { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } = require('ourin')
const config = require('../../config')

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'txt2vid',
    alias: ['text2video', 'texttovideo', 't2v'],
    category: 'ai',
    description: 'Generate video dari text dengan AI',
    usage: '.txt2vid <prompt>',
    example: '.txt2vid cat eating banana',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 5,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.text?.trim()
    
    if (!prompt) {
        return m.reply(
            `🎬 *ᴛᴇxᴛ ᴛᴏ ᴠɪᴅᴇᴏ ᴀɪ*\n\n` +
            `> Generate video dari text prompt\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}txt2vid <prompt>\`\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}txt2vid cat eating banana\`\n` +
            `> \`${m.prefix}txt2vid sunset on the beach\`\n` +
            `> \`${m.prefix}txt2vid anime girl walking\``
        )
    }
    
    m.react('⏳')
    await m.reply(`🎬 *ɢᴇɴᴇʀᴀᴛɪɴɢ ᴠɪᴅᴇᴏ...*\n\n> Prompt: ${prompt}\n> Tunggu 30-120 detik...`)
    
    try {
        const apiUrl = `https://api.neoxr.eu/api/txt2vid?prompt=${encodeURIComponent(prompt)}&apikey=${NEOXR_APIKEY}`
        
        const res = await axios.get(apiUrl, { timeout: 180000 })
        
        if (!res.data?.status || !res.data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Gagal generate video!`)
        }
        
        const videos = res.data.data
        
        m.react('📤')
        
        if (videos.length > 1) {
            try {
                const mediaList = videos.map((v, i) => ({
                    video: { url: v.url },
                    caption: `🎬 *ᴛᴇxᴛ ᴛᴏ ᴠɪᴅᴇᴏ* [${i + 1}/${videos.length}]\n\n> Prompt: ${prompt}`
                }))
                
                const opener = generateWAMessageFromContent(
                    m.chat,
                    {
                        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                        albumMessage: {
                            expectedImageCount: 0,
                            expectedVideoCount: videos.length
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
                return
                
            } catch (albumErr) {
                console.log('[Txt2Vid] Album failed, sending individually:', albumErr.message)
            }
        }
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        for (let i = 0; i < videos.length; i++) {
            await sock.sendMessage(m.chat, {
                video: { url: videos[i].url },
                caption: `🎬 *ᴛᴇxᴛ ᴛᴏ ᴠɪᴅᴇᴏ* [${i + 1}/${videos.length}]\n\n> Prompt: ${prompt}`,
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
        
    } catch (err) {
        console.error('[Txt2Vid] Error:', err.message)
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
