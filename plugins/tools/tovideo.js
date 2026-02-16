const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const os = require('os')

const pluginConfig = {
    name: 'tovideo',
    alias: ['tovid', 'stickertovideo', 'giftomp4', 'webmtomp4'],
    category: 'tools',
    description: 'Mengubah sticker animasi/GIF menjadi video',
    usage: '.tovideo (reply/caption sticker animasi)',
    example: '.tovideo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 8,
    energi: 2,
    isEnabled: true
}

function isAnimatedWebp(buffer) {
    if (!buffer || buffer.length < 50) return false
    const header = buffer.toString('hex', 0, 200)
    return header.includes('414e494d') || header.includes('616e696d')
}

function checkFfmpeg() {
    try {
        execSync('ffmpeg -version', { stdio: 'pipe', timeout: 5000 })
        return true
    } catch (e) {
        return false
    }
}

async function webpToGifSharp(buffer) {
    const sharp = require('sharp')
    const metadata = await sharp(buffer).metadata()
    
    if (!metadata.pages || metadata.pages <= 1) {
        return null
    }

    return await sharp(buffer, { animated: true, pages: -1 })
        .gif({ loop: 0 })
        .toBuffer()
}

function gifToMp4Ffmpeg(gifBuffer) {
    const tmpDir = os.tmpdir()
    const timestamp = Date.now()
    const gifPath = path.join(tmpDir, `gif_${timestamp}.gif`)
    const mp4Path = path.join(tmpDir, `video_${timestamp}.mp4`)
    
    fs.writeFileSync(gifPath, gifBuffer)
    console.log('[ToVideo] GIF size:', gifBuffer.length)
    
    try {
        const cmd = `ffmpeg -y -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset ultrafast -crf 23 "${mp4Path}"`
        console.log('[ToVideo] Running:', cmd)
        
        execSync(cmd, { 
            stdio: 'pipe', 
            timeout: 60000,
            windowsHide: true
        })
        
        if (fs.existsSync(mp4Path)) {
            const mp4Buffer = fs.readFileSync(mp4Path)
            console.log('[ToVideo] MP4 size:', mp4Buffer.length)
            fs.unlinkSync(mp4Path)
            fs.unlinkSync(gifPath)
            return mp4Buffer
        }
        
        throw new Error('Output file not created')
    } catch (e) {
        try { fs.unlinkSync(gifPath) } catch (x) {}
        try { fs.unlinkSync(mp4Path) } catch (x) {}
        throw e
    }
}

async function webpToPngSharp(buffer) {
    const sharp = require('sharp')
    return await sharp(buffer).png().toBuffer()
}

async function handler(m, { sock }) {
    let downloadFn = null
    const selfIsSticker = m.isSticker || m.type === 'stickerMessage' || m.message?.stickerMessage
    const quotedIsSticker = m.quoted && (
        m.quoted.isSticker || 
        m.quoted.type === 'stickerMessage' || 
        m.quoted.mtype === 'stickerMessage' ||
        m.quoted.message?.stickerMessage
    )

    if (selfIsSticker) {
        downloadFn = m.download
    } else if (quotedIsSticker) {
        downloadFn = m.quoted.download
    }

    if (!downloadFn) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Tidak ada sticker yang terdeteksi!\n\n` +
            `*Cara penggunaan:*\n` +
            `> 1. Kirim sticker + caption \`${m.prefix}tovideo\`\n` +
            `> 2. Reply sticker dengan \`${m.prefix}tovideo\``
        )
        return
    }

    await m.react('⏳')

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.react('❌')
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengunduh sticker.`)
            return
        }

        const isAnimated = isAnimatedWebp(buffer)
        if (!isAnimated) {
            const pngBuffer = await webpToPngSharp(buffer)
            await sock.sendMessage(m.chat, {
                image: pngBuffer,
                caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Sticker statis → gambar!`
            }, { quoted: m })
            await m.react('✅')
            return
        }
        await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> WebP → GIF → MP4...`)
        const gifBuffer = await webpToGifSharp(buffer)
        if (!gifBuffer) {
            await sock.sendMessage(m.chat, {
                document: buffer,
                fileName: 'sticker.webp',
                mimetype: 'image/webp',
                caption: `⚠️ Sticker tidak bisa dikonversi.`
            }, { quoted: m })
            await m.react('⚠️')
            return
        }

        const hasFfmpeg = checkFfmpeg()
        
        if (hasFfmpeg) {
            try {
                const mp4Buffer = gifToMp4Ffmpeg(gifBuffer)
                
                if (mp4Buffer && mp4Buffer.length > 100) {
                    await sock.sendMessage(m.chat, {
                        video: mp4Buffer,
                        mimetype: 'video/mp4',
                        // gifPlayback: true,
                        caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Sticker animasi → video!`
                    }, { quoted: m })
                    await m.react('✅')
                    return
                }
            } catch (ffmpegError) {
                console.error('[ToVideo] FFmpeg error:', ffmpegError.message)
            }
        }

        await sock.sendMessage(m.chat, {
            video: gifBuffer,
            gifPlayback: true,
            caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Sticker animasi → GIF!\n> _FFmpeg tidak tersedia untuk convert ke MP4._`
        }, { quoted: m })
        await m.react('✅')

    } catch (error) {
        console.error('[ToVideo] Error:', error)
        await m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
