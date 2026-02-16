const pluginConfig = {
    name: 'hapusabsen',
    alias: ['deleteabsen', 'tutupabsen', 'closeabsen', 'resetabsen'],
    category: 'group',
    description: 'Hapus/tutup sesi absen (admin only)',
    usage: '.hapusabsen',
    example: '.hapusabsen',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true
}

if (!global.absensi) global.absensi = {}

async function handler(m) {
    const chatId = m.chat
    
    if (!global.absensi[chatId]) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴀʙsᴇɴ*\n\n` +
            `> Tidak ada sesi absen di grup ini!`
        )
    }
    
    const absen = global.absensi[chatId]
    const totalPeserta = absen.peserta.length
    
    delete global.absensi[chatId]
    
    await m.reply(
        `✅ *ᴀʙsᴇɴ ᴅɪᴛᴜᴛᴜᴘ!*\n\n` +
        `╭┈┈⬡「 📋 *ʀɪɴᴋᴀsᴀɴ* 」\n` +
        `┃ 📝 ${absen.keterangan}\n` +
        `┃ 👥 Total hadir: ${totalPeserta}\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> Sesi absen telah dihapus.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
