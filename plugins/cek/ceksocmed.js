const pluginConfig = {
    name: 'ceksocmed',
    alias: ['sosmed', 'medsos'],
    category: 'cek',
    description: 'Cek tingkat kecanduan sosmed',
    usage: '.ceksocmed <nama>',
    example: '.ceksocmed Budi',
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
    if (percent >= 90) desc = 'Kecanduan parah! Detox needed! 📱💀'
    else if (percent >= 70) desc = 'Scroll terus tanpa henti~ 📲'
    else if (percent >= 50) desc = 'Normal usage 👍'
    else if (percent >= 30) desc = 'Cukup sehat nih 🌿'
    else desc = 'Digital detox master! 🧘'
    
    let txt = `📱 *ᴄᴇᴋ sᴏsᴍᴇᴅ ᴀᴅᴅɪᴄᴛ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
