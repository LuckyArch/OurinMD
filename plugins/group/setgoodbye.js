const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setgoodbye',
    alias: ['customgoodbye'],
    category: 'group',
    description: 'Set custom goodbye message',
    usage: '.setgoodbye <pesan>',
    example: '.setgoodbye Bye {user}, sampai jumpa lagi!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const text = m.fullArgs?.trim() || m.args.join(' ')
    
    if (!text) {
        return m.reply(
            `📝 *sᴇᴛ ɢᴏᴏᴅʙʏᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ᴘʟᴀᴄᴇʜᴏʟᴅᴇʀ* 」\n` +
            `┃ ◦ \`{user}\` - Nama member\n` +
            `┃ ◦ \`{group}\` - Nama grup\n` +
            `┃ ◦ \`{count}\` - Sisa member\n` +
            `╰┈┈⬡\n\n` +
            `\`Contoh:\`\n` +
            `\`${m.prefix}setgoodbye Bye {user}! 👋\`\n` +
            `\`Sampai jumpa lagi!\``
        )
    }
    
    db.setGroup(m.chat, { goodbyeMsg: text, goodbye: true, leave: true })
    db.save()
    
    m.react('✅')
    
    await m.reply(
        `✅ *ɢᴏᴏᴅʙʏᴇ ᴅɪsᴇᴛ*\n\n` +
        `╭┈┈⬡「 📋 *ᴘʀᴇᴠɪᴇᴡ* 」\n` +
        `┃\n` +
        `┃ ${text.replace(/{user}/gi, '@Member').replace(/{group}/gi, 'Nama Grup').replace(/{count}/gi, '99')}\n` +
        `┃\n` +
        `╰┈┈⬡\n\n` +
        `> Gunakan \`.resetgoodbye\` untuk reset`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
