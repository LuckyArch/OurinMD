const pluginConfig = {
    name: 'cekcantik',
    alias: ['cantik', 'beautiful'],
    category: 'cek',
    description: 'Cek seberapa cantik kamu',
    usage: '.cekcantik <nama>',
    example: '.cekcantik Ani',
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
        desc = 'Cantik banget kayak bidadari! 👸✨'
    } else if (percent >= 70) {
        desc = 'Cantik banget! 💕'
    } else if (percent >= 50) {
        desc = 'Manis dan cantik~ 🌸'
    } else if (percent >= 30) {
        desc = 'Lumayan cantik 😊'
    } else {
        desc = 'Tetep cantik kok! 💖'
    }
    
    let txt = `👸 *ᴄᴇᴋ ᴄᴀɴᴛɪᴋ*\n\n`
    txt += `> 👤 Nama: *${nama}*\n`
    txt += `> 📊 Tingkat: *${percent}%* Cantik\n\n`
    txt += `> ${desc}`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
