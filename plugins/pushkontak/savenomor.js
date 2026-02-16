const { getDatabase } = require('../../src/lib/database')
const { getGroupMode } = require('../group/botmode')

const pluginConfig = {
    name: 'savenomor',
    alias: ['sv', 'save', 'simpannomor'],
    category: 'pushkontak',
    description: 'Simpan nomor ke kontak bot',
    usage: '.savenomor <nama>',
    example: '.savenomor JohnDoe',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (m.isGroup) {
        const groupMode = getGroupMode(m.chat, db)
        if (groupMode !== 'pushkontak') {
            return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> Aktifkan mode pushkontak terlebih dahulu\n\n\`${m.prefix}botmode pushkontak\``)
        }
    }
    
    let targetNumber = ''
    let nama = ''
    
    if (m.isGroup) {
        if (m.quoted) {
            targetNumber = m.quoted.sender
            nama = m.text?.trim()
        } else if (m.mentionedJid?.length) {
            targetNumber = m.mentionedJid[0]
            const input = m.text?.trim()
            nama = input?.split('|')[1]?.trim() || input?.replace(/@\d+/g, '').trim()
        } else if (m.text?.includes('|')) {
            const [num, nm] = m.text.split('|').map(s => s.trim())
            targetNumber = num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            nama = nm
        } else {
            return m.reply(
                `📱 *sᴀᴠᴇ ɴᴏᴍᴏʀ*\n\n` +
                `> Di grup:\n` +
                `┃ \`${m.prefix}savenomor nama\` (reply pesan)\n` +
                `┃ \`${m.prefix}savenomor @tag|nama\`\n` +
                `┃ \`${m.prefix}savenomor 628xxx|nama\`\n\n` +
                `> Di private:\n` +
                `┃ \`${m.prefix}savenomor nama\``
            )
        }
    } else {
        targetNumber = m.chat
        nama = m.text?.trim()
    }
    
    if (!nama) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Masukkan nama kontak`)
    }
    
    if (!targetNumber) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat menentukan nomor target`)
    }
    
    m.react('📱')
    
    try {
        const contactAction = {
            fullName: nama,
            lidJid: targetNumber,
            saveOnPrimaryAddressbook: true
        }
        
        await sock.addOrEditContact(targetNumber, contactAction)
        
        m.react('✅')
        await m.reply(
            `✅ *ᴋᴏɴᴛᴀᴋ ᴅɪsɪᴍᴘᴀɴ*\n\n` +
            `> ɴᴏᴍᴏʀ: \`${targetNumber.split('@')[0]}\`\n` +
            `> ɴᴀᴍᴀ: \`${nama}\``
        )
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
