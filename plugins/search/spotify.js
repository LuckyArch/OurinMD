const axios = require('axios')
const { zencf } = require('zencf')

const pluginConfig = {
    name: 'spotify',
    alias: ['spotifysearch', 'spsearch'],
    category: 'search',
    description: 'Cari lagu di Spotify',
    usage: '.spotify <query>',
    example: '.spotify neffex grateful',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
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
                'user-agent': 'Mozilla/5.0',
                'content-type': 'application/json',
                origin: 'https://spotidownloader.com',
                referer: 'https://spotidownloader.com/'
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
                'user-agent': 'Mozilla/5.0',
                'content-type': 'application/json',
                authorization: `Bearer ${bearer}`,
                origin: 'https://spotidownloader.com',
                referer: 'https://spotidownloader.com/'
            }
        }
    )

    return r.data?.results || []
}

async function handler(m) {
    const query = m.text?.trim()

    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}spotify <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}spotify neffex grateful\``
        )
    }

    try {
        const bearer = await gettoken()
        const results = await searchspotify(query, bearer)

        if (!results.length) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ditemukan hasil untuk *${query}*`)
        }

        const tracks = results.slice(0, 5)

        let txt = `🎵 *sᴘᴏᴛɪꜰʏ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n\n`

        tracks.forEach((t, i) => {
            txt += `*${i + 1}.* ${t.title}\n`
            txt += `   ├ 👤 ${t.artists}\n`
            txt += `   ├ 💿 ${t.album}\n`
            txt += `   └ 🔗 https://open.spotify.com/track/${t.id}\n\n`
        })

        txt += `> 💡 Download: \`${m.prefix}spdl <url / id>\``

        return m.reply(txt.trim())
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
