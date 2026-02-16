const config = require('../../config')

const pluginConfig = {
    name: 'absen',
    alias: ['hadir', 'present'],
    category: 'group',
    description: 'Tandai kehadiran di sesi absen',
    usage: '.absen',
    example: '.absen',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

if (!global.absensi) global.absensi = {}

async function handler(m, { sock }) {
    const chatId = m.chat
    
    if (!global.absensi[chatId]) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴀʙsᴇɴ*\n\n` +
            `> Belum ada sesi absen di grup ini!\n\n` +
            `> Admin dapat memulai dengan\n` +
            `> *.mulaiabsen [keterangan]*`
        )
    }
    
    const absen = global.absensi[chatId]
    
    if (absen.peserta.includes(m.sender)) {
        return m.reply(`❌ Kamu sudah absen!`)
    }
    
    absen.peserta.push(m.sender)
    
    const moment = require('moment-timezone')
    const now = moment().tz('Asia/Jakarta')
    const dateStr = now.format('D MMMM YYYY')
    
    const list = absen.peserta
        .map((jid, i) => `┃ ${i + 1}. @${jid.split('@')[0]}`)
        .join('\n')
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    await sock.sendMessage(chatId, {
        text: `✅ *ᴀʙsᴇɴ ʙᴇʀʜᴀsɪʟ!*\n\n` +
            `╭┈┈⬡「 📋 *${absen.keterangan}* 」\n` +
            `┃ 📅 ${dateStr}\n` +
            `┃ 👥 Total: ${absen.peserta.length}\n` +
            `├┈┈⬡「 📝 *ᴅᴀғᴛᴀʀ ʜᴀᴅɪʀ* 」\n` +
            `${list}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> _Ketik *.absen* untuk hadir_\n` +
            `> _Ketik *.cekabsen* untuk melihat daftar_`,
        mentions: absen.peserta,
        contextInfo: {
            mentionedJid: absen.peserta,
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
