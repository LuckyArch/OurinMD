const { pinterest } = require('btch-downloader')
const { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } = require('ourin')
const axios = require('axios')
const crypto = require('crypto')

const pluginConfig = {
    name: 'pins',
    alias: ['pinsearch', 'pinterestsearch'],
    category: 'search',
    description: 'Cari gambar di Pinterest (album)',
    usage: '.pins <query>',
    example: '.pins Zhao Lusi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const query = m.text?.trim()
    if (!query) {
        return m.reply(
            `🔍 *ᴘɪɴᴛᴇʀᴇsᴛ sᴇᴀʀᴄʜ*\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}pins Zhao Lusi\``
        )
    }

    m.react('🔍')

    try {
        const data = await pinterest(query)

        const results = data?.result?.result?.result?.slice(0, 5)
        if (!results || results.length === 0) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan hasil untuk: ${query}`)
        }

        const mediaList = []

        for (let i = 0; i < results.length; i++) {
            const item = results[i]
            const imageUrl =
                item.image_url ||
                item.images?.orig?.url ||
                item.images?.['736x']?.url

            if (!imageUrl) continue

            try {
                const res = await axios.get(imageUrl, {
                    responseType: 'arraybuffer',
                    timeout: 15000
                })

                const buffer = Buffer.from(res.data)

                mediaList.push({
                    image: buffer,
                    caption:
                        `📌 *ᴘɪɴᴛᴇʀᴇsᴛ* [${i + 1}/${results.length}]\n\n` +
                        `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                        `┃ 📛 Title: *${item.title || 'Pinterest'}*\n` +
                        `┃ 👤 Author: *${item.uploader?.full_name || '-'}*\n` +
                        `╰┈┈⬡\n\n` +
                        `> Query: ${query}`
                })
            } catch (e) {
                console.log('[Pins] Image error:', e.message)
            }
        }

        if (mediaList.length === 0) {
            m.react('❌')
            return m.reply('❌ Gagal memuat gambar')
        }

        m.react('📤')

        try {
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
                const msg = await generateWAMessage(opener.key.remoteJid, content, {
                    upload: sock.waUploadToServer
                })

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
            console.log('[Pins] Album gagal, kirim satu-satu:', err.message)

            for (const content of mediaList) {
                await sock.sendMessage(
                    m.chat,
                    content,
                    { quoted: m }
                )
            }

            m.react('✅')
        }

    } catch (err) {
        console.error('[Pins] Error:', err.message)
        m.react('❌')
        m.reply(`❌ *ERROR*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}