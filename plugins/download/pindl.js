const { pinterestdl } = require('../../src/lib/pinterest')
const config = require('../../config')

const pluginConfig = {
    name: 'pindl',
    alias: ['pinterestdl', 'pindownload', 'pintdl'],
    category: 'download',
    description: 'Download gambar/video dari Pinterest',
    usage: '.pindl <url>',
    example: '.pindl https://pin.it/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()

    if (!url) {
        return m.reply(
            `📌 *ᴘɪɴᴛᴇʀᴇsᴛ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
            `> Download gambar/video dari Pinterest\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}pindl https://pin.it/xxx\`\n` +
            `> \`${m.prefix}pindl https://pinterest.com/pin/xxx\``
        )
    }

    if (!url.match(/pinterest|pin\.it/i)) {
        return m.reply('❌ URL tidak valid. Gunakan link Pinterest.')
    }

    m.react('⏳')

    try {
        const result = await pinterestdl(url)

        if (!result || !result.media || result.media.length === 0) {
            throw new Error('Tidak ada media ditemukan')
        }

        const caption = 
            `📌 *ᴘɪɴᴛᴇʀᴇsᴛ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ᴛɪᴛʟᴇ: ${result.title}\n` +
            `┃ 🆔 ɪᴅ: \`${result.id}\`\n` +
            `╰┈┈⬡\n\n` +
            (result.description ? `> ${result.description.slice(0, 200)}${result.description.length > 200 ? '...' : ''}` : '')

        for (const media of result.media) {
            if (media.type === 'video') {
                await sock.sendMessage(
                    m.chat,
                    {
                        video: { url: media.url },
                        mimetype: 'video/mp4',
                        caption,
                        footer: `© ${config.bot?.name}`
                    },
                    { quoted: m }
                )
            } else if (media.type === 'image') {
                await sock.sendMessage(
                    m.chat,
                    {
                        image: { url: media.url },
                        caption,
                        footer: `© ${config.bot?.name}`
                    },
                    { quoted: m }
                )
            }
        }

        m.react('✅')

    } catch (error) {
        console.error('[PinDL] Error:', error)
        m.react('❌')
        m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
