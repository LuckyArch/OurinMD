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

const pluginConfig = {
    name: 'ytmp3',
    alias: ['youtubemp3', 'ytaudio'],
    category: 'download',
    description: 'Download audio YouTube',
    usage: '.ytmp3 <url>',
    example: '.ytmp3 https://youtube.com/watch?v=xxx',
    cooldown: 20,
    energi: 2,
    isEnabled: true
}


let json = null

const gB = Buffer.from('ZXRhY2xvdWQub3Jn', 'base64').toString()

const headers = {
  origin: 'https://v1.y2mate.nu',
  referer: 'https://v1.y2mate.nu/',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  accept: '*/*'
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function ts() {
  return Math.floor(Date.now() / 1000)
}

async function getjson() {
  if (json) return json
  const get = await axios.get('https://v1.y2mate.nu')
  const html = get.data
  const m = /var json = JSON\.parse\('([^']+)'\)/.exec(html)
  json = JSON.parse(m[1])
  return json
}

function authorization() {
  let e = ''
  for (let i = 0; i < json[0].length; i++) {
    e += String.fromCharCode(
      json[0][i] - json[2][json[2].length - (i + 1)]
    )
  }
  if (json[1]) e = e.split('').reverse().join('')
  return e.length > 32 ? e.slice(0, 32) : e
}

function extrakid(url) {
  const m =
    /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /v=([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/shorts\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/live\/([a-zA-Z0-9_-]{11})/.exec(url)

  if (!m) throw new Error('invalid youtube url')
  return m[1]
}

async function init() {
  const key = String.fromCharCode(json[6])
  const url = `https://eta.${gB}/api/v1/init?${key}=${authorization()}&t=${ts()}`
  const res = await axios.get(url, { headers })
  if (res.data.error && res.data.error !== 0 && res.data.error !== '0') {
    throw res.data
  }
  return res.data
}

async function yt2mate(videoUrl, format = 'mp3') {
  await getjson()

  const videoId = extrakid(videoUrl)

  const initRes = await init()

  let res = await axios.get(
    initRes.convertURL +
      '&v=' + videoId +
      '&f=' + format +
      '&t=' + ts() +
      '&_=' + Math.random(),
    { headers }
  )

  let data = res.data

  if (data.error && data.error !== 0) {
    throw data
  }

  if (data.redirect === 1 && data.redirectURL) {
    const r2 = await axios.get(
      data.redirectURL + '&t=' + ts(),
      { headers }
    )
    data = r2.data
  }

  if (data.downloadURL && !data.progressURL) {
    return {
      id: videoId,
      title: data.title,
      format,
      download: data.downloadURL
    }
  }

  for (;;) {
    await sleep(3000)

    const progressRes = await axios.get(
      data.progressURL + '&t=' + ts(),
      { headers }
    )

    const p = progressRes.data

    if (p.error && p.error !== 0) {
      throw p
    }

    if (p.progress === 3) {
      return {
        id: videoId,
        title: p.title,
        format,
        download: data.downloadURL
      }
    }
  }
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url) return m.reply(`Contoh: ${m.prefix}ytmp4 https://youtube.com/watch?v=xxx`)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) return m.reply('❌ URL harus YouTube')

    m.react('🎬')

    try {
        const audioUrl = await yt2mate(url, 'mp3')
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            audio: { url: audioUrl.download },
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
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
