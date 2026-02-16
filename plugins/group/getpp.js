const pluginConfig = {
    name: 'getpp',
    alias: ['pp', 'profilepic', 'avatar'],
    category: 'group',
    description: 'Ambil foto profil target (mention/reply)',
    usage: '.getpp @user',
    example: '.getpp @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let target = m.sender
    
    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        target = m.mentionedJid[0]
    } else if (m.args[0]) {
        let num = m.args[0].replace(/[^0-9]/g, '')
        if (num.startsWith('0')) num = '62' + num.slice(1)
        target = num + '@s.whatsapp.net'
    }
    
    const targetNum = target.split('@')[0]
    
    let ppUrl
    try {
        ppUrl = await sock.profilePictureUrl(target, 'image')
    } catch {
        ppUrl = 'https://files.catbox.moe/ejy4ky.jpg'
    }
    
    const name = await sock.getName(target, m.isGroup ? m.chat : null)
    
    await sock.sendMessage(m.chat, {
        image: { url: ppUrl },
        caption: `📷 *ᴘʀᴏꜰɪʟᴇ ᴘɪᴄᴛᴜʀᴇ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 👤 ɴᴀᴍᴀ: *${name}*\n` +
            `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNum}\`\n` +
            `╰┈┈⬡`,
        mentions: [target]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
