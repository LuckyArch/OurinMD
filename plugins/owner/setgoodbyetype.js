const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'setgoodbyetype',
    alias: ['goodbyetype', 'goodbyevariant', 'goodbyestyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan goodbye message',
    usage: '.setgoodbyetype',
    example: '.setgoodbyetype',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const VARIANTS = {
    1: { name: 'Canvas Image', desc: 'Gambar canvas dengan foto profil' },
    2: { name: 'Carousel Cards', desc: 'Kartu interaktif dengan tombol' },
    3: { name: 'Text Only', desc: 'Pesan teks minimalis tanpa gambar' },
    4: { name: 'Extended', desc: 'Multi-section dengan info lengkap' }
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const variant = args[0]?.toLowerCase()
    const current = db.setting('goodbyeType') || 1
    
    if (variant && /^v?[1-4]$/.test(variant)) {
        const id = parseInt(variant.replace('v', ''))
        db.setting('goodbyeType', id)
        await db.save()
        
        await m.reply(
            `✅ Goodbye type diubah ke *V${id}*\n\n` +
            `> *${VARIANTS[id].name}*\n` +
            `> _${VARIANTS[id].desc}_`
        )
        return
    }
    
    const buttons = []
    for (const [id, val] of Object.entries(VARIANTS)) {
        const mark = parseInt(id) === current ? ' ✓' : ''
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: `V${id}${mark} - ${val.name}`,
                id: `${m.prefix}setgoodbyetype v${id}`
            })
        })
    }
    
    await sock.sendMessage(m.chat, {
        text: `🎨 *sᴇᴛ ɢᴏᴏᴅʙʏᴇ ᴛʏᴘᴇ*\n\n> Type saat ini: *V${current}*\n> _${VARIANTS[current].name}_\n\n> Pilih variant goodbye:`,
        footer: config.bot?.name || 'Ourin-AI',
        contextInfo: {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 999
        },
        interactiveButtons: buttons
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
