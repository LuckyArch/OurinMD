const pluginConfig = {
    name: 'cekkpopers',
    alias: ['kpopers', 'kpop'],
    category: 'cek',
    description: 'Cek tingkat kpopers kamu',
    usage: '.cekkpopers <nama>',
    example: '.cekkpopers Budi',
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
    if (percent >= 90) desc = 'ARMY/BLINK level max! 💜💗'
    else if (percent >= 70) desc = 'Stan berat nih! 🎤'
    else if (percent >= 50) desc = 'Casual listener~ 🎵'
    else if (percent >= 30) desc = 'Tau dikit-dikit aja 😅'
    else desc = 'Bukan kpopers 🤷'
    
    let txt = `🇰🇷 *ᴄᴇᴋ ᴋᴘᴏᴘᴇʀs*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
