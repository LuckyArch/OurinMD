/**
 * @file plugins/sticker/swm.js
 * @description Plugin untuk mengganti packname dan author pada sticker
 */

const config = require('../../config')

const pluginConfig = {
    name: 'swm',
    alias: ['wm', 'stickerwm', 'stickermark', 'colong'],
    category: 'sticker',
    description: 'Mengganti packname dan author pada sticker',
    usage: '.swm <packname>|<author>',
    example: '.swm BotName|Author',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `🖼️ *sᴛɪᴄᴋᴇʀ ᴡᴀᴛᴇʀᴍᴀʀᴋ*\n\n` +
            `> Reply sticker dengan caption:\n` +
            `> \`${m.prefix}swm packname|author\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}swm Ourin-AI|LuckyArchz\`\n` +
            `> \`${m.prefix}swm BotKu\` _(hanya packname)_\n` +
            `> \`${m.prefix}swm |Author\` _(hanya author)_`
        )
    }
    
    const isSticker = quoted.type === 'stickerMessage' || quoted.isSticker
    if (!isSticker) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Reply pesan sticker, bukan ${quoted.type?.replace('Message', '') || 'media lain'}`)
    }
    
    const input = m.text?.trim()
    if (!input) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Masukkan packname dan/atau author\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}swm Ourin-AI|LuckyArchz\`\n` +
            `> \`${m.prefix}swm BotKu\` _(hanya packname)_`
        )
    }
    
    let packname, author
    
    if (input.includes('|')) {
        const parts = input.split('|')
        packname = parts[0]?.trim() || botConfig.sticker?.packname || botConfig.bot?.name || 'Ourin-AI'
        author = parts[1]?.trim() || botConfig.sticker?.author || botConfig.owner?.name || 'Bot'
    } else {
        packname = input
    }
    
    if (packname.length > 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Packname terlalu panjang (max 50 karakter)`)
    }
    
    if (author?.length > 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Author terlalu panjang (max 50 karakter)`)
    }
    
    m.react('⏳')
    
    try {
        const buffer = await quoted.download()
        
        if (!buffer || buffer.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mendownload sticker`)
        }
        
        const isAnimated = quoted.msg?.isAnimated || false
        
        if (isAnimated) {
            await sock.sendVideoAsSticker(m.chat, buffer, m, !author ? {
                packname,
            } : {
                packname,
                author
            })
        } else {
            await sock.sendImageAsSticker(m.chat, buffer, m, !author ? {
                packname,
            } : {
                packname,
                author
            })
        }
        
        m.react('✅')
        
    } catch (error) {
        console.error('[SWM] Error:', error.message)
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
