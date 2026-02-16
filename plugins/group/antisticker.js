const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'antisticker',
    alias: ['as', 'nosticker'],
    category: 'group',
    description: 'Mengatur antisticker di grup',
    usage: '.antisticker <on/off>',
    example: '.antisticker on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function checkAntisticker(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false
    
    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.antisticker) return false
    
    const isSticker = m.isSticker || m.type === 'stickerMessage'
    if (!isSticker) return false
    
    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    await sock.sendMessage(m.chat, {
        text: `╭┈┈⬡「 🎭 *ᴀɴᴛɪsᴛɪᴄᴋᴇʀ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ᴛʏᴘᴇ: Sticker
┃ ㊗ ᴀᴄᴛɪᴏɴ: Dihapus
┃
╰┈┈⬡

> _Sticker tidak diperbolehkan di grup ini!_`,
        mentions: [m.sender],
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    })
    
    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    const groupData = db.getGroup(m.chat) || {}
    
    if (!action) {
        const status = groupData.antisticker ? '✅ ON' : '❌ OFF'
        
        await m.reply(
            `╭┈┈⬡「 🎭 *ᴀɴᴛɪsᴛɪᴄᴋᴇʀ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *${status}*
┃ ㊗ ᴍᴏᴅᴇ: Hapus pesan
┃
╰┈┈⬡

> *Cara Penggunaan:*
> \`.antisticker on\` → Aktifkan
> \`.antisticker off\` → Nonaktifkan

> _Blokir sticker di grup_`
        )
        return
    }
    
    if (action === 'on') {
        db.setGroup(m.chat, { antisticker: true })
        m.react('✅')
        await m.reply(
            `╭┈┈⬡「 🎭 *ᴀɴᴛɪsᴛɪᴄᴋᴇʀ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *✅ AKTIF*
┃ ㊗ ᴀᴄᴛɪᴏɴ: Hapus pesan
┃
╰┈┈⬡

> _Sticker akan dihapus otomatis!_`
        )
        return
    }
    
    if (action === 'off') {
        db.setGroup(m.chat, { antisticker: false })
        m.react('❌')
        await m.reply(
            `╭┈┈⬡「 🎭 *ᴀɴᴛɪsᴛɪᴄᴋᴇʀ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *❌ NONAKTIF*
┃
╰┈┈⬡`
        )
        return
    }
    
    await m.reply(`❌ Gunakan \`.antisticker on\` atau \`.antisticker off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    checkAntisticker
}
