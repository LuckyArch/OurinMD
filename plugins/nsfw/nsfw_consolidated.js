const axios = require('axios')
const config = require('../../config')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

const COMMANDS = [
    'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 
    'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 
    'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 
    'cringe', 'trap', 'blowjob', 'hentai', 'boobs', 'ass', 'pussy', 'thighs', 'lesbian', 
    'lewdneko', 'cum'
]

const other = {
    'waifu-nsfw': 'waifu',
    'neko-nsfw': 'neko'
}

const pluginConfig = {
    name: [...COMMANDS, ...Object.keys(other)],
    alias: [],
    category: 'nsfw',
    description: 'Consolidated NSFW commands with fallback logic',
    usage: `.${COMMANDS[0]}`,
    example: `.${COMMANDS[0]}`,
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 2,
    isEnabled: true
}

function gifToMp4(gifBuffer) {
    const tmpDir = os.tmpdir()
    const timestamp = Date.now()
    const gifPath = path.join(tmpDir, `nsfw_${timestamp}.gif`)
    const mp4Path = path.join(tmpDir, `nsfw_${timestamp}.mp4`)

    try {
        fs.writeFileSync(gifPath, gifBuffer)
        // FFmpeg command to convert GIF to MP4
        // -movflags faststart: Enable streaming
        // -pix_fmt yuv420p: Ensure compatibility
        // -vf "scale=...": Ensure even dimensions (required for some encoders)
        const cmd = `ffmpeg -y -i "${gifPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -preset ultrafast -crf 23 "${mp4Path}"`
        
        execSync(cmd, { stdio: 'pipe', timeout: 30000, windowsHide: true })

        if (fs.existsSync(mp4Path)) {
            const mp4Buffer = fs.readFileSync(mp4Path)
            fs.unlinkSync(mp4Path)
            fs.unlinkSync(gifPath)
            return mp4Buffer
        }
    } catch (e) {
        console.error('[NSFW] FFmpeg conversion failed:', e.message)
        try { if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath) } catch {}
        try { if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path) } catch {}
    }
    return null
}

async function fetchRule34(tag) {
    try {
        const url = `https://rule34.xxx/index.php?page=dapi&s=post&q=index&tags=${tag}&json=1`
        const { data } = await axios.get(url, { timeout: 10000 })
        if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)]
            return random.file_url
        }
    } catch (e) {
        return null
    }
    return null
}

async function fetchWaifuPics(type, category = 'nsfw') {
    try {
        const url = `https://api.waifu.pics/${category}/${type}`
        const { data } = await axios.get(url, { timeout: 10000 })
        return data.url
    } catch (e) {
        return null
    }
}

async function handler(m, { sock }) {
    let command = m.command.toLowerCase()
    if (command === 'neko-nsfw') command = 'neko'
    if (command === 'waifu-nsfw') command = 'waifu'
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

    m.react('🔁')

    try {
        let imageUrl = null
        imageUrl = await fetchRule34(command)
        if (!imageUrl) {
            imageUrl = await fetchWaifuPics(command, 'nsfw')
        }
        if (!imageUrl) {
            imageUrl = await fetchWaifuPics(command, 'sfw')
        }

        if (!imageUrl) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gambar tidak ditemukan untuk tag: ${command}`)
        }

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
        const buffer = response.data
        const contentType = response.headers['content-type']
        
        m.react('🔞')
        
        const isGif = contentType?.includes('gif') || imageUrl.endsWith('.gif')

        if (isGif) {
             const mp4Buffer = gifToMp4(buffer)
             
             if (mp4Buffer) {
                 await sock.sendMessage(m.chat, {
                    video: mp4Buffer,
                    gifPlayback: true,
                    caption: `🔞 *${command.toUpperCase()}*\n\n> Source: Automated (Rule34/Waifu.pics)`,
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
             } else {
                 // Fallback to sending as GIF document if conversion fails
                 await sock.sendMessage(m.chat, {
                    image: buffer,
                    mimetype: 'image/gif',
                    caption: `🔞 *${command.toUpperCase()}*\n\n> Source: Automated (Rule34/Waifu.pics)\n> _(Conversion failed, sent as GIF)_`,
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
        } else {
            await sock.sendMessage(m.chat, {
                image: buffer,
                caption: `🔞 *${command.toUpperCase()}*\n\n> Source: Automated (Rule34/Waifu.pics)`,
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

    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
