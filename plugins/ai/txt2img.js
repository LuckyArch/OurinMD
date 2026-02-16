const txt2img = require('../../src/scraper/txt2img')

const pluginConfig = {
    name: 'txt2img',
    alias: ['texttoimage', 't2i', 'imagine'],
    category: 'ai',
    description: 'Generate gambar dari teks dengan AI',
    usage: '.txt2img <prompt> | <style>',
    example: '.txt2img beautiful sunset | anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

const STYLES = ['photorealistic', 'digital-art', 'impressionist', 'anime', 'fantasy', 'sci-fi', 'vintage']

async function handler(m, { sock }) {
    const input = m.args.join(' ')
    if (!input) {
        return m.reply(
            `🎨 *ᴛᴇxᴛ ᴛᴏ ɪᴍᴀɢᴇ*\n\n` +
            `> Generate gambar dari teks dengan AI\n\n` +
            `\`Contoh: ${m.prefix}txt2img beautiful sunset | anime\`\n\n` +
            `🎭 *sᴛʏʟᴇs*\n` +
            `> \`${STYLES.join(', ')}\``
        )
    }
    
    const [prompt, styleInput] = input.split('|').map(s => s.trim())
    const style = STYLES.includes(styleInput) ? styleInput : 'anime'
    
    m.react('🎨')
    
    try {
        const imageUrl = await txt2img(prompt, style)
        
        if (!imageUrl) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat generate gambar`)
        }
        
        m.react('✨')
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption: `🎨 *ᴛᴇxᴛ ᴛᴏ ɪᴍᴀɢᴇ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘʀᴏᴍᴘᴛ: \`${prompt}\`\n` +
                `┃ 🎭 sᴛʏʟᴇ: \`${style}\`\n` +
                `┃ 🤖 ᴍᴏᴅᴇʟ: \`UnrestrictedAI\`\n` +
                `╰┈┈⬡`
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
