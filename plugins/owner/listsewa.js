const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'listsewa',
    alias: ['sewalist', 'daftarsewa'],
    category: 'owner',
    description: 'Lihat daftar grup yang terdaftar sewa',
    usage: '.listsewa',
    example: '.listsewa',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function formatCountdown(expiredAt) {
    const now = Date.now()
    const diff = expiredAt - now
    
    if (diff <= 0) return '❌ EXPIRED'
    
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    
    if (days > 0) {
        return `${days}d ${hours}h`
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`
    } else {
        return `${minutes}m`
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }
    
    const sewaGroups = db.db.data.sewa.groups || {}
    const groupIds = Object.keys(sewaGroups)
    
    if (groupIds.length === 0) {
        return m.reply(
            `📋 *ʟɪsᴛ sᴇᴡᴀ*\n\n` +
            `> Status: *${db.db.data.sewa.enabled ? 'AKTIF' : 'NONAKTIF'}*\n` +
            `> Tidak ada grup yang terdaftar\n\n` +
            `> Tambah dengan \`${m.prefix}addsewa <link> <durasi>\``
        )
    }
    
    let list = `📋 *ʟɪsᴛ sᴇᴡᴀ*\n\n`
    list += `> Status: *${db.db.data.sewa.enabled ? 'AKTIF' : 'NONAKTIF'}*\n`
    list += `> Total: *${groupIds.length}* grup\n\n`
    
    const sorted = groupIds.sort((a, b) => {
        return sewaGroups[a].expiredAt - sewaGroups[b].expiredAt
    })
    
    for (let i = 0; i < sorted.length; i++) {
        const gid = sorted[i]
        const data = sewaGroups[gid]
        const countdown = formatCountdown(data.expiredAt)
        const isExpired = data.expiredAt <= Date.now()
        
        list += `╭┈⬡ *${i + 1}. ${data.name || 'Unknown'}*\n`
        list += `┃ 🆔 \`${gid.split('@')[0]}\`\n`
        list += `┃ ⏱️ ${isExpired ? '❌ EXPIRED' : `Sisa: \`${countdown}\``}\n`
        list += `╰┈┈┈┈┈┈\n\n`
    }
    
    return m.reply(list)
}

module.exports = {
    config: pluginConfig,
    handler
}
