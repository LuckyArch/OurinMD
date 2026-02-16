const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'antilinkgc',
    alias: ['algc', 'antilinkgrup'],
    category: 'group',
    description: 'Anti link WhatsApp (grup, saluran, wa.me)',
    usage: '.antilinkgc <on/off/metode> [kick/remove]',
    example: '.antilinkgc on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

const WA_LINK_PATTERNS = [
    /chat\.whatsapp\.com\/[A-Za-z0-9]+/gi,
    /wa\.me\/[0-9+]+/gi,
    /whatsapp\.com\/channel\/[A-Za-z0-9]+/gi,
    /whatsapp\.com\/c\/[A-Za-z0-9]+/gi,
    /api\.whatsapp\.com\/send/gi
]

function containsWaLink(text) {
    if (!text || typeof text !== 'string') return { hasLink: false, link: null }
    
    for (const pattern of WA_LINK_PATTERNS) {
        const match = text.match(pattern)
        if (match && match.length > 0) {
            return { hasLink: true, link: match[0] }
        }
    }
    
    return { hasLink: false, link: null }
}

async function checkAntilinkGc(m, sock, db) {
    if (!m.isGroup) return false
    if (m.isAdmin || m.isOwner || m.fromMe) return false
    
    const groupData = db.getGroup(m.chat) || {}
    if (groupData.antilinkgc !== 'on') return false
    
    const body = m.body || m.text || ''
    const { hasLink, link } = containsWaLink(body)
    
    if (!hasLink) return false
    
    const mode = groupData.antilinkgcMode || 'remove'
    
    try {
        await sock.sendMessage(m.chat, { delete: m.key })
    } catch {}
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    if (mode === 'kick') {
        try {
            await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            
            await sock.sendMessage(m.chat, {
                text: `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ʟɪɴᴋ: \`${link}\`
┃ ㊗ ᴀᴄᴛɪᴏɴ: *KICKED*
┃
╰┈┈⬡

> _User dikeluarkan karena mengirim link WA!_`,
                mentions: [m.sender],
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName
                    }
                }
            })
        } catch {}
    } else {
        await sock.sendMessage(m.chat, {
            text: `╭┈┈⬡「 🔗 *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* 」
┃
┃ ㊗ ᴜsᴇʀ: @${m.sender.split('@')[0]}
┃ ㊗ ʟɪɴᴋ: \`${link}\`
┃ ㊗ ᴀᴄᴛɪᴏɴ: *DELETED*
┃
╰┈┈⬡

> _Pesan dihapus karena mengandung link WA!_`,
            mentions: [m.sender],
            contextInfo: {
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName
                }
            }
        })
    }
    
    return true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const option = m.text?.toLowerCase()?.trim()
    
    if (!option) {
        const groupData = db.getGroup(m.chat) || {}
        const status = groupData.antilinkgc || 'off'
        const mode = groupData.antilinkgcMode || 'remove'
        
        return m.reply(
            `🔗 *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ*\n\n` +
            `╭┈┈⬡「 📋 *sᴛᴀᴛᴜs* 」\n` +
            `┃ ◦ Status: *${status.toUpperCase()}*\n` +
            `┃ ◦ Mode: *${mode.toUpperCase()}*\n` +
            `╰┈┈⬡\n\n` +
            `*ᴅᴇᴛᴇᴋsɪ:*\n` +
            `> • chat.whatsapp.com (grup)\n` +
            `> • wa.me (kontak)\n` +
            `> • whatsapp.com/channel (saluran)\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}antilinkgc on\` - Aktifkan\n` +
            `> \`${m.prefix}antilinkgc off\` - Nonaktifkan\n` +
            `> \`${m.prefix}antilinkgc metode kick\` - Mode kick user\n` +
            `> \`${m.prefix}antilinkgc metode remove\` - Mode hapus pesan`
        )
    }
    
    if (option === 'on') {
        db.setGroup(m.chat, { antilinkgc: 'on' })
        return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* diaktifkan!\n\n> Link WA akan dihapus otomatis.`)
    }
    
    if (option === 'off') {
        db.setGroup(m.chat, { antilinkgc: 'off' })
        return m.reply(`❌ *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* dinonaktifkan!`)
    }
    
    if (option.startsWith('metode')) {
        const method = m.args?.[1]?.toLowerCase()
        if (method === 'kick') {
            db.setGroup(m.chat, { antilinkgc: 'on', antilinkgcMode: 'kick' })
            return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* mode KICK diaktifkan!\n\n> User yang kirim link WA akan di-kick.`)
        } else if (method === 'remove' || method === 'delete') {
            db.setGroup(m.chat, { antilinkgc: 'on', antilinkgcMode: 'remove' })
            return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* mode DELETE diaktifkan!\n\n> Pesan dengan link WA akan dihapus.`)
        } else {
            return m.reply(`❌ Metode tidak valid! Gunakan: \`kick\` atau \`remove\`\n\n> Contoh: \`${m.prefix}antilinkgc metode kick\``)
        }
    }
    
    if (option === 'kick') {
        db.setGroup(m.chat, { antilinkgc: 'on', antilinkgcMode: 'kick' })
        return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* mode KICK diaktifkan!\n\n> User yang kirim link WA akan di-kick.`)
    }
    
    if (option === 'remove' || option === 'delete') {
        db.setGroup(m.chat, { antilinkgc: 'on', antilinkgcMode: 'remove' })
        return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴡᴀ* mode DELETE diaktifkan!\n\n> Pesan dengan link WA akan dihapus.`)
    }
    
    return m.reply(`❌ Opsi tidak valid! Gunakan: \`on\`, \`off\`, \`metode kick\`, \`metode remove\``)
}

module.exports = {
    config: pluginConfig,
    handler,
    checkAntilinkGc
}
