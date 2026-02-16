const pluginConfig = {
    name: 'close',
    alias: ['tutup', 'closegroup', 'tutupgroup'],
    category: 'group',
    description: 'Menutup grup agar hanya admin yang bisa chat',
    usage: '.close',
    example: '.close',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

async function handler(m, { sock }) {
    try {
        const groupMeta = await sock.groupMetadata(m.chat);
        
        if (groupMeta.announce) {
            await m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Grup sudah dalam keadaan \`tertutup\`.\n` +
                `> Hanya admin yang bisa mengirim pesan.`
            );
            return;
        }
        
        await sock.groupSettingUpdate(m.chat, 'announcement');
        
        const senderNum = m.sender.split('@')[0];
        
        const successMsg = `🔒 *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ*

╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」
┃ ㊗ sᴛᴀᴛᴜs: *🔴 CLOSED*
┃ ㊗ ᴀᴋsᴇs: *Admin Only*
┃ ㊗ ʙʏ: *@${senderNum}*
╰┈┈⬡

> _Sekarang hanya admin yang bisa mengirim pesan di grup ini._`;
        
        await sock.sendMessage(m.chat, {
            text: successMsg,
            mentions: [m.sender]
        }, { quoted: m });
        
    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Gagal menutup grup.\n` +
            `> _${error.message}_`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
