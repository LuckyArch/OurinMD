const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'blautojpm',
    alias: ['blacklistautojpm', 'autojpmbl'],
    category: 'jpm',
    description: 'Blacklist grup dari Auto JPM',
    usage: '.blautojpm <add/del/list>',
    example: '.blautojpm add',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = (args[0] || '').toLowerCase()
    
    let blacklist = db.setting('autoJpmBlacklist') || []
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (!action || action === 'list') {
        if (blacklist.length === 0) {
            return m.reply(
                `📋 *ʙʟᴀᴄᴋʟɪsᴛ ᴀᴜᴛᴏ ᴊᴘᴍ*\n\n` +
                `> Belum ada grup yang di-blacklist\n\n` +
                `*ᴜsᴀɢᴇ:*\n` +
                `> \`${m.prefix}blautojpm add\` - Blacklist grup ini\n` +
                `> \`${m.prefix}blautojpm del\` - Hapus dari blacklist`
            )
        }
        
        let txt = `📋 *ʙʟᴀᴄᴋʟɪsᴛ ᴀᴜᴛᴏ ᴊᴘᴍ*\n\n`
        txt += `> Total: *${blacklist.length}* grup\n\n`
        
        const isThisBlacklisted = blacklist.includes(m.chat)
        txt += `> Grup ini: *${isThisBlacklisted ? '✅ Blacklisted' : '❌ Tidak'}*\n\n`
        txt += `*ᴜsᴀɢᴇ:*\n`
        txt += `> \`${m.prefix}blautojpm add\` - Blacklist grup ini\n`
        txt += `> \`${m.prefix}blautojpm del\` - Hapus dari blacklist`
        
        return m.reply(txt)
    }
    
    if (action === 'add') {
        if (blacklist.includes(m.chat)) {
            return m.reply(`❌ Grup ini sudah ada di blacklist Auto JPM`)
        }
        
        blacklist.push(m.chat)
        db.setting('autoJpmBlacklist', blacklist)
        await db.save()
        
        m.react('✅')
        return sock.sendMessage(m.chat, {
            text: `✅ *ʙʟᴀᴄᴋʟɪsᴛᴇᴅ*\n\n` +
                `Grup ini tidak akan menerima Auto JPM.\n\n` +
                `> Total blacklist: *${blacklist.length}* grup`,
            contextInfo
        }, { quoted: m })
    }
    
    if (action === 'del' || action === 'remove' || action === 'hapus') {
        if (!blacklist.includes(m.chat)) {
            return m.reply(`❌ Grup ini tidak ada di blacklist Auto JPM`)
        }
        
        blacklist = blacklist.filter(id => id !== m.chat)
        db.setting('autoJpmBlacklist', blacklist)
        await db.save()
        
        m.react('✅')
        return sock.sendMessage(m.chat, {
            text: `✅ *ᴜɴʙʟᴀᴄᴋʟɪsᴛᴇᴅ*\n\n` +
                `Grup ini akan menerima Auto JPM lagi.\n\n` +
                `> Total blacklist: *${blacklist.length}* grup`,
            contextInfo
        }, { quoted: m })
    }
    
    return m.reply(`❌ Action tidak valid. Gunakan: \`add\`, \`del\`, atau \`list\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
