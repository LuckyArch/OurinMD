const pluginConfig = {
    name: 'notiftagmember',
    alias: ['notiftag', 'notiftaganggota', 'tagnotif'],
    category: 'group',
    description: 'Toggle notifikasi saat ada yang mention/tag member',
    usage: '.notiftagmember on/off',
    example: '.notiftagmember on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ Hanya admin grup yang bisa menggunakan fitur ini`)
    }
    
    const args = m.args[0]?.toLowerCase()
    const group = db.getGroup(m.chat) || {}
    
    if (!['on', 'off'].includes(args)) {
        const status = group.notifTagMember === true ? '✅ Aktif' : '❌ Nonaktif'
        return m.reply(
            `🏷️ *ɴᴏᴛɪꜰ ᴛᴀɢ ᴍᴇᴍʙᴇʀ*\n\n` +
            `> Status: ${status}\n\n` +
            `*Penggunaan:*\n` +
            `\`${m.prefix}notiftagmember on\` - Aktifkan\n` +
            `\`${m.prefix}notiftagmember off\` - Nonaktifkan\n\n` +
            `*Deskripsi:*\n` +
            `> Bot akan mengirim notifikasi ketika ada yang\n` +
            `> mention/tag member di grup ini`
        )
    }
    
    if (args === 'on') {
        group.notifTagMember = true
        db.setGroup(m.chat, group)
        return m.reply(`✅ *ɴᴏᴛɪꜰ ᴛᴀɢ ᴍᴇᴍʙᴇʀ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Bot akan notif setiap ada mention member`)
    }
    
    if (args === 'off') {
        group.notifTagMember = false
        db.setGroup(m.chat, group)
        return m.reply(`❌ *ɴᴏᴛɪꜰ ᴛᴀɢ ᴍᴇᴍʙᴇʀ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
