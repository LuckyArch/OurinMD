const { getParticipantJids } = require('../../src/lib/lidHelper')

const pluginConfig = {
    name: ['ht', 'hidetag'],
    category: 'group',
    description: 'Hidetag dengan support reply pesan (teks/media)',
    usage: '.ht [pesan] atau reply pesan',
    example: '.ht atau reply pesan lalu .ht',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []
        const mentions = getParticipantJids(participants)

        const quoted = m.quoted
        const text = m.fullArgs?.trim()

        // ===== REPLY MODE =====
        if (quoted) {
            const qMsg = quoted.message || {}
            const type = Object.keys(qMsg)[0]

            // ===== IMAGE =====
            if (type === 'imageMessage') {
                const media = await quoted.download()
                const caption = qMsg.imageMessage?.caption || text || ''

                return sock.sendMessage(m.chat, {
                    image: media,
                    caption,
                    mentions
                })
            }

            // ===== VIDEO =====
            if (type === 'videoMessage') {
                const media = await quoted.download()
                const caption = qMsg.videoMessage?.caption || text || ''

                return sock.sendMessage(m.chat, {
                    video: media,
                    caption,
                    mentions
                })
            }

            // ===== STICKER =====
            if (type === 'stickerMessage') {
                const media = await quoted.download()

                await sock.sendMessage(m.chat, {
                    sticker: media,
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== AUDIO =====
            if (type === 'audioMessage') {
                const media = await quoted.download()
                const audioMsg = qMsg.audioMessage || {}

                await sock.sendMessage(m.chat, {
                    audio: media,
                    mimetype: audioMsg.mimetype,
                    ptt: audioMsg.ptt || false,
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== DOCUMENT =====
            if (type === 'documentMessage') {
                const media = await quoted.download()
                const docMsg = qMsg.documentMessage || {}

                await sock.sendMessage(m.chat, {
                    document: media,
                    mimetype: docMsg.mimetype,
                    fileName: docMsg.fileName || 'file',
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== TEXT / OTHER =====
            const quotedText =
                quoted.text ||
                qMsg.conversation ||
                qMsg.extendedTextMessage?.text ||
                ''

            const finalText = text || quotedText

            if (!finalText) {
                return m.reply('❌ *Pesan kosong*')
            }

            return sock.sendMessage(m.chat, {
                text: finalText,
                mentions
            })
        }
        if (!text) {
            return m.reply(
                `📢 *HIDETAG*\n\n` +
                `• Reply pesan lalu ketik \`${m.prefix}ht\`\n` +
                `• Atau ketik \`${m.prefix}ht <pesan>\`\n\n` +
                `Support: teks, gambar, video, sticker, audio, dokumen`
            )
        }

        await sock.sendMessage(m.chat, {
            text,
            mentions
        }, { quoted: m    })

    } catch (err) {
        await m.reply(`❌ *ERROR*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}