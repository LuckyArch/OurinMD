const config = require('../../config')

function calculateLevel(exp) {
    return Math.floor(exp / 20000) + 1
}

function expForLevel(level) {
    return (level - 1) * 20000
}

function getRole(level) {
    if (level >= 100) return '🐉 Mythic'
    if (level >= 80) return '⚔️ Legend'
    if (level >= 60) return '💜 Epic'
    if (level >= 40) return '💪 Grandmaster'
    if (level >= 20) return '🎖️ Master'
    if (level >= 10) return '⭐ Elite'
    return '🛡️ Warrior'
}

async function checkAndNotifyLevelUp(sock, m, db, user, oldExp, newExp) {
    const oldLevel = calculateLevel(oldExp)
    const newLevel = calculateLevel(newExp)
    
    if (newLevel > oldLevel) {
        user.rpg.level = newLevel
        user.rpg.maxHealth = 100 + (newLevel - 1) * 10
        user.rpg.maxMana = 100 + (newLevel - 1) * 5
        user.rpg.maxStamina = 100 + (newLevel - 1) * 5
        user.rpg.health = user.rpg.maxHealth
        user.rpg.mana = user.rpg.maxMana
        user.rpg.stamina = user.rpg.maxStamina
        
        db.save()
        
        if (user.settings?.levelupNotif === false) {
            return { leveledUp: true, notified: false, oldLevel, newLevel }
        }
        
        const role = getRole(newLevel)
        const botName = config.bot?.name || 'Ourin-AI'
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || botName
        
        let ppBuffer = null
        try {
            const ppUrl = await sock.profilePictureUrl(m.sender, 'image')
            if (ppUrl) {
                const axios = require('axios')
                const res = await axios.get(ppUrl, { responseType: 'arraybuffer' })
                ppBuffer = res.data
            }
        } catch {}
        
        const txt = `🎊 *ʟᴇᴠᴇʟ ᴜᴘ!*\n\n` +
            `╭━━━━━━━━━━━━━━━━━╮\n` +
            `┃ 🏆 *ᴄᴏɴɢʀᴀᴛᴜʟᴀᴛɪᴏɴs!*\n` +
            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
            `> 👤 @${m.sender.split('@')[0]}\n` +
            `> 📊 Level: *${oldLevel} → ${newLevel}*\n` +
            `> ${role}\n\n` +
            `╭┈┈⬡「 📈 *ɴᴇᴡ sᴛᴀᴛs* 」\n` +
            `┃ ❤️ Max HP: *${user.rpg.maxHealth}*\n` +
            `┃ 💧 Max MP: *${user.rpg.maxMana}*\n` +
            `┃ ⚡ Max SP: *${user.rpg.maxStamina}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> _All stats fully restored!_ ✨`
        
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
        
        if (ppBuffer) {
            contextInfo.externalAdReply = {
                title: `🎊 LEVEL UP!`,
                body: `${m.pushName || 'User'} naik ke Level ${newLevel}`,
                thumbnail: ppBuffer,
                mediaType: 1,
                renderLargerThumbnail: true,
                sourceUrl: config.saluran?.link || ''
            }
        }
        
        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: '0@s.whatsapp.net',
                remoteJid: 'status@broadcast'
            },
            message: {
                contactMessage: {
                    displayName: `✅ ${botName}`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${botName}\nORG:Verified Bot\nEND:VCARD`
                }
            }
        }
        
        await sock.sendMessage(m.chat, {
            text: txt,
            contextInfo
        }, { quoted: fakeQuoted })
        
        return { leveledUp: true, notified: true, oldLevel, newLevel }
    }
    
    return { leveledUp: false, notified: false, oldLevel, newLevel: oldLevel }
}

async function addExpWithLevelCheck(sock, m, db, user, expAmount) {
    if (!user) return { leveledUp: false, notified: false, oldLevel: 1, newLevel: 1 }
    if (!user.rpg) user.rpg = {}
    
    const oldExp = user.exp || 0
    const newExp = db.updateExp(m.sender, expAmount)
    user.exp = newExp
    
    const result = await checkAndNotifyLevelUp(sock, m, db, user, oldExp, newExp)
    
    db.setUser(m.sender, { rpg: user.rpg })
    
    return result
}

module.exports = {
    calculateLevel,
    expForLevel,
    getRole,
    checkAndNotifyLevelUp,
    addExpWithLevelCheck
}
