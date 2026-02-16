const axios = require('axios')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const { exec } = require('child_process')
const { promisify } = require('util')
const { zencf } = require('zencf')
const config = require('../../config')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')
const cheerio = require('cheerio')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'spotplay',
    alias: ['splay', 'sp'],
    category: 'search',
    description: 'Putar musik dari Spotify',
    usage: '.spotplay <query>',
    example: '.spotplay neffex grateful',
    cooldown: 20,
    energi: 1,
    isEnabled: true
}

async function gettoken() {
    const { token } = await zencf.turnstileMin(
        'https://spotidownloader.com/en13',
        '0x4AAAAAAA8QAiFfE5GuBRRS'
    )

    const r = await axios.post(
        'https://api.spotidownloader.com/session',
        { token },
        {
            headers: {
                'content-type': 'application/json',
                origin: 'https://spotidownloader.com',
                referer: 'https://spotidownloader.com/',
                'user-agent': 'Mozilla/5.0'
            }
        }
    )

    return r.data.token
}

async function searchspotify(query, bearer) {
    const r = await axios.post(
        'https://api.spotidownloader.com/search',
        { query },
        {
            headers: {
                authorization: `Bearer ${bearer}`,
                'content-type': 'application/json',
                origin: 'https://spotidownloader.com',
                referer: 'https://spotidownloader.com/',
                'user-agent': 'Mozilla/5.0'
            }
        }
    )

    return r.data?.results || []
}

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

const BASE_URL = 'https://spotmate.online'
const HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    Referer: 'https://spotmate.online/en1',
    Origin: 'https://spotmate.online'
}

async function downloadSpotify(spotifyUrl) {
    const home = await client.get(`${BASE_URL}/en1`, { headers: HEADERS })
    const $ = cheerio.load(home.data)
    const csrf = $('meta[name="csrf-token"]').attr('content')
    if (!csrf) throw new Error('csrf gagal')

    const headers = {
        ...HEADERS,
        'X-CSRF-TOKEN': csrf,
        'Content-Type': 'application/json'
    }

    const meta = (
        await client.post(
            `${BASE_URL}/getTrackData`,
            { spotify_url: spotifyUrl },
            { headers }
        )
    ).data

    const title = meta?.name || 'Unknown'
    const artist =
        meta?.artists?.length ? meta.artists[0].name : 'Unknown Artist'
    const cover = meta?.album?.images?.[0]?.url || null

    const convert = (
        await client.post(
            `${BASE_URL}/convert`,
            { urls: spotifyUrl },
            { headers }
        )
    ).data

    let url = convert?.url || convert?.download

    if (!url && convert?.task_id) {
        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000))
            const st = (
                await client.post(
                    `${BASE_URL}/status`,
                    { taskId: convert.task_id },
                    { headers }
                )
            ).data
            if (st?.status === 'success' || st?.status === 'finished') {
                url = st.download || st.url || st.result
                if (url) break
            }
        }
    }

    if (!url) throw new Error('download gagal')

    const audio = await fetch(url)
    const buffer = await audio.buffer()
    if (buffer.length < 10000) throw new Error('file rusak')

    return { buffer, title, artist, cover }
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    if (!query)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}spotplay <query>\``
        )

    m.react('🎧')

    let tempMp3

    try {
        const bearer = await gettoken()
        const results = await searchspotify(query, bearer)
        if (!results.length) return m.reply('❌ tidak ditemukan')

        const track = results[0]
        const spotifyUrl = `https://open.spotify.com/track/${track.id}`

        const dl = await downloadSpotify(spotifyUrl)

        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        tempMp3 = path.join(tempDir, `spot_${Date.now()}.mp3`)
        fs.writeFileSync(tempMp3, dl.buffer)

        await sock.sendMessage(
            m.chat,
            {
                audio: fs.readFileSync(tempMp3),
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${dl.artist} - ${dl.title}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: dl.title,
                        body: dl.artist,
                        thumbnailUrl: dl.cover,
                        mediaType: 2,
                        sourceUrl: spotifyUrl
                    }
                }
            },
            { quoted: m }
        )
    } catch (e) {
        m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    } finally {
        if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
    }
}

module.exports = { 
    config: pluginConfig, 
    handler 
}
