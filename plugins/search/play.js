const yts = require("yt-search")
const axios = require("axios")
const config = require("../../config")

const pluginConfig = {
    name: "play",
    alias: ["playaudio"],
    category: "search",
    description: "Putar musik dari YouTube (Siputzx API)",
    usage: ".play <query>",
    example: ".play komang",
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, text }) {
    const query = m.text?.trim()
    if (!query) return m.reply(`🎵 *ᴘʟᴀʏ*\n\n> Contoh:\n\`${m.prefix}play komang\``)

    m.react("🎧")

    try {
        const search = await yts(query)
        if (!search.videos.length) throw "Video tidak ditemukan"
        
        const video = search.videos[0]
        const rows = search.videos?.map((v, i) => {
            return {
                header: v.title,
                title: v.author.name,
                description: `🌏 Klik untuk memutar musik ini`,
                id: `${m.prefix}putar-play ${v.url}`
            }
        })
        await sock.sendMessage(m.chat, {
            image: { url: video.thumbnail },
            caption: `🍀 *PLAY MUSIK*

Hallo *${m.pushName}*

Nampaknya kamu mau mendengarkan musik ini
- Judul : \`\`\`${video.title}\`\`\`
- Channel : *${video.author.name}*
- Durasi : *${video.duration}*

Mau putar lagu nya enggak? kalau mau tinggal tekan tombol "Putar" di bawah ini
`,
        footer: `${config.bot.name}`,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '🍕 PUTAR',
                    id: `${m.prefix}putar-play ${video.url}`
                })
            },
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: 'Musik semacamnya',
                    sections: [
                        {
                            title: 'List Musik yang hampir sama',
                            rows
                        }
                    ]
                })
            }
        ]
        }, { quoted: m })

        m.react("✅")

    } catch (err) {
        console.error('[Play]', err)
        m.react("❌")
        m.reply(`❌ *Error*: ${err.message || err}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
