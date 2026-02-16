const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'proses',
    alias: ['prs', 'process'],
    category: 'store',
    description: 'Mulai proses transaksi dengan buyer',
    usage: '.prs',
    example: '.prs',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

const defaultTemplate = `「 *TRANSAKSI DIPROSES* 」

⌚️ JAM     : {jam}
✨ STATUS  : Diproses

*👤 Buyer:*
@{buyer_number} ({buyer})

Mohon tunggu ya, pesanan sedang diproses🙏`

function generateProsesMessage(db, session) {
    const prosesSettings = db.setting('prosesTemplate') || {}
    const template = prosesSettings.template || defaultTemplate
    
    const now = new Date()
    const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
    const tanggal = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
    
    return template
        .replace(/{buyer}/gi, session.buyerName)
        .replace(/{buyer_number}/gi, session.buyerNumber)
        .replace(/{jam}/gi, jam)
        .replace(/{time}/gi, jam)
        .replace(/{date}/gi, tanggal)
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (!m.quoted) {
        return m.reply(
            `📦 *ᴘʀᴏsᴇs ᴛʀᴀɴsᴀᴋsɪ*\n\n` +
            `> Reply pesan buyer lalu ketik \`${m.prefix}prs\`\n\n` +
            `*ғʟᴏᴡ:*\n` +
            `1. Reply pesan buyer → \`${m.prefix}prs\`\n` +
            `2. Proses transaksi...\n` +
            `3. Selesai → \`${m.prefix}done\` atau \`${m.prefix}done pesanan|note\``
        )
    }
    
    const buyerJid = m.quoted.sender || m.quotedSender
    const buyerName = m.quoted.pushName || 'Buyer'
    const buyerNumber = buyerJid?.split('@')[0] || ''
    
    if (!buyerJid) {
        return m.reply(`❌ Tidak bisa mendapatkan nomor buyer!`)
    }
    
    let sessions = db.setting('transactionSessions') || {}
    
    if (sessions[buyerJid]) {
        return m.reply(
            `⚠️ Buyer ini sudah ada transaksi aktif!\n\n` +
            `> Nama: ${sessions[buyerJid].buyerName}\n` +
            `> Nomor: ${sessions[buyerJid].buyerNumber}\n\n` +
            `> Hapus: \`${m.prefix}cancelproses @${buyerNumber}\``
        )
    }
    
    const session = {
        buyerJid,
        buyerName,
        buyerNumber,
        sellerJid: m.sender,
        chatJid: m.chat,
        startedAt: Date.now(),
        status: 'processing'
    }
    
    sessions[buyerJid] = session
    db.setting('transactionSessions', sessions)
    await db.save()
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const prosesMessage = generateProsesMessage(db, session)
    
    await sock.sendMessage(m.chat, {
        text: prosesMessage,
        mentions: [buyerJid],
        contextInfo: {
            mentionedJid: [buyerJid],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
