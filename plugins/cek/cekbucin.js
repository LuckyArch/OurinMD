const pluginConfig = {
    name: 'cekbucin',
    alias: ['bucin'],
    category: 'cek',
    description: 'Cek seberapa bucin kamu',
    usage: '.cekbucin <nama>',
    example: '.cekbucin Budi',
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
        desc = 'BUCIN AKUT! Udah gabisa diselamatkan 😭💔'
    } else if (percent >= 70) {
        desc = 'Bucin parah nih~ 🥺'
    } else if (percent >= 50) {
        desc = 'Lumayan bucin 💕'
    } else if (percent >= 30) {
        desc = 'Sedikit bucin 😊'
    } else {
        desc = 'Santai aja, gak bucin 😎'
    }
    
    let txt = `💔 *ᴄᴇᴋ ʙᴜᴄɪɴ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Bucin\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
