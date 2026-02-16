const pluginConfig = {
    name: 'cekcreative',
    alias: ['creative', 'kreatif'],
    category: 'cek',
    description: 'Cek tingkat kreativitas kamu',
    usage: '.cekcreative <nama>',
    example: '.cekcreative Budi',
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
    if (percent >= 90) desc = 'SUPER KREATIF! Artis sejati! 🎨✨'
    else if (percent >= 70) desc = 'Imajinatif banget! 💡'
    else if (percent >= 50) desc = 'Cukup kreatif 😊'
    else if (percent >= 30) desc = 'Biasa aja sih 🤔'
    else desc = 'Kurang imajinasi nih 😅'
    
    let txt = `🎨 *ᴄᴇᴋ ᴋʀᴇᴀᴛɪᴠɪᴛᴀs*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
