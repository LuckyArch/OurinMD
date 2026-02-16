const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'done',
    alias: ['dn', 'selesai', 'completed'],
    category: 'store',
    description: 'Konfirmasi transaksi selesai',
    usage: '.done [pesanan|note]',
    example: '.done Canva Pro 1 Bulan|Sukses dikirim',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function generateInvoice(db, session, params = {}) {
    const doneSettings = db.setting('doneTemplate') || {}
    const template = doneSettings.template
    
    const now = new Date()
    const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
    const tanggal = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
    
    const pesanan = params.pesanan || '-'
    const note = params.note || ''
    const buyer = session?.buyerName || params.buyerName || 'Buyer'
    const buyerNumber = session?.buyerNumber || params.buyerNumber || ''
    
    if (template) {
        return template
            .replace(/{buyer}/gi, buyer)
            .replace(/{buyer_number}/gi, buyerNumber)
            .replace(/{date}/gi, tanggal)
            .replace(/{jam}/gi, jam)
            .replace(/{time}/gi, jam)
            .replace(/{pesanan}/gi, pesanan)
            .replace(/{title}/gi, pesanan)
            .replace(/{produk}/gi, pesanan)
            .replace(/{note}/gi, note)
    }
    
    let invoiceText = `「 *TRANSAKSI BERHASIL* 」

⌚️ JAM     : ${jam}
✨ STATUS  : Berhasil`

    if (pesanan && pesanan !== '-') {
        invoiceText += `
*📝 Pesanan:*
${pesanan}`
    }

    if (note) {
        invoiceText += `

*📝 Note :*
${note}`
    }

    invoiceText += `

Terimakasih @${buyerNumber}, Next Order ya🙏`

    return invoiceText
}

function generatePendingInvoice(session, params = {}) {
    const now = new Date()
    const jam = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
    
    const buyerNumber = session?.buyerNumber || params.buyerNumber || ''
    
    return `「 *TRANSAKSI PENDING* 」

⌚️ JAM     : ${jam}
✨ STATUS  : Pending

Terimakasih @${buyerNumber}, Next Order ya🙏`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const sessions = db.setting('transactionSessions') || {}
    
    let session = null
    let buyerJid = null
    let buyerName = m.pushName || 'Buyer'
    let buyerNumber = ''
    
    if (m.quoted) {
        buyerJid = m.quoted.sender || m.quotedSender
        buyerName = m.quoted.pushName || buyerName
        buyerNumber = buyerJid?.split('@')[0] || ''
        
        if (buyerJid && sessions[buyerJid]) {
            session = sessions[buyerJid]
            delete sessions[buyerJid]
            db.setting('transactionSessions', sessions)
        }
    }
    
    const text = m.text?.trim() || ''
    const parts = text.split('|').map(p => p.trim())
    
    const params = {
        pesanan: parts[0] || null,
        note: parts[1] || null,
        buyerName: session?.buyerName || buyerName,
        buyerNumber: session?.buyerNumber || buyerNumber
    }
    
    const invoiceText = generateInvoice(db, session, params)
    await db.save()
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const mentions = []
    if (buyerJid) mentions.push(buyerJid)
    
    await sock.sendMessage(m.chat, {
        text: invoiceText,
        mentions,
        contextInfo: {
            mentionedJid: mentions,
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

async function handleBuyerDone(m, sock, session) {
    const db = getDatabase()
    
    const params = {
        buyerName: session.buyerName,
        buyerNumber: session.buyerNumber
    }
    
    const invoiceText = generateInvoice(db, session, params)
    await db.save()
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    await sock.sendMessage(m.chat, {
        text: invoiceText,
        mentions: [session.buyerJid],
        contextInfo: {
            mentionedJid: [session.buyerJid],
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
    handler,
    handleBuyerDone,
    generateInvoice,
    generatePendingInvoice
}
