const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'apkmod',
    alias: ['modapk2', 'apkpremium'],
    category: 'search',
    description: 'Cari dan download APK MOD Premium',
    usage: '.apkmod <query>',
    example: '.apkmod vpn',
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
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `📱 *ᴀᴘᴋ ᴍᴏᴅ sᴇᴀʀᴄʜ*\n\n` +
            `> Cari APK MOD Premium\n\n` +
            `> Contoh:\n` +
            `\`${m.prefix}apkmod vpn\``
        )
    }
    
    m.react('🔍')
    
    try {
        const { data } = await axios.get(`https://api.neoxr.eu/api/apkmod?q=${encodeURIComponent(text)}&apikey=${NEOXR_APIKEY}`, {
            timeout: 30000
        })
        
        if (!data?.status || !data?.data?.length) {
            m.react('❌')
            return m.reply(`❌ Tidak ditemukan hasil untuk: \`${text}\``)
        }
        
        const apps = data.data.slice(0, 15)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        let caption = `📱 *ᴀᴘᴋ ᴍᴏᴅ sᴇᴀʀᴄʜ*\n\n`
        caption += `╭┈┈⬡「 🔍 *ʜᴀsɪʟ* 」\n`
        caption += `┃ Query: *${text}*\n`
        caption += `┃ Hasil: *${apps.length}* APK\n`
        caption += `╰┈┈⬡\n\n`
        
        apps.forEach((app, i) => {
            caption += `*${i + 1}.* \`${app.name}\`\n`
            caption += `   ├ 🏷️ ${app.version}\n`
            caption += `   └ 🔓 ${app.mod}\n\n`
        })
        
        caption += `> Reply dengan angka (1-${apps.length}) untuk detail + download`
        
        const buttons = apps.slice(0, 10).map((app, i) => ({
            title: `${i + 1}. ${app.name.substring(0, 24)}`,
            description: `${app.version} • ${app.mod}`,
            id: `${m.prefix}apkmod-get ${i + 1} ${text}`
        }))
        
        global.apkmodSession = global.apkmodSession || {}
        global.apkmodSession[m.sender] = {
            results: apps,
            query: text,
            timestamp: Date.now()
        }
        
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
                    title: '📱 Pilih APK MOD',
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
