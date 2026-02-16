const nanoBanana = require('../../src/scraper/nanobanana')

const pluginConfig = {
    name: 'nanobanana',
    alias: ['nano', 'imgedit', 'editimg'],
    category: 'ai',
    description: 'Edit gambar dengan AI menggunakan prompt',
    usage: '.nanobanana <prompt>',
    example: '.nanobanana make it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(
            `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n` +
            `> Edit gambar dengan AI\n\n` +
            `\`Contoh: ${m.prefix}nanobanana make it anime style\`\n\n` +
            `> Reply atau kirim gambar dengan caption`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ*\n\n> Reply atau kirim gambar dengan caption`)
    }
    
    m.react('🍌')
    await m.reply(`⏳ *ᴘʀᴏsᴇs...*\n\n> Sedang mengedit gambar dengan AI...\n> Mohon tunggu, proses bisa memakan waktu 1-2 menit`)
    
    try {
        let mediaBuffer
        if (m.isImage && m.download) {
            mediaBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download()
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal mengunduh gambar`)
        }
        
        const resultBuffer = await nanoBanana(mediaBuffer, prompt)
        
        if (!resultBuffer || !Buffer.isBuffer(resultBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengedit gambar`)
        }
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: resultBuffer,
            caption: `🍌 *ɴᴀɴᴏ ʙᴀɴᴀɴᴀ ᴘʀᴏ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘʀᴏᴍᴘᴛ: \`${prompt}\`\n` +
                `┃ 🤖 ᴍᴏᴅᴇʟ: \`nano-banana\`\n` +
                `┃ 🎭 ᴍᴏᴅᴇ: \`Image to Image\`\n` +
                `╰┈┈⬡`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`🍀 *Waduhh, sepertinya ini ada kendala*
> Silahkan coba ke versi ${m.prefix}nanobanana2`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
