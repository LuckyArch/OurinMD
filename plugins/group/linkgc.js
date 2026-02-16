const config = require('../../config')

const pluginConfig = {
    name: 'linkgc',
    alias: ['linkgrup', 'getlink', 'gclink'],
    category: 'group',
    description: 'Dapatkan link invite grup',
    usage: '.linkgc',
    example: '.linkgc',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    m.react('🔗')
    
    try {
        const code = await sock.groupInviteCode(m.chat)
        const urlGrup = `https://chat.whatsapp.com/${code}`
        
        const fakeQuoted = {
            key: {
                fromMe: false,
                participant: "13135550002@s.whatsapp.net",
                remoteJid: "13135550002@s.whatsapp.net",
                id: "FAKE_QUOTE_ID"
            },
            message: {
                conversation: config.bot?.name || 'Ourin MD'
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
            quoted: {
                key: {
                    fromMe: false,
                    participant: "13135550002@lid",
                    remoteJid: "13135550002@s.whatsapp.net",
                    id: "A523103CBB0D935ED3F9BF227AB9A94F"
                },
                message: {
                    conversation: config.bot?.name || 'Ourin MD'
                }
            }
        }
        
        await sock.sendMessage(m.chat, {
            text: `🔗 *ʟɪɴᴋ ɢʀᴜᴘ*\n\n${urlGrup}`,
            matchedText: urlGrup
        }, { quoted: fakeQuoted })
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
