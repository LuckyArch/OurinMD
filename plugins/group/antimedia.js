const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'antimedia',
    alias: ['am', 'nomedia'],
    category: 'group',
    description: 'Mengatur antimedia di grup (blokir gambar/video)',
    usage: '.antimedia <on/off>',
    example: '.antimedia on',
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

async function checkAntimedia(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false
    
    const groupData = db.getGroup(m.chat) || {}
    if (!groupData.antimedia) return false
    
    const isMedia = m.isImage || m.isVideo || m.isGif
    if (!isMedia) return false
    
    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    await sock.sendMessage(m.chat, {
        text: `╭┈┈⬡「 🖼️ *ᴀɴᴛɪᴍᴇᴅɪᴀ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ᴛʏᴘᴇ: Media (Image/Video)
┃ ㊗ ᴀᴄᴛɪᴏɴ: Dihapus
┃
╰┈┈⬡

> _Media tidak diperbolehkan di grup ini!_`,
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
        const status = groupData.antimedia ? '✅ ON' : '❌ OFF'
        
        await m.reply(
            `╭┈┈⬡「 🖼️ *ᴀɴᴛɪᴍᴇᴅɪᴀ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *${status}*
┃ ㊗ ᴍᴏᴅᴇ: Hapus pesan
┃
╰┈┈⬡

> *Cara Penggunaan:*
> \`.antimedia on\` → Aktifkan
> \`.antimedia off\` → Nonaktifkan

> _Blokir gambar & video di grup_`
        )
        return
    }
    
    if (action === 'on') {
        db.setGroup(m.chat, { antimedia: true })
        m.react('✅')
        await m.reply(
            `╭┈┈⬡「 🖼️ *ᴀɴᴛɪᴍᴇᴅɪᴀ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *✅ AKTIF*
┃ ㊗ ᴀᴄᴛɪᴏɴ: Hapus pesan
┃
╰┈┈⬡

> _Gambar & video akan dihapus otomatis!_`
        )
        return
    }
    
    if (action === 'off') {
        db.setGroup(m.chat, { antimedia: false })
        m.react('❌')
        await m.reply(
            `╭┈┈⬡「 🖼️ *ᴀɴᴛɪᴍᴇᴅɪᴀ* 」
┃
┃ ㊗ sᴛᴀᴛᴜs: *❌ NONAKTIF*
┃
╰┈┈⬡`
        )
        return
    }
    
    await m.reply(`❌ Gunakan \`.antimedia on\` atau \`.antimedia off\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    checkAntimedia
}
