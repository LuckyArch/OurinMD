const axios = require('axios')

const pluginConfig = {
    name: 'melolo',
    alias: ['novel', 'cerita'],
    category: 'search',
    description: 'Cari novel/cerita di Melolo',
    usage: '.melolo <query>',
    example: '.melolo Cinta',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}melolo <query>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}melolo Cinta\``
        )
    }
    
    try {
        const res = await axios.get(`https://api.nekolabs.web.id/dsc/melolo/search?q=${encodeURIComponent(query)}`)
        
        if (!res.data?.success || !res.data?.result?.length) {
            return m.reply(`❌ Tidak ditemukan novel untuk: ${query}`)
        }
        
        const novels = res.data.result.slice(0, 5)
        
        let txt = `📖 *ᴍᴇʟᴏʟᴏ sᴇᴀʀᴄʜ*\n\n`
        txt += `> Query: *${query}*\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        novels.forEach((n, i) => {
            const sinopsis = n.sinopsis?.substring(0, 100) || '-'
            txt += `╭─「 📚 *${i + 1}* 」\n`
            txt += `┃ 📛 \`\`\`${n.title}\`\`\`\n`
            txt += `┃ ✍️ \`${n.author || 'Unknown'}\`\n`
            txt += `┃ 📊 \`${n.status || '-'}\` • 📑 \`${n.total_chapters || 0} chapter\`\n`
            txt += `┃ 🏷️ \`${n.tags?.join(', ') || '-'}\`\n`
            txt += `┃\n`
            txt += `┃ 📝 ${sinopsis}${n.sinopsis?.length > 100 ? '...' : ''}\n`
            txt += `╰━━━━━━━━━━━━━━\n\n`
        })
        
        return m.reply(txt.trim())
        
    } catch (err) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
