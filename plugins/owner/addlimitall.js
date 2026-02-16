const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addenergiall',
    alias: ['addenergianall', 'bonusenergiall'],
    category: 'owner',
    description: 'Menambahkan limit/energi ke semua member grup',
    usage: '.addenergiall <jumlah>',
    example: '.addenergiall 50',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const amount = parseInt(m.args[0])
        
        if (isNaN(amount) || amount <= 0) {
            return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> Masukkan jumlah limit yang ingin ditambahkan.\n\n\`Contoh: ${m.prefix}addlimitall 50\``)
        }
        
        const groupMeta = await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []
        
        if (participants.length === 0) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak ada member di grup ini`)
        }
        
        m.react('⏳')
        console.log(`[AddLimitAll] Target: ${participants.length} members. Amount: ${amount}`)
        
        const db = getDatabase()
        let successCount = 0
        
        for (const participant of participants) {
            const number = participant.jid?.replace(/[^0-9]/g, '') || ''
            if (!number) continue
            
            const jid = number + '@s.whatsapp.net'
           console.log(jid)
            
            db.updateEnergi(jid, amount)
            successCount++
        }
        
        console.log(`[AddLimitAll] Success count: ${successCount}`)
        await db.save()
        m.react('⚡')
        await m.reply(
            `⚡ *ᴀᴅᴅ ʟɪᴍɪᴛ ᴀʟʟ*\n\n` +
            `╭┈┈⬡「 📋 *ʜᴀsɪʟ* 」\n` +
            `┃ 👥 ᴛᴏᴛᴀʟ ᴍᴇᴍʙᴇʀ: \`${participants.length}\`\n` +
            `┃ ✅ sᴜᴋsᴇs: \`${successCount}\`\n` +
            `┃ ⚡ ᴊᴜᴍʟᴀʜ: *+${amount}*\n` +
            `╰┈┈⬡\n\n` +
            `Semua member di group ini akan mendapatkan energi sebesar \`${amount}\``
        )
        
    } catch (error) {
        m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
