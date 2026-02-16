const pluginConfig = {
    name: 'cekjomblo',
    alias: ['jomblo', 'single'],
    category: 'cek',
    description: 'Cek tingkat kejombloan kamu',
    usage: '.cekjomblo <nama>',
    example: '.cekjomblo Budi',
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
    if (percent >= 90) desc = 'Jomblo abadi! Single is happiness~ 💔😎'
    else if (percent >= 70) desc = 'Strong independent person! 💪'
    else if (percent >= 50) desc = 'MasihPDKT mode ON 😍'
    else if (percent >= 30) desc = 'Ada yang naksir kayaknya~ 👀'
    else desc = 'Soon taken! 💕'
    
    let txt = `💔 *ᴄᴇᴋ ᴊᴏᴍʙʟᴏ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%*\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = { config: pluginConfig, handler }
