const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'slowmode',
    alias: ['slow', 'setslowmode'],
    category: 'group',
    description: 'Mengaktifkan slowmode grup',
    usage: '.slowmode <on/off> [detik]',
    example: '.slowmode on 30',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const lastMessageTime = new Map()
async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const subCmd = args[0]?.toLowerCase()
    
    let groupData = db.getGroup(m.chat) || {}
    
    if (!subCmd) {
        const status = groupData.slowmode?.enabled ? '✅ ON' : '❌ OFF'
        const delay = groupData.slowmode?.delay || 30
        
        let txt = `🐢 *sʟᴏᴡᴍᴏᴅᴇ*\n\n`
        txt += `> Status: *${status}*\n`
        txt += `> Delay: *${delay} detik*\n\n`
        txt += `\`\`\`━━━ ᴘᴀɴᴅᴜᴀɴ ━━━\`\`\`\n`
        txt += `> ◦ \`${m.prefix}slowmode on 30\` - Delay 30 detik\n`
        txt += `> ◦ \`${m.prefix}slowmode off\` - Nonaktifkan`
        
        await m.reply(txt)
        return
    }
    
    if (subCmd === 'on') {
        const delay = parseInt(args[1]) || 30
        
        if (delay < 5 || delay > 300) {
            await m.reply(`⚠️ Delay harus 5-300 detik.`)
            return
        }
        
        db.setGroup(m.chat, {
            ...groupData,
            slowmode: {
                enabled: true,
                delay: delay
            }
        })
        
        await m.reply(
            `✅ *sʟᴏᴡᴍᴏᴅᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Delay: *${delay} detik*\n` +
            `> User hanya bisa kirim 1 pesan per ${delay} detik.\n\n` +
            `_Admin tidak terpengaruh slowmode._`
        )
        return
    }
    
    if (subCmd === 'off') {
        db.setGroup(m.chat, {
            ...groupData,
            slowmode: { enabled: false }
        })
        
        await m.reply(`❌ Slowmode *dinonaktifkan*!`)
        return
    }
    
    await m.reply(`❌ Gunakan \`${m.prefix}slowmode on 30\` atau \`${m.prefix}slowmode off\``)
}
function checkSlowmode(m, sock, db) {
    if (!m.isGroup) return false
    
    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.slowmode?.enabled) return false
    
    const delay = groupData.slowmode?.delay || 30
    const key = `${m.chat}_${m.sender}`
    const now = Date.now()
    
    const lastTime = lastMessageTime.get(key) || 0
    const timePassed = (now - lastTime) / 1000
    
    if (timePassed < delay) {
        const remaining = Math.ceil(delay - timePassed)
        return remaining
    }
    
    lastMessageTime.set(key, now)
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    checkSlowmode
}
