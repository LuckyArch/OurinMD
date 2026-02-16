const { getDatabase } = require('../../src/lib/database')
const pakasir = require('../../src/lib/pakasir')
const orderPoller = require('../../src/lib/orderPoller')

const pluginConfig = {
    name: 'simulatepay',
    alias: ['simpay', 'testpay', 'fakepay'],
    category: 'store',
    description: 'Simulasi pembayaran (sandbox only)',
    usage: '.simulatepay <order_id>',
    example: '.simulatepay ORD20260111ABC123',
    isOwner: true,
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
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Fitur ini hanya tersedia di mode *STORE*!`)
    }
    
    const config = require('../../config')
    if (!config.pakasir?.sandbox) {
        return m.reply(`❌ Simulasi hanya tersedia di *sandbox mode*!\n\n> Set \`sandbox: true\` di config.js`)
    }
    
    const orderId = m.text?.trim().toUpperCase()
    
    if (!orderId) {
        const pendingOrders = orderPoller.getOrdersByGroup(m.chat)
            .filter(o => o.status === 'pending')
            .slice(0, 5)
        
        if (pendingOrders.length === 0) {
            return m.reply(`❌ Tidak ada order pending untuk disimulasi!`)
        }
        
        let txt = `⚠️ *sɪᴍᴜʟᴀsɪ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n`
        txt += `> Pilih order untuk disimulasi:\n\n`
        
        pendingOrders.forEach(order => {
            txt += `> \`${m.prefix}simulatepay ${order.orderId}\`\n`
            txt += `   💰 Rp ${order.total.toLocaleString('id-ID')}\n\n`
        })
        
        return m.reply(txt)
    }
    
    const order = orderPoller.getOrder(orderId)
    
    if (!order) {
        m.react('❌')
        return m.reply(`❌ Order tidak ditemukan: \`${orderId}\`\n\n> Cek order ID di \`${m.prefix}myorder\``)
    }
    
    if (order.status !== 'pending') {
        m.react('❌')
        return m.reply(`❌ Order status: *${order.status}*\n\n> Hanya order *pending* yang bisa disimulasi`)
    }
    
    await m.reply(`⏳ *ᴍᴇɴsɪᴍᴜʟᴀsɪ ᴘᴇᴍʙᴀʏᴀʀᴀɴ...*`)
    
    try {
        await pakasir.simulatePayment(orderId, order.total)
    } catch (e) {
        console.log('[SimulatePay] Pakasir simulation:', e.message)
    }
    
    const updated = orderPoller.updateOrder(orderId, {
        status: 'paid',
        completedAt: new Date().toISOString(),
        paymentMethod: order.paymentMethod || 'qris'
    })
    
    if (!updated) {
        m.react('❌')
        return m.reply(`❌ Gagal update order: \`${orderId}\``)
    }
    
    const items = order.items?.map(it => `${it.name} x${it.qty}`).join(', ') || '-'
    
    m.react('✅')
    
    await sock.sendMessage(m.chat, {
        text: `✅ *ᴘᴇᴍʙᴀʏᴀʀᴀɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
              `> Order ID: \`${orderId}\`\n` +
              `> Item: ${items}\n` +
              `> Total: *Rp ${order.total.toLocaleString('id-ID')}*\n` +
              `> Metode: *${order.paymentMethod?.toUpperCase() || 'QRIS'}*\n\n` +
              `@${order.buyerJid.split('@')[0]} detail produk dikirim via chat pribadi! 🎉`,
        mentions: [order.buyerJid]
    }, { quoted: m })
    
    let deliveredDetail = null
    
    if (order.items?.[0]?.id) {
        try {
            const currentGroupData = db.getGroup(order.groupId || m.chat)
            const product = currentGroupData?.storeConfig?.products?.find(p => p.id === order.items[0].id)
            
            if (product?.stockItems?.length > 0) {
                const stockItem = product.stockItems.shift()
                product.stock = product.stockItems.length
                db.setGroup(order.groupId || m.chat, currentGroupData)
                db.save()
                deliveredDetail = stockItem.detail
                console.log('[SimulatePay] Took stock item, remaining:', product.stockItems.length)
            }
        } catch (e) {
            console.error('[SimulatePay] Failed to get stock item:', e.message)
        }
    }
    
    const detailToSend = deliveredDetail || order.productDetail
    
    if (detailToSend) {
        try {
            let detailMsg = `🎁 *ᴅᴇᴛᴀɪʟ ᴘᴇsᴀɴᴀɴ*\n\n`
            detailMsg += `> Order ID: \`${orderId}\`\n`
            detailMsg += `> Item: ${items}\n`
            detailMsg += `━━━━━━━━━━━━━━━\n\n`
            if (order.productDescription) {
                detailMsg += `📝 *Deskripsi:*\n${order.productDescription}\n\n`
            }
            detailMsg += `🔐 *Detail Produk:*\n${detailToSend}\n\n`
            detailMsg += `━━━━━━━━━━━━━━━\n`
            detailMsg += `> Terima kasih sudah berbelanja! 🙏`
            
            await sock.sendMessage(order.buyerJid, {
                text: detailMsg
            })
            
            console.log('[SimulatePay] Sent detail to:', order.buyerJid)
        } catch (e) {
            console.error('[SimulatePay] Failed to send detail:', e.message)
            await m.reply(`⚠️ Gagal kirim detail ke DM: ${e.message}`)
        }
    } else {
        await m.reply(`⚠️ Tidak ada stock items untuk produk ini!`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
