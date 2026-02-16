const pluginConfig = {
    name: 'cekwibu',
    alias: ['wibu', 'weeb'],
    category: 'cek',
    description: 'Cek seberapa wibu kamu',
    usage: '.cekwibu <nama>',
    example: '.cekwibu Budi',
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
        desc = 'WIBU SEJATI! Ara ara~ 🎌'
    } else if (percent >= 70) {
        desc = 'Wibu parah! Kimochi~ 😍'
    } else if (percent >= 50) {
        desc = 'Lumayan wibu 🌸'
    } else if (percent >= 30) {
        desc = 'Sedikit wibu 😊'
    } else {
        desc = 'Bukan wibu, normal! 😎'
    }
    
    let txt = `🎌 *ᴄᴇᴋ ᴡɪʙᴜ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Wibu\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
