const pluginConfig = {
    name: 'antiremove',
    alias: ['antidelete', 'antihapus', 'ar'],
    category: 'group',
    description: 'Mengaktifkan/menonaktifkan anti hapus pesan di grup',
    usage: '.antiremove <on/off>',
    example: '.antiremove on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}

    if (!action) {
        const status = group.antiremove || 'off'

        await m.reply(
            `🗑️ *ᴀɴᴛɪʀᴇᴍᴏᴠᴇ sᴇᴛᴛɪɴɢs*\n\n` +
            `> Status: *${status === 'on' ? '✅ Aktif' : '❌ Nonaktif'}*\n\n` +
            `> Fitur ini akan mengirim ulang pesan\n` +
            `> yang dihapus oleh user.\n\n` +
            `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
            `> \`${m.prefix}antiremove on\` → Aktifkan\n` +
            `> \`${m.prefix}antiremove off\` → Nonaktifkan`
        )
        return
    }

    if (action === 'on') {
        db.setGroup(groupId, { ...group, antiremove: 'on' })
        await m.reply(
            `✅ *ᴀɴᴛɪʀᴇᴍᴏᴠᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Anti hapus pesan berhasil diaktifkan!\n` +
            `> Pesan yang dihapus akan dikirim ulang.`
        )
        return
    }

    if (action === 'off') {
        db.setGroup(groupId, { ...group, antiremove: 'off' })
        await m.reply(
            `❌ *ᴀɴᴛɪʀᴇᴍᴏᴠᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Anti hapus pesan berhasil dinonaktifkan.`
        )
        return
    }

    await m.reply(
        `❌ *ᴘɪʟɪʜᴀɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
        `> Gunakan: on atau off`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
