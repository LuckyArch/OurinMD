const pluginConfig = {
    name: 'cektsundere',
    alias: ['tsundere'],
    category: 'cek',
    description: 'Cek tingkat tsundere kamu',
    usage: '.cektsundere <nama>',
    example: '.cektsundere Budi',
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
    if (percent >= 90) desc = 'BAKA! B-BUKAN BERARTI AKU SUKA! 😤💢'
    else if (percent >= 70) desc = 'Hmph! Jangan salah paham ya! 😳'
    else if (percent >= 50) desc = 'Y-yah terserah kamu deh... 👉👈'
    else if (percent >= 30) desc = 'Agak tsundere dikit~ 😊'
    else desc = 'Bukan tsundere, jujur aja kok 💕'
    
    let txt = `😤 *ᴄᴇᴋ ᴛsᴜɴᴅᴇʀᴇ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
