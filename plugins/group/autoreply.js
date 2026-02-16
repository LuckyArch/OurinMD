const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'autoreply',
    alias: ['smarttrigger', 'smarttriggers', 'ar'],
    category: 'group',
    description: 'Mengatur autoreply/smart triggers per grup',
    usage: '.autoreply on/off/add/del/list/private',
    example: '.autoreply on',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true,
    isAdmin: false,
    isBotAdmin: false
}

const AUTOREPLY_MEDIA_DIR = path.join(process.cwd(), 'database', 'autoreply_media')

if (!fs.existsSync(AUTOREPLY_MEDIA_DIR)) {
    fs.mkdirSync(AUTOREPLY_MEDIA_DIR, { recursive: true })
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    const privateAutoreply = db.setting('autoreplyPrivate') ?? false
    
    if (action === 'private') {
        if (!m.isOwner) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Hanya owner yang bisa mengatur autoreply private!`)
        }
        
        const subAction = args[1]?.toLowerCase()
        
        if (subAction === 'on') {
            db.setting('autoreplyPrivate', true)
            m.react('✅')
            return m.reply(`✅ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴘʀɪᴠᴀᴛᴇ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot akan merespon otomatis di private chat`)
        }
        
        if (subAction === 'off') {
            db.setting('autoreplyPrivate', false)
            m.react('❌')
            return m.reply(`❌ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴘʀɪᴠᴀᴛᴇ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot tidak akan merespon otomatis di private chat`)
        }
        
        const currentStatus = db.setting('autoreplyPrivate') ?? false
        return m.reply(
            `📱 *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴘʀɪᴠᴀᴛᴇ*\n\n` +
            `> Status: \`${currentStatus ? 'ON ✅' : 'OFF ❌'}\`\n\n` +
            `> \`${m.prefix}autoreply private on\` - Aktifkan\n` +
            `> \`${m.prefix}autoreply private off\` - Nonaktifkan`
        )
    }
    
    if (action === 'global') {
        if (!m.isOwner) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Hanya owner yang bisa mengatur global autoreply!`)
        }
        
        const subAction = args[1]?.toLowerCase()
        const globalCustomReplies = db.setting('globalCustomReplies') || []
        
        if (subAction === 'add') {
            const fullBody = m.body || ''
            const pipeIdx = fullBody.indexOf('|')
            if (pipeIdx === -1) {
                return m.reply(
                    `❌ *ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ*\n\n` +
                    `> Gunakan format: \`trigger|reply\`\n\n` +
                    `> Contoh:\n` +
                    `> \`${m.prefix}autoreply global add halo|Hai {name}!\``
                )
            }
            
            const triggerStart = fullBody.toLowerCase().indexOf('global add ') + 'global add '.length
            const triggerEnd = pipeIdx
            const trigger = fullBody.substring(triggerStart, triggerEnd).trim()
            const reply = fullBody.substring(pipeIdx + 1)
            
            if (!trigger.trim() || !reply) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Trigger dan reply tidak boleh kosong!`)
            }
            
            const existingIndex = globalCustomReplies.findIndex(r => r.trigger.toLowerCase() === trigger.trim().toLowerCase())
            if (existingIndex !== -1) {
                globalCustomReplies[existingIndex].reply = reply
            } else {
                globalCustomReplies.push({ trigger: trigger.trim().toLowerCase(), reply: reply })
            }
            
            db.setting('globalCustomReplies', globalCustomReplies)
            await db.save()
            
            m.react('✅')
            return m.reply(
                `✅ *ɢʟᴏʙᴀʟ ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                `> Trigger: \`${trigger.trim()}\`\n` +
                `> Total: \`${globalCustomReplies.length}\` replies\n\n` +
                `> _Aktif di private chat_`
            )
        }
        
        if (subAction === 'del' || subAction === 'rm') {
            const trigger = args.slice(2).join(' ').toLowerCase().trim()
            if (!trigger) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Masukkan trigger yang mau dihapus!`)
            }
            
            const index = globalCustomReplies.findIndex(r => r.trigger === trigger)
            if (index === -1) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Trigger \`${trigger}\` tidak ditemukan!`)
            }
            
            globalCustomReplies.splice(index, 1)
            db.setting('globalCustomReplies', globalCustomReplies)
            await db.save()
            
            m.react('🗑️')
            return m.reply(`🗑️ *ɢʟᴏʙᴀʟ ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪʜᴀᴘᴜs*\n\n> Trigger \`${trigger}\` berhasil dihapus!`)
        }
        
        if (subAction === 'list' || !subAction) {
            if (globalCustomReplies.length === 0) {
                return m.reply(
                    `📋 *ɢʟᴏʙᴀʟ ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n` +
                    `> Belum ada global custom trigger\n\n` +
                    `> \`${m.prefix}autoreply global add trigger|reply\``
                )
            }
            
            let text = `📋 *ɢʟᴏʙᴀʟ ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n`
            text += `> _Aktif di private chat_\n\n`
            globalCustomReplies.forEach((r, i) => {
                const hasImage = r.image ? '🖼️' : ''
                text += `${i + 1}. \`${r.trigger}\` ${hasImage}\n   → ${r.reply.substring(0, 30)}${r.reply.length > 30 ? '...' : ''}\n`
            })
            return m.reply(text)
        }
        
        return m.reply(
            `📱 *ɢʟᴏʙᴀʟ ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n` +
            `> \`${m.prefix}autoreply global add trigger|reply\`\n` +
            `> \`${m.prefix}autoreply global del trigger\`\n` +
            `> \`${m.prefix}autoreply global list\``
        )
    }
    
    if (!m.isGroup) {
        return m.reply(
            `📱 *ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n` +
            `> Autoreply Private: \`${privateAutoreply ? 'ON ✅' : 'OFF ❌'}\`\n\n` +
            `> \`${m.prefix}autoreply private on/off\` - Toggle private\n` +
            `> \`${m.prefix}autoreply global add/del/list\` - Global triggers\n\n` +
            `_Untuk setting trigger per grup, jalankan di grup_`
        )
    }
    
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Hanya admin yang bisa mengatur autoreply di grup!`)
    }
    
    const groupData = db.getGroup(m.chat) || {}
    const globalSmartTriggers = db.setting('smartTriggers') ?? config.features?.smartTriggers ?? false
    
    if (!action || action === 'status') {
        const groupStatus = groupData.autoreply
        const effectiveStatus = groupStatus ?? globalSmartTriggers
        const customReplies = groupData.customReplies || []
        
        let text = `🤖 *ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n`
        text += `╭┈┈⬡「 📋 *sᴛᴀᴛᴜs* 」\n`
        text += `┃ 🌐 ɢʟᴏʙᴀʟ: \`${globalSmartTriggers ? 'ON ✅' : 'OFF ❌'}\`\n`
        text += `┃ 👥 ɢʀᴜᴘ: \`${groupStatus === undefined ? 'DEFAULT' : (groupStatus ? 'ON ✅' : 'OFF ❌')}\`\n`
        text += `┃ 📱 ᴘʀɪᴠᴀᴛᴇ: \`${privateAutoreply ? 'ON ✅' : 'OFF ❌'}\`\n`
        text += `┃ ⚡ ᴇꜰꜰᴇᴄᴛɪᴠᴇ: \`${effectiveStatus ? 'ON ✅' : 'OFF ❌'}\`\n`
        text += `┃ 📝 ᴄᴜsᴛᴏᴍ: \`${customReplies.length}\` replies\n`
        text += `╰┈┈⬡\n\n`
        text += `> *Cara pakai:*\n`
        text += `> \`${m.prefix}autoreply on\` - Aktifkan di grup\n`
        text += `> \`${m.prefix}autoreply off\` - Nonaktifkan di grup\n`
        text += `> \`${m.prefix}autoreply add <trigger>|<reply>\`\n`
        text += `> \`${m.prefix}autoreply del <trigger>\`\n`
        text += `> \`${m.prefix}autoreply list\`\n\n`
        text += `> *Image Support:*\n`
        text += `> Reply gambar + \`${m.prefix}ar add trigger|caption\`\n`
        text += `> Atau kirim gambar + caption: \`${m.prefix}ar add trigger|caption\``
        
        return m.reply(text)
    }
    
    if (action === 'on') {
        db.setGroup(m.chat, { ...groupData, autoreply: true })
        m.react('✅')
        return m.reply(`✅ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot akan merespon otomatis di grup ini`)
    }
    
    if (action === 'off') {
        db.setGroup(m.chat, { ...groupData, autoreply: false })
        m.react('❌')
        return m.reply(`❌ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot tidak akan merespon otomatis di grup ini`)
    }
    
    if (action === 'add') {
        const fullBody = m.body || ''
        const pipeIdx = fullBody.indexOf('|')
        
        if (pipeIdx === -1) {
            return m.reply(
                `❌ *ꜰᴏʀᴍᴀᴛ sᴀʟᴀʜ*\n\n` +
                `> Gunakan format: \`trigger|reply\`\n\n` +
                `> *Text Only:*\n` +
                `> \`${m.prefix}ar add halo|Hai {name}! 👋\`\n\n` +
                `> *Dengan Gambar:*\n` +
                `> 1. Reply gambar + \`${m.prefix}ar add trigger|caption\`\n` +
                `> 2. Kirim gambar + caption \`${m.prefix}ar add trigger|caption\`\n\n` +
                `> *Placeholder:*\n` +
                `> \`{name}\` - Nama user\n` +
                `> \`{tag}\` - Tag @user\n` +
                `> \`{sender}\` - Nomor user\n` +
                `> \`{botname}\` - Nama bot\n` +
                `> \`{time}\` - Waktu sekarang\n` +
                `> \`{date}\` - Tanggal sekarang`
            )
        }
        
        const addIdx = fullBody.toLowerCase().indexOf('add ')
        const triggerStart = addIdx + 'add '.length
        const trigger = fullBody.substring(triggerStart, pipeIdx).trim()
        const reply = fullBody.substring(pipeIdx + 1)
        
        if (!trigger) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Trigger tidak boleh kosong!`)
        }
        
        let imageBuffer = null
        let imagePath = null
        
        const hasQuotedImage = m.quoted && (m.quoted.mtype === 'imageMessage' || m.quoted.type === 'image')
        const hasDirectImage = m.mtype === 'imageMessage' || m.type === 'image'
        
        if (hasQuotedImage) {
            try {
                imageBuffer = await m.quoted.download()
            } catch (e) {
                console.error('[Autoreply] Failed to download quoted image:', e.message)
            }
        } else if (hasDirectImage) {
            try {
                imageBuffer = await m.download()
            } catch (e) {
                console.error('[Autoreply] Failed to download direct image:', e.message)
            }
        }
        
        if (imageBuffer) {
            const filename = `${m.chat.replace('@g.us', '')}_${trigger.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`
            imagePath = path.join(AUTOREPLY_MEDIA_DIR, filename)
            fs.writeFileSync(imagePath, imageBuffer)
        }
        
        const customReplies = groupData.customReplies || []
        const existingIndex = customReplies.findIndex(r => r.trigger.toLowerCase() === trigger.toLowerCase())
        
        const replyData = {
            trigger: trigger.toLowerCase(),
            reply: reply || '',
            image: imagePath || null,
            createdAt: Date.now()
        }
        
        if (existingIndex !== -1) {
            if (customReplies[existingIndex].image && customReplies[existingIndex].image !== imagePath) {
                try {
                    if (fs.existsSync(customReplies[existingIndex].image)) {
                        fs.unlinkSync(customReplies[existingIndex].image)
                    }
                } catch {}
            }
            customReplies[existingIndex] = replyData
        } else {
            customReplies.push(replyData)
        }
        
        db.setGroup(m.chat, { ...groupData, customReplies })
        
        m.react('✅')
        
        let successMsg = `✅ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n`
        successMsg += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
        successMsg += `┃ 🎯 ᴛʀɪɢɢᴇʀ: \`${trigger.trim()}\`\n`
        if (reply) {
            successMsg += `┃ 💬 ʀᴇᴘʟʏ: \`${reply.substring(0, 50)}${reply.length > 50 ? '...' : ''}\`\n`
        }
        if (imagePath) {
            successMsg += `┃ 🖼️ ɪᴍᴀɢᴇ: ✅ Tersimpan\n`
        }
        successMsg += `┃ 📊 ᴛᴏᴛᴀʟ: \`${customReplies.length}\` replies\n`
        successMsg += `╰┈┈⬡`
        
        return m.reply(successMsg)
    }
    
    if (action === 'del' || action === 'rm' || action === 'remove') {
        const trigger = args.slice(1).join(' ').toLowerCase().trim()
        
        if (!trigger) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Masukkan trigger yang mau dihapus!\n\n\`${m.prefix}autoreply del halo\``)
        }
        
        const customReplies = groupData.customReplies || []
        const index = customReplies.findIndex(r => r.trigger === trigger)
        
        if (index === -1) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Trigger \`${trigger}\` tidak ditemukan!`)
        }
        
        if (customReplies[index].image) {
            try {
                if (fs.existsSync(customReplies[index].image)) {
                    fs.unlinkSync(customReplies[index].image)
                }
            } catch {}
        }
        
        customReplies.splice(index, 1)
        db.setGroup(m.chat, { ...groupData, customReplies })
        
        m.react('🗑️')
        return m.reply(
            `🗑️ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Trigger \`${trigger}\` berhasil dihapus!\n` +
            `> Sisa: \`${customReplies.length}\` replies`
        )
    }
    
    if (action === 'list') {
        const customReplies = groupData.customReplies || []
        
        const defaultTriggers = [
            { trigger: '@mention', reply: '👋 Hai! Ada yang manggil bot?' },
            { trigger: 'p', reply: '💬 Budayakan salam sebelum percakapan!' },
            { trigger: 'bot / ourin', reply: '🤖 Bot aktif dan siap!' },
            { trigger: 'assalamualaikum', reply: 'Waalaikumsalam saudaraku' }
        ]
        
        let text = `📋 *ᴅᴀꜰᴛᴀʀ ᴀᴜᴛᴏʀᴇᴘʟʏ*\n\n`
        
        text += `╭┈┈⬡「 🔧 *ᴅᴇꜰᴀᴜʟᴛ ᴛʀɪɢɢᴇʀs* 」\n`
        defaultTriggers.forEach((r, i) => {
            text += `┃ ${i + 1}. \`${r.trigger}\`\n`
            text += `┃    → ${r.reply}\n`
        })
        text += `╰┈┈⬡\n\n`
        
        if (customReplies.length > 0) {
            text += `╭┈┈⬡「 📝 *ᴄᴜsᴛᴏᴍ ᴛʀɪɢɢᴇʀs* 」\n`
            customReplies.forEach((r, i) => {
                const hasImage = r.image ? ' 🖼️' : ''
                text += `┃ ${i + 1}. \`${r.trigger}\`${hasImage}\n`
                if (r.reply) {
                    text += `┃    → ${r.reply.substring(0, 35)}${r.reply.length > 35 ? '...' : ''}\n`
                }
            })
            text += `╰┈┈⬡\n\n`
        } else {
            text += `> Belum ada custom trigger\n`
            text += `> \`${m.prefix}autoreply add trigger|reply\`\n\n`
        }
        
        text += `> _Default triggers tidak bisa di-edit_`
        
        return m.reply(text)
    }
    
    if (action === 'reset' || action === 'clear') {
        const customReplies = groupData.customReplies || []
        for (const r of customReplies) {
            if (r.image) {
                try {
                    if (fs.existsSync(r.image)) fs.unlinkSync(r.image)
                } catch {}
            }
        }
        
        db.setGroup(m.chat, { ...groupData, customReplies: [] })
        m.react('🗑️')
        return m.reply(`🗑️ *ᴀᴜᴛᴏʀᴇᴘʟʏ ᴅɪʀᴇsᴇᴛ*\n\n> Semua autoreply custom dihapus!`)
    }
    
    return m.reply(`❌ *ᴀᴄᴛɪᴏɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Gunakan: \`on\`, \`off\`, \`private on/off\`, \`add\`, \`del\`, \`list\`, \`reset\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
