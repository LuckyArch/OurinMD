const { getActiveJadibots } = require('../../src/lib/jadibotManager')
const config = require('../../config')
const timeHelper = require('../../src/lib/timeHelper')

const pluginConfig = {
    name: 'listjadibotaktif',
    alias: ['jadibotaktif', 'activejadibots'],
    category: 'owner',
    description: 'Lihat jadibot yang sedang aktif',
    usage: '.listjadibotaktif',
    example: '.listjadibotaktif',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
}

async function handler(m, { sock }) {
    const active = getActiveJadibots()
    
    if (active.length === 0) {
        return m.reply(`❌ Tidak ada jadibot yang aktif saat ini`)
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    let txt = `🟢 *ᴊᴀᴅɪʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n`
    txt += `> Total: *${active.length}* aktif\n\n`
    
    active.forEach((s, i) => {
        const uptime = formatUptime(Date.now() - s.startedAt)
        txt += `${i + 1}. @${s.id}\n`
        txt += `   ⏱️ Uptime: ${uptime}\n`
        txt += `   👤 Owner: @${s.ownerJid?.split('@')[0] || 'Unknown'}\n\n`
    })
    
    txt += `*ᴄᴏᴍᴍᴀɴᴅs:*\n`
    txt += `> \`${m.prefix}stopalljadibot\` - Stop semua`
    
    const mentions = active.flatMap(s => [s.jid, s.ownerJid].filter(Boolean))
    
    await sock.sendMessage(m.chat, {
        text: txt,
        mentions,
        contextInfo: {
            mentionedJid: mentions,
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

module.exports = {
    config: pluginConfig,
    handler
}
