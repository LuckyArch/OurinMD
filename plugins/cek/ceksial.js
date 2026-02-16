const pluginConfig = {
    name: 'ceksial',
    alias: ['sial', 'apes'],
    category: 'cek',
    description: 'Cek seberapa sial kamu',
    usage: '.ceksial <nama>',
    example: '.ceksial Budi',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const nama = m.text?.trim() || m.pushName || 'Kamu'
    const percent = Math.floor(Math.random() * 101)
    
    let desc = ''
    if (percent >= 90) {
        desc = 'SIAL BANGET! Mending di rumah aja! 😭'
    } else if (percent >= 70) {
        desc = 'Lagi apes nih~ 😢'
    } else if (percent >= 50) {
        desc = 'Lumayan sial 😓'
    } else if (percent >= 30) {
        desc = 'Sedikit sial 😕'
    } else {
        desc = 'Gak sial, hoki dong! 🍀'
    }
    
    let txt = `😭 *ᴄᴇᴋ sɪᴀʟ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Sial\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
