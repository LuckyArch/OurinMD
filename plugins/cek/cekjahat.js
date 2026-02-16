const pluginConfig = {
    name: 'cekjahat',
    alias: ['jahat', 'evil'],
    category: 'cek',
    description: 'Cek seberapa jahat kamu',
    usage: '.cekjahat <nama>',
    example: '.cekjahat Budi',
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
        desc = 'VILLAIN LEVEL! 😈👿'
    } else if (percent >= 70) {
        desc = 'Jahat banget! 💀'
    } else if (percent >= 50) {
        desc = 'Lumayan jahat 😏'
    } else if (percent >= 30) {
        desc = 'Sedikit nakal 😊'
    } else {
        desc = 'Baik kok, gak jahat! 😇'
    }
    
    let txt = `👿 *ᴄᴇᴋ ᴊᴀʜᴀᴛ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Jahat\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
