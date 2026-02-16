const axios = require('axios')
const cheerio = require('cheerio')
const FormData = require('form-data')
const crypto = require('crypto')
const {
  generateWAMessage,
  generateWAMessageFromContent,
  jidNormalizedUser
} = require('ourin')

async function threadsdl(url) {
    const form = new FormData()
    form.append('search', url)

    const { data } = await axios.post(
        'https://threadsdownload.net/ms?fresh-partial=true',
        form,
        {
            headers: {
                accept: '*/*',
                origin: 'https://threadsdownload.net',
                referer: 'https://threadsdownload.net/ms',
                'user-agent':
                    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/137 Mobile Safari/537.36'
            }
        }
    )

    const $ = cheerio.load(data)
    const jsonString = $(`script[type='application/json']`).text().trim()

    let brace = 0, end = -1
    for (let i = 0; i < jsonString.length; i++) {
        if (jsonString[i] === '{') brace++
        if (jsonString[i] === '}') brace--
        if (brace === 0 && jsonString[i] === '}') {
            end = i + 1
            break
        }
    }

    if (end === -1) throw new Error('JSON tidak valid')

    const parsed = JSON.parse(jsonString.slice(0, end))
    return parsed.v[0][1]
}

const pluginConfig = {
    name: 'threaddl',
    alias: ['tdl', 'threads', 'threadsdl'],
    category: 'download',
    description: 'Download foto Threads (album)',
    usage: '.tdl <url>',
    example: '.tdl https://www.threads.net/@xxx/post/xxx',
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    if (!url || !/threads/i.test(url)) {
        return m.reply(`❌ Gunakan URL Threads yang valid`)
    }

    m.react('⏳')

    try {
        const result = await threadsdl(url)

        const captionText =
            result.caption ||
            result.text ||
            'No description available.'

        const username = result.user?.username || '-'
        const images = []
        for (const group of result.images || []) {
            if (!Array.isArray(group)) continue
            const best = group.sort((a, b) => b.width - a.width)[0]
            if (best?.url) images.push(best.url)
        }

        if (images.length === 0) {
            throw new Error('Tidak ada gambar ditemukan')
        }

        const mediaList = []
        for (let i = 0; i < images.length; i++) {
            const res = await axios.get(images[i], {
                responseType: 'arraybuffer',
                timeout: 20000
            })

            mediaList.push({
                image: Buffer.from(res.data),
                caption:
                    `🧵 *THREADS* [${i + 1}/${images.length}]\n\n` +
                    `╭┈┈⬡「 📋 *INFO* 」\n` +
                    `┃ 👤 User: @${username}\n` +
                    `┃ 📝 Caption: ${captionText}\n` +
                    `╰┈┈⬡`
            })
        }

        const opener = generateWAMessageFromContent(
            m.chat,
            {
                messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                albumMessage: {
                    expectedImageCount: mediaList.length,
                    expectedVideoCount: 0
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
            const msg = await generateWAMessage(
                opener.key.remoteJid,
                content,
                { upload: sock.waUploadToServer }
            )

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

    } catch (err) {
        console.error('[ThreadsDL]', err.message)
        m.react('❌')
        m.reply(`❌ *GAGAL*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}