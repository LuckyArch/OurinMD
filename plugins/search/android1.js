const axios = require('axios')
const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'android1',
    alias: ['an1'],
    category: 'search',
    description: 'Cari dan download APK MOD dari Android1',
    usage: '.android1 <query>',
    example: '.android1 Subway Surfer',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const NEOXR_APIKEY = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `📱 *ᴀɴᴅʀᴏɪᴅ1 sᴇᴀʀᴄʜ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ 🔍 \`${m.prefix}android1 <query>\` - Cari APK\n` +
            `╰┈┈⬡\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}android1 Subway Surfer\``
        )
    }
    
    m.react('🔍')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/an1?q=${encodeURIComponent(text)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan hasil untuk: \`${text}\``)
        }
        
        const apps = data.data.slice(0, 10)
        
        if (!db.db.data.sessions) db.db.data.sessions = {}
        const sessionKey = `an1_${m.sender}`
        db.db.data.sessions[sessionKey] = {
            results: apps,
            query: text,
            timestamp: Date.now()
        }
        db.save()
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        let caption = `📱 *ᴀɴᴅʀᴏɪᴅ1 sᴇᴀʀᴄʜ*\n\n`
        caption += `> Query: *${text}*\n`
        caption += `> Hasil: *${apps.length}* aplikasi\n\n`
        
        apps.forEach((app, i) => {
            caption += `*${i + 1}.* \`${app.name}\`\n`
            caption += `   ├ 👤 ${app.developer}\n`
            caption += `   └ ⭐ ${app.rating}/5\n\n`
        })
        
        caption += `> Pilih angka untuk download langsung`
        
        const buttons = apps.slice(0, 10).map((app, i) => ({
            title: `${i + 1}. ${app.name.substring(0, 20)}`,
            description: `${app.developer} • ⭐${app.rating}`,
            id: `${m.prefix}android1-get ${app.url}`
        }))
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            },
            interactiveButtons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📱 Pilih APK',
                    sections: [{
                        title: `Hasil untuk "${text}"`,
                        rows: buttons
                    }]
                })
            }]
        }, { quoted: m })
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
