const pluginConfig = {
    name: 'cekpelit',
    alias: ['pelit', 'kikir'],
    category: 'cek',
    description: 'Cek seberapa pelit kamu',
    usage: '.cekpelit <nama>',
    example: '.cekpelit Budi',
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
        desc = 'SUPER PELIT! Duit dijaga mati-matian! 💸'
    } else if (percent >= 70) {
        desc = 'Pelit banget! 🙊'
    } else if (percent >= 50) {
        desc = 'Lumayan pelit 😅'
    } else if (percent >= 30) {
        desc: 'Sedikit hemat 😊'
    } else {
        desc = 'Dermawan banget! 🎁'
    }
    
    let txt = `💸 *ᴄᴇᴋ ᴘᴇʟɪᴛ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Pelit\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
