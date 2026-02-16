const axios = require('axios')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } = require('ourin')
const config = require('../../config')

const execAsync = promisify(exec)
const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'pinvid',
    alias: ['pinvideo', 'pinterestv', 'pinv'],
    category: 'search',
    description: 'Search video Pinterest (album)',
    usage: '.pinvid <query>',
    example: '.pinvid anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 2,
    isEnabled: true
}

async function convertM3u8ToMp4(m3u8Url, outputPath) {
    const cmd = `ffmpeg -y -i "${m3u8Url}" -c copy -bsf:a aac_adtstoasc "${outputPath}"`
    await execAsync(cmd, { timeout: 120000 })
    return fs.existsSync(outputPath)
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴠɪᴅᴇᴏ sᴇᴀʀᴄʜ*\n\n` +
            `> Masukkan query pencarian\n\n` +
            `\`${m.prefix}pinvid anime\``
        )
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.neoxr.eu/api/pinterest-v2?q=${encodeURIComponent(query)}&show=10&type=video&apikey=${NEOXR_APIKEY}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan video untuk: ${query}`)
        }
        
        const videos = res.data.data.slice(0, 5)
        
        m.react('⏳')
        await m.reply(`⏳ *ᴍᴇɴɢᴜɴᴅᴜʜ ${videos.length} ᴠɪᴅᴇᴏ...*\n\n> Query: ${query}`)
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }
        
        const mediaList = []
        
        for (let i = 0; i < videos.length; i++) {
            const video = videos[i]
            
            if (!video.content?.[0]?.url) continue
            
            try {
                const videoUrl = video.content[0].url
                const duration = video.content[0].duration ? Math.round(video.content[0].duration / 1000) : 0
                const durationStr = duration > 0 ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : '-'
                
                let videoBuffer
                
                if (videoUrl.includes('.m3u8')) {
                    const outputPath = path.join(tempDir, `pinvid_${Date.now()}_${i}.mp4`)
                    
                    try {
                        await convertM3u8ToMp4(videoUrl, outputPath)
                        
                        if (fs.existsSync(outputPath)) {
                            videoBuffer = fs.readFileSync(outputPath)
                            fs.unlinkSync(outputPath)
                        }
                    } catch (ffmpegErr) {
                        console.log(`[PinVid] FFmpeg error for video ${i + 1}:`, ffmpegErr.message)
                        continue
                    }
                } else {
                    const videoRes = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 60000
                    })
                    videoBuffer = Buffer.from(videoRes.data)
                }
                
                if (videoBuffer && videoBuffer.length > 1000) {
                    mediaList.push({
                        video: videoBuffer,
                        caption: `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴠɪᴅᴇᴏ* [${i + 1}/${videos.length}]\n\n` +
                            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                            `┃ ◦ Title: *${video.title !== '-' ? video.title : 'No Title'}*\n` +
                            `┃ ◦ Author: *${video.author?.full_name || '-'}*\n` +
                            `┃ ◦ Duration: *${durationStr}*\n` +
                            `╰┈┈⬡\n\n` +
                            `> _Query: ${query}_`
                    })
                }
            } catch (vidErr) {
                console.log(`[PinVid] Failed to process video ${i + 1}:`, vidErr.message)
            }
        }
        
        if (mediaList.length === 0) {
            m.react('❌')
            return m.reply(`❌ Gagal mengunduh video`)
        }
        
        m.react('📤')
        
        try {
            const opener = generateWAMessageFromContent(
                m.chat,
                {
                    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                    albumMessage: {
                        expectedImageCount: 0,
                        expectedVideoCount: mediaList.length
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
            console.log('[PinVid] Album message failed, sending individually:', albumErr.message)
            
            const saluranId = config.saluran?.id || '120363208449943317@newsletter'
            const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
            
            for (const content of mediaList) {
                await sock.sendMessage(m.chat, {
                    video: content.video,
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
        console.error('[PinVid] Error:', error.message)
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
