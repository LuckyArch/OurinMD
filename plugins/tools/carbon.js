const pluginConfig = {
    name: ['carbon', 'carbonify', 'carboncode'],
    alias: [],
    category: 'tools',
    description: 'Membuat gambar kode dengan tampilan carbon style',
    usage: '.carbon <kode>',
    example: '.carbon console.log("Hello World")',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

const { generateCarbon } = require('../../src/lib/carbon')

async function handler(m, { sock }) {
    const text = m.text || m.quoted?.text
    
    if (!text) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}carbon <kode>\`\n` +
            `> Atau reply pesan berisi kode\n\n` +
            `> Contoh: \`${m.prefix}carbon console.log("Hello")\``
        )
    }
    
    await m.reply(`⏳ *Membuat carbon image...*`)
    
    try {
        const buffer = await generateCarbon(text)
        
        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `🖥️ *Carbon Code*\n> By: ${m.pushName}`
        }, { quoted: m })
        
        m.react('🖥️')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
