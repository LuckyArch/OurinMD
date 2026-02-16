const axios = require('axios')
const config = require('../../config')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')
const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'
const { exec } = require('child_process')
const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const execAsync = promisify(exec)
const crypto = require('crypto')

const pluginConfig = {
    name: 'ytmp42',
    alias: ['youtubemp42', 'ytaudio2'],
    category: 'download',
    description: 'Download audio YouTube',
    usage: '.ytmp42 <url>',
    example: '.ytmp42 https://youtube.com/watch?v=xxx',
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
  }
}

const youtubeSession = new Map()

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url) return m.reply(`Contoh: ${m.prefix}ytmp42 https://youtube.com/watch?v=xxx`)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return m.reply('❌ URL harus YouTube')

    m.react('🎬')

    try {
        const videoUrl = await savetube(url)
        const video = videoUrl.videos.filter(v => !v.label.includes('MP3') && !v.label.includes('MP4'))
        const rows = video.map(v => ({
            header: v.label,
            title: `Downlaoad video kualitas ${v.label}`,
            description: '🍀 Klik untuk download',
            id: `${m.prefix}ytmp42-zann ${url} ${v.label}`
        }))

        await sock.sendMessage(m.chat, {
            image: { url: videoUrl.thumbnail },
            caption: `🍀 *MP4 DOWNLOADER*

- Title: *${videoUrl.title}*
- Duration: *${videoUrl.duration}s*
- Quality: *${video.label}*

*NOTE*
> Silahkan pilih format yang ingin di download`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
            },
            footer: config.bot.name,
            interactiveButtons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                       title: 'PILIH KUALITAS VIDEO',
                        sections: [{
                            title: 'Daftar Kualitas',
                            rows: rows
                        }]
                    })
                }
            ]
        }, { quoted: m })
        m.react('✅')

    } catch (err) {
        console.error('[YTMP4]', err)
        m.react('❌')
        m.reply('Gagal mengunduh video.')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
