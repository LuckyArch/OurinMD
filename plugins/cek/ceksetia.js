const pluginConfig = {
    name: 'ceksetia',
    alias: ['setia', 'loyal'],
    category: 'cek',
    description: 'Cek tingkat kesetiaan kamu',
    usage: '.ceksetia <nama>',
    example: '.ceksetia Budi',
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
    if (percent >= 90) desc = 'Setia sampai mati! 💍💕'
    else if (percent >= 70) desc = 'Sangat setia dan tulus! ❤️'
    else if (percent >= 50) desc = 'Cukup setia~ 😊'
    else if (percent >= 30) desc = 'Hmm... kadang goyah 😅'
    else desc = 'Playboy/Playgirl mode? 😏'
    
    let txt = `💍 *ᴄᴇᴋ ᴋᴇsᴇᴛɪᴀᴀɴ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
