const config = require('../../config')
const { getCommandsByCategory, getCategories } = require('../../src/lib/plugins')
const { getDatabase } = require('../../src/lib/database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'menucat',
    alias: ['mc', 'category', 'cat'],
    category: 'main',
    description: 'Menampilkan commands dalam kategori tertentu',
    usage: '.menucat <kategori>',
    example: '.menucat tools',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const CATEGORY_EMOJIS = {
    owner: '👑', main: '🏠', utility: '🔧', fun: '🎮', group: '👥',
    download: '📥', search: '🔍', tools: '🛠️', sticker: '🖼️',
    ai: '🤖', game: '🎯', media: '🎬', info: 'ℹ️', religi: '☪️',
    panel: '🖥️', user: '📊', jpm: '📢', pushkontak: '📱', ephoto: '🎨',
    store: '🛒'
}

function toMonoUpperBold(text) {
    const chars = {
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
    }
    return text.toUpperCase().split('').map(c => chars[c] || c).join('')
}

function toSmallCaps(text) {
    const smallCaps = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ꜰ', 'g': 'ɢ',
        'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ',
        'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ',
        'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    }
    return text.toLowerCase().split('').map(c => smallCaps[c] || c).join('')
}

let cachedThumb = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin2.jpg')
    if (fs.existsSync(thumbPath)) cachedThumb = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo() {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    const botName = config.bot?.name || 'Ourin-AI'
    
    return {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        },
        externalAdReply: {
            title: `Kategori Menu`,
            body: botName,
            sourceUrl: config.saluran?.link || '',
            mediaType: 1,
            renderLargerThumbnail: false,
            thumbnail: cachedThumb
        }
    }
}

async function handler(m, { sock }) {
    const prefix = config.command?.prefix || '.'
    const args = m.args || []
    const categoryArg = args[0]?.toLowerCase()
    
    const categories = getCategories()
    const commandsByCategory = getCommandsByCategory()
    
    const { getCasesByCategory } = require('../../case/ourin')
    const casesByCategory = getCasesByCategory()
    
    if (!categoryArg) {
        const db = getDatabase()
        const groupData = m.isGroup ? (db.getGroup(m.chat) || {}) : {}
        const botMode = groupData.botMode || 'md'
        
        let modeExcludeMap = {
            md: ['panel', 'pushkontak', 'store'],
            store: ['panel', 'pushkontak', 'jpm', 'ephoto', 'cpanel'],
            pushkontak: ['panel', 'store', 'jpm', 'ephoto', 'cpanel'],
            cpanel: ['pushkontak', 'store', 'jpm', 'ephoto']
        }
        
        try {
            const botmodePlugin = require('../group/botmode')
            if (botmodePlugin && botmodePlugin.MODES) {
                const modes = botmodePlugin.MODES
                modeExcludeMap = {}
                for (const [key, val] of Object.entries(modes)) {
                    if (val.excludeCategories) modeExcludeMap[key] = val.excludeCategories
                    // Handle allow list by converting to exclude list if needed, or rely on logic below
                }
            }
        } catch (e) {}
        
        const excludeCategories = modeExcludeMap[botMode] || modeExcludeMap.md
        
        let txt = `📂 *${toMonoUpperBold('DAFTAR KATEGORI')}*\n\n`
        txt += `> Ketik \`${prefix}menucat <kategori>\`\n\n`
        
        const categoryOrder = ['owner', 'main', 'utility', 'tools', 'fun', 'game', 'download', 'search', 'sticker', 'media', 'ai', 'group', 'religi', 'info', 'cek', 'economy', 'user', 'canvas', 'random', 'premium', 'jpm', 'pushkontak', 'panel', 'ephoto', 'store']
        
        const allCats = [...new Set([...categories, ...Object.keys(casesByCategory)])]
        const sortedCats = allCats.sort((a, b) => {
            const indexA = categoryOrder.indexOf(a)
            const indexB = categoryOrder.indexOf(b)
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
        })
        
        txt += `╭┈┈⬡「 📋 *${toMonoUpperBold('KATEGORI')}* 」\n`
        for (const cat of sortedCats) {
            if (cat === 'owner' && !m.isOwner) continue
            if (excludeCategories.includes(cat.toLowerCase())) continue
            const pluginCmds = commandsByCategory[cat] || []
            const caseCmds = casesByCategory[cat] || []
            const totalCmds = pluginCmds.length + caseCmds.length
            if (totalCmds === 0) continue
            
            const emoji = CATEGORY_EMOJIS[cat] || '📁'
            txt += `┃ ${emoji} ${toMonoUpperBold(cat)} ┃ \`${totalCmds}\` cmds\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `_Contoh: \`${prefix}menucat tools\`_`
        
        return sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: getContextInfo()
        }, { quoted: m })
    }
    
    const allCategories = [...new Set([...categories, ...Object.keys(casesByCategory)])]
    const matchedCat = allCategories.find(c => c.toLowerCase() === categoryArg)
    
    if (!matchedCat) {
        return m.reply(`❌ *ᴋᴀᴛᴇɢᴏʀɪ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n> Kategori \`${categoryArg}\` tidak ada.\n> Ketik \`${prefix}menucat\` untuk list kategori.`)
    }
    
    if (matchedCat === 'owner' && !m.isOwner) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Kategori ini hanya untuk owner.`)
    }
    
    const pluginCommands = commandsByCategory[matchedCat] || []
    const caseCommands = casesByCategory[matchedCat] || []
    const allCommands = [...pluginCommands, ...caseCommands]
    
    if (allCommands.length === 0) {
        return m.reply(`❌ *ᴋᴏsᴏɴɢ*\n\n> Kategori \`${matchedCat}\` tidak memiliki command.`)
    }
    
    const emoji = CATEGORY_EMOJIS[matchedCat] || '📁'
    
    let txt = `╭┈┈⬡「 ${emoji} *${toMonoUpperBold(matchedCat)}* 」\n`
    
    for (const cmd of allCommands) {
        txt += `┃ \`${prefix}${toSmallCaps(cmd)}\`\n`
    }
    
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `Total: \`${allCommands.length}\` commands\n`
    if (caseCommands.length > 0) {
        txt += `(${pluginCommands.length} plugin + ${caseCommands.length} case)`
    }
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
