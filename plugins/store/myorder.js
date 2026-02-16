const { getDatabase } = require('../../src/lib/database')
const orderPoller = require('../../src/lib/orderPoller')

const pluginConfig = {
    name: 'myorder',
    alias: ['orderku', 'cekorder', 'pesananku'],
    category: 'store',
    description: 'Lihat order kamu',
    usage: '.myorder',
    example: '.myorder',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const path = require('path')
    const fs = require('fs')
    const storeImage = path.join(process.cwd(), 'assets', 'images', 'ourin-store.jpg')
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Fitur ini hanya tersedia di mode *STORE*!`)
    }
    
    const myOrders = orderPoller.getOrdersByBuyer(m.sender)
        .filter(o => o.groupId === m.chat)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    if (myOrders.length === 0) {
        const emptyTxt = `📋 *ᴏʀᴅᴇʀ ᴋᴀᴍᴜ*\n\n` +
            `> Belum ada order!\n\n` +
            `> Lihat produk untuk mulai belanja`
        
        const buttons = [{
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: '🛒 ʟɪʜᴀᴛ ᴘʀᴏᴅᴜᴋ',
                id: `${m.prefix}products`
            })
        }]
        
        if (fs.existsSync(storeImage)) {
            return sock.sendMessage(m.chat, {
                image: fs.readFileSync(storeImage),
                caption: emptyTxt,
                buttons
            }, { quoted: m })
        }
        return sock.sendMessage(m.chat, { text: emptyTxt, buttons }, { quoted: m })
    }
    
    const statusIcon = {
        pending: '⏳',
        paid: '✅',
        completed: '🎉',
        waiting_confirm: '📝',
        expired: '⏰',
        cancelled: '❌'
    }
    
    const statusLabel = {
        pending: 'Menunggu Pembayaran',
        paid: 'Sudah Dibayar',
        completed: 'Selesai',
        waiting_confirm: 'Menunggu Konfirmasi',
        expired: 'Kadaluarsa',
        cancelled: 'Dibatalkan'
    }
    
    let txt = `📋 *ᴏʀᴅᴇʀ ᴋᴀᴍᴜ*\n\n`
    txt += `> Total: *${myOrders.length}* order\n`
    txt += `━━━━━━━━━━━━━━━\n\n`
    
    myOrders.slice(0, 10).forEach((order, i) => {
        const icon = statusIcon[order.status] || '❓'
        const label = statusLabel[order.status] || order.status
        const items = order.items?.map(it => `${it.name} x${it.qty}`).join(', ') || '-'
        
        txt += `${icon} *${order.orderId}*\n`
        txt += `   📦 ${items}\n`
        txt += `   💰 Rp ${order.total.toLocaleString('id-ID')}\n`
        txt += `   📊 ${label}\n\n`
    })
    
    if (myOrders.length > 10) {
        txt += `> ... dan ${myOrders.length - 10} order lainnya`
    }
    
    const pendingOrder = myOrders.find(o => o.status === 'pending')
    const interactiveButtons = [
        {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: '🛒 ᴏʀᴅᴇʀ ʙᴀʀᴜ',
                id: `${m.prefix}products`
            })
        }
    ]
    
    if (pendingOrder) {
        interactiveButtons.unshift({
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
                display_text: '📋 ᴄᴏᴘʏ ᴏʀᴅᴇʀ ɪᴅ',
                copy_code: pendingOrder.orderId
            })
        })
    }
    
    let thumbnail = null
    if (fs.existsSync(storeImage)) {
        thumbnail = fs.readFileSync(storeImage)
    }
    
    return sock.sendMessage(m.chat, {
        text: txt.trim(),
        contextInfo: thumbnail ? {
            externalAdReply: {
                title: '📋 Order Saya',
                body: 'Riwayat pesanan kamu',
                thumbnail,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        } : undefined,
        interactiveButtons
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
