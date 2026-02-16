const pluginConfig = {
    name: 'cekmesum',
    alias: ['mesum', 'hentai'],
    category: 'cek',
    description: 'Cek seberapa mesum kamu',
    usage: '.cekmesum <nama>',
    example: '.cekmesum Budi',
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
        desc = 'MESUM AKUT! Tobat mas! 😳🔞'
    } else if (percent >= 70) {
        desc = 'Mesum banget! 👀'
    } else if (percent >= 50) {
        desc = 'Lumayan mesum 😏'
    } else if (percent >= 30) {
        desc = 'Sedikit mesum 🙈'
    } else {
        desc = 'Polos dan suci! 😇'
    }
    
    let txt = `🙈 *ᴄᴇᴋ ᴍᴇsᴜᴍ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Mesum\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
