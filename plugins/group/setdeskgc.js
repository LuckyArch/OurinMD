const pluginConfig = {
    name: 'setdeskgc',
    alias: ['setdesc', 'setdescgc', 'setdeskripsi', 'setdesk'],
    category: 'group',
    description: 'Mengubah deskripsi grup',
    usage: '.setdeskgc <deskripsi baru>',
    example: '.setdeskgc Grup untuk diskusi',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    isBotAdmin: true,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const newDesc = m.text?.trim() || ''
    if (!m.text && m.args?.length === 0) {
        await m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}setdeskgc Deskripsi baru\`\n` +
            `> \`${m.prefix}setdeskgc clear\` - Hapus deskripsi`
        )
        return
    }
    const descToSet = newDesc.toLowerCase() === 'clear' ? '' : newDesc
    
    if (descToSet.length > 2048) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ*\n\n` +
            `> Deskripsi maksimal 2048 karakter.`
        )
        return
    }
    
    try {
        await sock.groupUpdateDescription(m.chat, descToSet)
        
        if (descToSet) {
            await m.reply(
                `✅ *ᴅᴇsᴋʀɪᴘsɪ ɢʀᴜᴘ ᴅɪᴜʙᴀʜ*\n\n` +
                `> Deskripsi grup berhasil diperbarui!`
            )
        } else {
            await m.reply(
                `✅ *ᴅᴇsᴋʀɪᴘsɪ ɢʀᴜᴘ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Deskripsi grup berhasil dihapus!`
            )
        }
    } catch (error) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Tidak dapat mengubah deskripsi grup.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
