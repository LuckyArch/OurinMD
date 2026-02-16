const config = require('../../config')

const pluginConfig = {
    name: 'leave',
    alias: ['leavegrup', 'leavegroup', 'keluar', 'bye'],
    category: 'owner',
    description: 'Bot keluar dari grup',
    usage: '.leave [link]',
    example: '.leave',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function extractInviteCode(text) {
    const patterns = [
        /chat\.whatsapp\.com\/([a-zA-Z0-9]{20,})/i,
        /wa\.me\/([a-zA-Z0-9]{20,})/i
    ]
    
    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[1]
    }
    
    return null
}

async function handler(m, { sock }) {
    const input = m.args.join(' ').trim()
    
    let targetGroupJid = null
    let groupName = ''
    
    if (!input && m.isGroup) {
        targetGroupJid = m.chat
        try {
            const meta = await sock.groupMetadata(m.chat)
            groupName = meta.subject || 'Grup ini'
        } catch {
            groupName = 'Grup ini'
        }
    } else if (input) {
        const inviteCode = extractInviteCode(input)
        
        if (!inviteCode) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link invite tidak valid`)
        }
        
        try {
            const groupInfo = await sock.groupGetInviteInfo(inviteCode)
            targetGroupJid = groupInfo.id
            groupName = groupInfo.subject || 'Unknown'
        } catch (error) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengambil info grup dari link`)
        }
    } else {
        return m.reply(
            `🚪 *ʟᴇᴀᴠᴇ ɢʀᴜᴘ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Di grup: \`.leave\`\n` +
            `┃ ◦ Via link: \`.leave <link>\`\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh: ${m.prefix}leave https://chat.whatsapp.com/xxx\``
        )
    }
    
    if (!targetGroupJid) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Grup tidak ditemukan`)
    }
    
    m.react('⏳')
    
    try {
        global.sewaLeaving = true
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        if (m.isGroup && targetGroupJid === m.chat) {
            await sock.sendMessage(m.chat, {
                text: `👋 *ɢᴏᴏᴅʙʏᴇ*\n\n` +
                    `> Bot akan keluar dari grup ini.\n` +
                    `> Terima kasih sudah menggunakan bot!`,
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
        }
        
        await sock.groupLeave(targetGroupJid)
        
        global.sewaLeaving = false
        
        if (!m.isGroup || targetGroupJid !== m.chat) {
            m.react('✅')
            await m.reply(
                `✅ *ʙᴇʀʜᴀsɪʟ ᴋᴇʟᴜᴀʀ*\n\n` +
                `> Bot telah keluar dari: *${groupName}*`
            )
        }
        
    } catch (error) {
        global.sewaLeaving = false
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
