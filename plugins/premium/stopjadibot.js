const { stopJadibot, isJadibotActive, jadibotSessions } = require('../../src/lib/jadibotManager')
const config = require('../../config')

const pluginConfig = {
    name: 'stopjadibot',
    alias: ['stopjbot', 'endjadibot'],
    category: 'premium',
    description: 'Hentikan jadibot kamu',
    usage: '.stopjadibot',
    example: '.stopjadibot',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const userJid = m.sender
    const id = userJid.replace(/@.+/g, '')
    
    if (!isJadibotActive(userJid)) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴊᴀᴅɪʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
            `> Kamu tidak memiliki jadibot yang aktif.\n\n` +
            `> Ketik \`${m.prefix}jadibot\` untuk memulai`
        )
    }
    
    const session = jadibotSessions.get(id)
    if (session && session.ownerJid !== m.sender && !m.isOwner) {
        return m.reply(`❌ Kamu tidak bisa menghentikan jadibot orang lain!`)
    }
    
    m.react('⏳')
    
    try {
        await stopJadibot(userJid, false)
        
        m.react('✅')
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴊᴀᴅɪʙᴏᴛ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                `> Nomor: @${id}\n` +
                `> Status: *Stopped*\n\n` +
                `> Session disimpan, bisa diaktifkan lagi nanti`,
            mentions: [userJid]
        }, { quoted: m })
    } catch (error) {
        m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
