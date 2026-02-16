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
    name: 'ytmp32',
    alias: ['youtubemp32', 'ytaudio2'],
    category: 'download',
    description: 'Download audio YouTube',
    usage: '.ytmp32 <url>',
    example: '.ytmp32 https://youtube.com/watch?v=xxx',
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

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url) return m.reply(`Contoh: ${m.prefix}ytmp32 https://youtube.com/watch?v=xxx`)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return m.reply('❌ URL harus YouTube')

    m.react('🎬')

    try {
        const audioUrl = await savetube(url)
        const audio = audioUrl.videos.find(v => v.label.toLowerCase().includes('mp3'))
        await sock.sendMessage(m.chat, {
            audio: { url: audio.url },
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                externalAdReply: {
                    title: audioUrl.title,
                    body: `Duration ${audioUrl.duration} seconds | YT MP 3`,
                    thumbnailUrl: audioUrl.thumbnail,
                    mediaType: 2,
                    mediaUrl:url,
                    sourceUrl: url,
                    renderLargerThumbnail: true
                }
            }           
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
