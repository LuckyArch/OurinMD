const axios = require('axios')
const config = require('../../config')
const { exec } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const execAsync = promisify(exec)
const crypto = require('crypto')

const pluginConfig = {
    name: 'ytmp42-zann',
    alias: ['youtubemp42-zann', 'ytaudio2-zann'],
    category: 'download',
    description: 'Download video YouTube (quality selected)',
    usage: '.ytmp42-zann <url> <quality>',
    example: '.ytmp42-zann https://youtube.com/watch?v=xxx 720p',
    cooldown: 20,
    energi: 2,
    isEnabled: true
}

const anu = Buffer.from('C5D58EF67A7584E4A29F6C35BBC4EB12', 'hex')

function decrypt(enc) {
    const b = Buffer.from(enc.replace(/\s/g, ''), 'base64')
    const iv = b.subarray(0, 16)
    const data = b.subarray(16)
    const d = crypto.createDecipheriv('aes-128-cbc', anu, iv)
    return JSON.parse(Buffer.concat([d.update(data), d.final()]).toString())
}

async function savetube(url) {
    try {
        const random = await axios.get('https://media.savetube.vip/api/random-cdn', {
            headers: {
                origin: 'https://save-tube.com',
                referer: 'https://save-tube.com/',
                'User-Agent': 'Mozilla/5.0'
            }
        })

        const cdn = random.data.cdn

        const info = await axios.post(`https://${cdn}/v2/info`,
            { url },
            {
                headers: {
                    'Content-Type': 'application/json',
                    origin: 'https://save-tube.com',
                    referer: 'https://save-tube.com/',
                    'User-Agent': 'Mozilla/5.0'
                }
            }
        )

        if (!info.data || !info.data.status) return { status: false }

        const json = decrypt(info.data.data)

        async function download(type, quality) {
            const r = await axios.post(`https://${cdn}/download`,
                {
                    id: json.id,
                    key: json.key,
                    downloadType: type,
                    quality: String(quality)
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        origin: 'https://save-tube.com',
                        referer: 'https://save-tube.com/',
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            )
            return r.data && r.data.data ? r.data.data.downloadUrl : null
        }

        const videos = []

        for (const v of json.video_formats) {
            videos.push({
                quality: v.quality,
                label: v.label,
                url: await download('video', v.quality)
            })
        }

        for (const a of json.audio_formats) {
            videos.push({
                quality: a.quality,
                label: a.label,
                url: await download('audio', a.quality)
            })
        }

        return {
            title: json.title,
            duration: json.duration,
            thumbnail: json.thumbnail,
            videos
        }
    } catch (error) {
        console.error(error)
        throw error
    }
}

async function downloadFile(url, destPath) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 300000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://save-tube.com/'
        }
    })

    const writer = fs.createWriteStream(destPath)

    return new Promise((resolve, reject) => {
        response.data.pipe(writer)
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

async function handler(m, { sock }) {
    const url = m.args[0]
    const variant = m.args[1]?.toLowerCase()

    if (!url) {
        return m.reply(`Contoh: ${m.prefix}ytmp42-zann https://youtube.com/watch?v=xxx 720p`)
    }

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        return m.reply('❌ URL harus YouTube')
    }

    m.react('🎬')

    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
    }

    const inputPath = path.join(tempDir, `${Date.now()}_input_${Math.random().toString(36).slice(2)}.mp4`)
    const outputPath = path.join(tempDir, `${Date.now()}_output_${Math.random().toString(36).slice(2)}.mp4`)

    try {
        const videoData = await savetube(url)

        if (!videoData || !videoData.videos) {
            throw new Error('Gagal mendapatkan data video')
        }

        const video = videoData.videos.find(v => v.label.toLowerCase().includes(variant))

        if (!video || !video.url) {
            throw new Error(`Kualitas ${variant} tidak ditemukan`)
        }

        await m.reply(`⏳ *Mengunduh video ${variant}...*\n> Mohon tunggu sebentar`)

        await downloadFile(video.url, inputPath)

        const cmd = `ffmpeg -y -i "${inputPath}" -map 0:v:0? -map 0:a:0? -c:v libx264 -profile:v baseline -level 3.1 -pix_fmt yuv420p -preset veryfast -movflags +faststart -c:a aac -b:a 128k -ar 44100 "${outputPath}"`

        await execAsync(cmd, { timeout: 300000 })

        await sock.sendMessage(m.chat, {
            video: fs.readFileSync(outputPath),
            mimetype: 'video/mp4',
            caption: `✅ *DONE*\n\n📹 Title: ${videoData.title}\n📊 Quality: ${variant}\n⏱️ Duration: ${videoData.duration}s`
        }, { quoted: m })

        m.react('✅')

    } catch (err) {
        console.error('[YTMP4]', err)
        m.react('❌')
        m.reply(`❌ *Gagal*\n\n> ${err.message}`)
    } finally {
        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath) } catch {}
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) } catch {}
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
