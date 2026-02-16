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
    name: 'playch',
    alias: ['pch'],
    category: 'search',
    description: 'Putar musik dari Spotify',
    usage: '.playch <query>',
    example: '.playch neffex grateful',
    cooldown: 20,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const s = m.args
    const idch = s[0]
    const query = s.slice(1).join(' ')
    if (!query || !idch)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}spotplay idch <query>\``
        )
    m.react('🎧')
    let tempMp3
    try {
        const { data } = await axios.get(`https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`)
        const dl = await axios.get(data.result.dlink, { responseType: 'arraybuffer' })
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

        tempMp3 = path.join(tempDir, `spot_${Date.now()}.mp3`)
        let input = path.join(tempMp3);
        let output = path.join(tempDir, `out_${Date.now()}.mp3`);
        fs.writeFileSync(input, Buffer.from(dl.data));
        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -y -i "${input}" -map_metadata -1 -vn -ar 44100 -ac 2 -b:a 192k "${output}"`,
                err => err ? reject(err) : resolve()
            )
        })
        let ogg = fs.readFileSync(output);
        await sock.sendMessage(
            idch,
            {
                audio: ogg,
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 99,
                    externalAdReply: {
                        title: data.result.title,
                        body: `Quality ${data.result.pick?.quality}`,
                        thumbnailUrl: data.result.thumbnail,
                        mediaType: 1,
                        sourceUrl: data.result.dlink,
                        renderLargerThumbnail: false
                    }
                }
            }
        )
            setTimeout(() => {
                if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3)
                if (fs.existsSync(output)) fs.unlinkSync(output)
            }, 30000)
        await m.react('✅')
        await m.reply(`✅ *SUCCESS*
          
Berhasil mengirimkan lagu ke saluran *${idch}*

🍀 *NOTE*
> Ini belum stabil banget yak, jadi kemungkinan belum bisa di play.`)
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
