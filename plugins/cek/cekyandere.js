const pluginConfig = {
    name: 'cekyandere',
    alias: ['yandere'],
    category: 'cek',
    description: 'Cek tingkat yandere kamu',
    usage: '.cekyandere <nama>',
    example: '.cekyandere Budi',
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
    if (percent >= 90) desc = 'Kamu milikku selamanya~ 🔪💕'
    else if (percent >= 70) desc = 'Jangan dekati dia ya... 👁️'
    else if (percent >= 50) desc = 'Overprotective sedikit~ 🫂'
    else if (percent >= 30) desc = 'Agak posesif 😅'
    else desc = 'Normal kok, santai~ 😊'
    
    let txt = `🔪 *ᴄᴇᴋ ʏᴀɴᴅᴇʀᴇ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
