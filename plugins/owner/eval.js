const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const util = require('util')

const pluginConfig = {
    name: 'eval',
    alias: ['$', 'ev', 'evaluate', '=>'],
    category: 'owner',
    description: 'Jalankan kode JavaScript (Owner Only)',
    usage: '=> <code> atau .$ <code>',
    example: '=> m.chat',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energi: 0,
    isEnabled: true,
    noPrefix: ['=>'],
    customTrigger: (body) => body?.startsWith('=>')
}

async function handler(m, { sock, store }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *Owner Only!*')
    }
    
    const code = m.fullArgs?.trim() || m.text?.trim()
    
    if (!code) {
        return m.reply(
            `⚙️ *ᴇᴠᴀʟ*\n\n` +
            `> Masukkan kode JavaScript!\n\n` +
            `*Contoh:*\n` +
            `> .$ 1 + 1\n` +
            `> .$ m.chat\n` +
            `> .$ db.getUser(m.sender)`
        )
    }
    
    const db = getDatabase()
    
    let result
    let isError = false
    
    try {
        result = await eval(`(async () => { ${code} })()`)
    } catch (e) {
        isError = true
        result = e
    }
    
    let output
    if (typeof result === 'undefined') {
        output = 'undefined'
    } else if (result === null) {
        output = 'null'
    } else if (typeof result === 'object') {
        try {
            output = util.inspect(result, { depth: 2, maxArrayLength: 50 })
        } catch {
            output = String(result)
        }
    } else {
        output = String(result)
    }
    
    if (output.length > 3000) {
        output = output.slice(0, 3000) + '\n\n... (truncated)'
    }
    
    const status = isError ? '❌ Error' : '✅ Success'
    const type = isError ? result?.name || 'Error' : typeof result
    
    await m.reply(
        `⚙️ *ᴇᴠᴀʟ ʀᴇsᴜʟᴛ*\n\n` +
        `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n` +
        `┃ ${status}\n` +
        `┃ Type: ${type}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `\`\`\`${output}\`\`\``
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
