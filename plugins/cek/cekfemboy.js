const cekfemboy = require('../../src/scraper/lufemboy')
const { fetchBuffer } = require('../../src/lib/functions')

const pluginConfig = {
    name: 'cekfemboy',
    alias: ['femboy'],
    category: 'cek',
    description: 'Cek seberapa femboy kamu',
    usage: '.cekfemboy <nama>',
    example: '.cekfemboy Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const nama = m.text?.trim() || m.pushName || 'Kamu'
    
    try {
        const result = cekfemboy(nama)
        
        let buffer = null
        try {
            buffer = await fetchBuffer(result.gif)
        } catch (e) {}
        
        let txt = `🌸 *ᴄᴇᴋ ғᴇᴍʙᴏʏ*\n\n`
        txt += `> ${result.hasil}`
        
        if (buffer) {
            await sock.sendMessage(m.chat, {
                video: buffer,
                gifPlayback: true,
                caption: txt
            }, { quoted: m })
        } else {
            await m.reply(txt)
        }
        
    } catch (err) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
