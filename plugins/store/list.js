const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'list',
    alias: ['storelist', 'daftarlist', 'pricelist'],
    category: 'store',
    description: 'Tampilkan semua list store',
    usage: '.list',
    example: '.list',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const storeData = db.setting('storeList') || {}
    const lists = Object.entries(storeData)
    
    if (lists.length === 0) {
        return m.reply(
            `📦 *sᴛᴏʀᴇ ʟɪsᴛ*\n\n` +
            `> Belum ada list yang tersedia\n\n` +
            `> Owner dapat menambahkan list dengan:\n` +
            `> \`${m.prefix}addlist <nama>\` (reply pesan)`
        )
    }
    
    let txt = `📦 *sᴛᴏʀᴇ ʟɪsᴛ*\n\n`
    txt += `> Total: ${lists.length} list tersedia\n\n`
    txt += `╭─「 📋 *ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ* 」\n`
    
    for (const [name, data] of lists) {
        const preview = data.content
        txt += `┃\n`
        txt += `┃ 🏷️ \`${m.prefix}${name}\`\n`
        txt += `┃ └ ${preview}...\n`
        txt += `┃ └ 👁️ ${data.views || 0} views\n`
    }
    
    txt += `┃\n`
    txt += `╰───────────────\n\n`
    txt += `> Ketik command untuk melihat detail`
    
    m.react('📦')
    return m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
