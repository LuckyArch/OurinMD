const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'banchat',
    alias: ['bangroup', 'bangrup', 'unbanchat', 'unbangroup'],
    category: 'group',
    description: 'Ban grup dari penggunaan bot (hanya owner yang bisa akses)',
    usage: '.banchat',
    example: '.banchat',
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
    const cmd = m.command.toLowerCase()
    const isUnban = ['unbanchat', 'unbangroup'].includes(cmd)
    
    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const groupName = groupMeta.subject || 'Unknown'
        const groupData = db.getGroup(m.chat) || {}
        
        if (isUnban) {
            if (!groupData.isBanned) {
                return m.reply(
                    `⚠️ *ɢʀᴜᴘ ᴛɪᴅᴀᴋ ᴅɪʙᴀɴ*\n\n` +
                    `> Grup ini tidak dalam status banned.\n` +
                    `> Semua user bisa menggunakan bot.`
                )
            }
            
            db.setGroup(m.chat, { ...groupData, isBanned: false })
            
            return sock.sendMessage(m.chat, {
                text: `✅ *ɢʀᴜᴘ ᴅɪ-ᴜɴʙᴀɴ*\n\n` +
                    `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                    `┃ 📛 ɢʀᴜᴘ: *${groupName}*\n` +
                    `┃ 📊 sᴛᴀᴛᴜs: *✅ AKTIF*\n` +
                    `┃ 👤 ᴜɴʙᴀɴ ᴏʟᴇʜ: @${m.sender.split('@')[0]}\n` +
                    `╰┈┈⬡\n\n` +
                    `> Semua member sekarang bisa menggunakan bot kembali.`,
                mentions: [m.sender]
            }, { quoted: m })
        }
        
        if (groupData.isBanned) {
            return m.reply(
                `⚠️ *ɢʀᴜᴘ sᴜᴅᴀʜ ᴅɪʙᴀɴ*\n\n` +
                `> Grup ini sudah dalam status banned.\n` +
                `> Gunakan \`.unbanchat\` untuk membuka akses.`
            )
        }
        
        db.setGroup(m.chat, { ...groupData, isBanned: true })
        
        await sock.sendMessage(m.chat, {
            text: `🚫 *ɢʀᴜᴘ ᴅɪʙᴀɴ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📛 ɢʀᴜᴘ: *${groupName}*\n` +
                `┃ 📊 sᴛᴀᴛᴜs: *🔴 BANNED*\n` +
                `┃ 👤 ʙᴀɴ ᴏʟᴇʜ: @${m.sender.split('@')[0]}\n` +
                `╰┈┈⬡\n\n` +
                `> Member biasa tidak bisa menggunakan bot di grup ini.\n` +
                `> Hanya owner yang bisa menggunakan bot.`,
            mentions: [m.sender]
        }, { quoted: m })
        
    } catch (error) {
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
