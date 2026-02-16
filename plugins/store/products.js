const { getDatabase } = require('../../src/lib/database')
const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'products',
    alias: ['produk', 'listproduk', 'addproduct', 'addproduk', 'delproduct', 'delproduk', 'editproduct', 'productinfo'],
    category: 'store',
    description: 'Kelola produk toko',
    usage: '.products | .addproduct NAMA|HARGA|STOK|DESC|DETAIL',
    example: '.addproduct SPOTIFY PREMIUM|20000|5|Akun Premium 1 Bulan|Email: x Password: y',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

async function uploadToCatbox(buffer) {
    try {
        const form = new FormData()
        form.append('fileToUpload', buffer, { filename: 'product.jpg' })
        form.append('reqtype', 'fileupload')
        
        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        return res.data
    } catch (e) {
        return null
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const cmd = m.command?.toLowerCase()
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Fitur ini hanya tersedia di mode *STORE*!\n\n> Aktifkan: \`${m.prefix}botmode store\``)
    }
    
    if (!groupData.storeConfig) {
        groupData.storeConfig = { products: [], autoorder: false }
        db.setGroup(m.chat, groupData)
    }
    
    const products = groupData.storeConfig.products || []
    
    if (cmd === 'products' || cmd === 'produk' || cmd === 'listproduk') {
        const path = require('path')
        const fs = require('fs')
        const storeImage = path.join(process.cwd(), 'assets', 'images', 'ourin-store.jpg')
        
        if (products.length === 0) {
            const emptyTxt = `📦 *ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ*\n\n` +
                `> Belum ada produk!\n\n` +
                `*ᴛᴀᴍʙᴀʜ ᴘʀᴏᴅᴜᴋ:*\n` +
                `> \`${m.prefix}addproduct NAMA|HARGA|STOK|DESC|DETAIL\``
            
            if (fs.existsSync(storeImage)) {
                return sock.sendMessage(m.chat, {
                    image: fs.readFileSync(storeImage),
                    caption: emptyTxt
                }, { quoted: m })
            }
            return m.reply(emptyTxt)
        }
        
        let txt = `📦 *ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ*\n\n`
        txt += `> Total: *${products.length}* produk\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        products.forEach((p, i) => {
            const stock = p.stock === -1 ? '∞' : (p.stockItems?.length || p.stock || 0)
            const hasMedia = p.image || p.video ? '📷' : ''
            txt += `*${i + 1}.* ${hasMedia} ${p.name}\n`
            txt += `   💰 Rp ${p.price.toLocaleString('id-ID')}\n`
            txt += `   📦 Stok: ${stock}\n`
            if (p.description) txt += `   📝 ${p.description.substring(0, 30)}${p.description.length > 30 ? '...' : ''}\n`
            txt += `\n`
        })
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `> Pilih produk di bawah untuk order`
        
        const productRows = products.map((p, i) => ({
            title: `${i + 1}. ${p.name}`,
            description: `Rp ${p.price.toLocaleString('id-ID')} | Stok: ${p.stockItems?.length || p.stock || 0}`,
            id: `${m.prefix}order ${i + 1}`
        }))
        
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🛒 ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ',
                        rows: productRows
                    }]
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: '📦 ᴄᴇᴋ sᴛᴏᴄᴋ',
                    id: `${m.prefix}stock`
                })
            }
        ]
        
        let thumbnail = null
        if (fs.existsSync(storeImage)) {
            thumbnail = fs.readFileSync(storeImage)
        }
        
        return sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: '🛍️ Store',
                    body: 'Pilih produk untuk order',
                    thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            } : undefined,
            interactiveButtons
        }, { quoted: m })
    }
    
    if (cmd === 'productinfo') {
        const idx = parseInt(m.text?.trim()) - 1
        
        if (isNaN(idx) || idx < 0 || idx >= products.length) {
            return m.reply(`❌ Nomor produk tidak valid!\n\n> Lihat: \`${m.prefix}products\``)
        }
        
        const p = products[idx]
        const stock = p.stock === -1 ? '∞' : p.stock
        
        let txt = `📦 *ᴅᴇᴛᴀɪʟ ᴘʀᴏᴅᴜᴋ*\n\n`
        txt += `> *Nama:* ${p.name}\n`
        txt += `> *Harga:* Rp ${p.price.toLocaleString('id-ID')}\n`
        txt += `> *Stok:* ${stock}\n`
        if (p.description) txt += `\n📝 *Deskripsi:*\n${p.description}\n`
        txt += `\n━━━━━━━━━━━━━━━\n`
        txt += `> \`${m.prefix}order ${idx + 1}\` untuk pesan`
        
        if (p.image) {
            await sock.sendMessage(m.chat, {
                image: { url: p.image },
                caption: txt
            }, { quoted: m })
        } else if (p.video) {
            await sock.sendMessage(m.chat, {
                video: { url: p.video },
                caption: txt
            }, { quoted: m })
        } else {
            await m.reply(txt)
        }
        return
    }
    
    if (cmd === 'addproduct' || cmd === 'addproduk') {
        const text = m.text?.trim() || ''
        
        const parts = text.split('|').map(p => p.trim())
        
        if (parts.length < 2) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}addproduct NAMA|HARGA|STOK|DESC|DETAIL\`\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}addproduct SPOTIFY|20000|5|Akun Premium|Email: x;;Password: y\`\n\n` +
                `*ᴏᴘsɪᴏɴᴀʟ:*\n` +
                `> Kirim/reply gambar/video sebagai thumbnail\n` +
                `> STOK bisa "unlimited" atau angka\n` +
                `> DESC = deskripsi produk\n` +
                `> DETAIL = info rahasia (dikirim setelah order)\n\n` +
                `*ɴᴇᴡʟɪɴᴇ:* Gunakan ;; untuk baris baru`
            )
        }
        
        const name = parts[0]
        const price = parseInt(parts[1])
        let stock = parts[2] === 'unlimited' ? -1 : parseInt(parts[2]) || 999
        const description = (parts[3] || '').replace(/\\n/g, '\n').replace(/;;/g, '\n')
        const detail = (parts[4] || '').replace(/\\n/g, '\n').replace(/;;/g, '\n')
        
        if (!name || name.length < 2) {
            return m.reply(`❌ Nama produk minimal 2 karakter!`)
        }
        
        if (isNaN(price) || price < 1000) {
            return m.reply(`❌ Harga minimal Rp 1.000!`)
        }
        
        let imageUrl = null
        let videoUrl = null
        
        const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
        const isVideo = m.isVideo || (m.quoted && m.quoted.type === 'videoMessage')
        
        if (isImage || isVideo) {
            await m.reply(`⏳ *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ᴍᴇᴅɪᴀ...*`)
            
            let buffer
            if (m.quoted && m.quoted.isMedia) {
                buffer = await m.quoted.download()
            } else if (m.isMedia) {
                buffer = await m.download()
            }
            
            if (buffer) {
                const url = await uploadToCatbox(buffer)
                if (url && url.startsWith('http')) {
                    if (isImage) imageUrl = url
                    else if (isVideo) videoUrl = url
                }
            }
        }
        
        const newProduct = {
            id: Date.now(),
            name,
            price,
            stock,
            description,
            detail,
            image: imageUrl,
            video: videoUrl,
            createdAt: new Date().toISOString()
        }
        
        products.push(newProduct)
        groupData.storeConfig.products = products
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        
        let replyTxt = `✅ *ᴘʀᴏᴅᴜᴋ ᴅɪᴛᴀᴍʙᴀʜ*\n\n`
        replyTxt += `> Nama: *${name}*\n`
        replyTxt += `> Harga: *Rp ${price.toLocaleString('id-ID')}*\n`
        replyTxt += `> Stok: *${stock === -1 ? '∞' : stock}*\n`
        if (description) replyTxt += `> Deskripsi: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}\n`
        if (detail) replyTxt += `> Detail: *(tersimpan)*\n`
        if (imageUrl) replyTxt += `> Gambar: ✅\n`
        if (videoUrl) replyTxt += `> Video: ✅\n`
        replyTxt += `\n> Lihat: \`${m.prefix}products\``
        
        return m.reply(replyTxt)
    }
    
    if (cmd === 'delproduct' || cmd === 'delproduk') {
        const idx = parseInt(m.text?.trim()) - 1
        
        if (isNaN(idx) || idx < 0 || idx >= products.length) {
            return m.reply(`❌ Nomor produk tidak valid!\n\n> Lihat: \`${m.prefix}products\``)
        }
        
        const deleted = products.splice(idx, 1)[0]
        groupData.storeConfig.products = products
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `🗑️ *ᴘʀᴏᴅᴜᴋ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Nama: *${deleted.name}*\n` +
            `> Harga: *Rp ${deleted.price.toLocaleString('id-ID')}*`
        )
    }
    
    if (cmd === 'editproduct') {
        const match = m.text?.match(/^(\d+)\s+(price|stock|name|desc|detail|image)\s*(.*)$/i)
        
        if (!match) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}editproduct <no> <field> <value>\`\n\n` +
                `*ꜰɪᴇʟᴅ:* price, stock, name, desc, detail, image\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}editproduct 1 price 75000\`\n` +
                `> \`${m.prefix}editproduct 2 stock 50\`\n` +
                `> \`${m.prefix}editproduct 1 desc Deskripsi baru\`\n` +
                `> \`${m.prefix}editproduct 1 image\` (reply gambar)`
            )
        }
        
        const idx = parseInt(match[1]) - 1
        const field = match[2].toLowerCase()
        let value = match[3]?.trim() || ''
        
        if (idx < 0 || idx >= products.length) {
            return m.reply(`❌ Nomor produk tidak valid!`)
        }
        
        const product = products[idx]
        
        if (field === 'price') {
            value = parseInt(value)
            if (isNaN(value) || value < 1000) {
                return m.reply(`❌ Harga minimal Rp 1.000`)
            }
            product.price = value
        } else if (field === 'stock') {
            value = value === 'unlimited' ? -1 : parseInt(value)
            if (isNaN(value)) {
                return m.reply(`❌ Stok harus angka atau "unlimited"`)
            }
            product.stock = value
        } else if (field === 'name') {
            if (!value) return m.reply(`❌ Nama tidak boleh kosong!`)
            product.name = value
        } else if (field === 'desc') {
            product.description = value
        } else if (field === 'detail') {
            product.detail = value
        } else if (field === 'image') {
            const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
            if (!isImage) {
                return m.reply(`❌ Reply/kirim gambar baru!`)
            }
            
            await m.reply(`⏳ *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ɢᴀᴍʙᴀʀ...*`)
            
            let buffer
            if (m.quoted && m.quoted.isMedia) {
                buffer = await m.quoted.download()
            } else if (m.isMedia) {
                buffer = await m.download()
            }
            
            if (buffer) {
                const url = await uploadToCatbox(buffer)
                if (url && url.startsWith('http')) {
                    product.image = url
                } else {
                    return m.reply(`❌ Gagal upload gambar!`)
                }
            }
        }
        
        groupData.storeConfig.products = products
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `✅ *ᴘʀᴏᴅᴜᴋ ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
            `> Nama: *${product.name}*\n` +
            `> Harga: *Rp ${product.price.toLocaleString('id-ID')}*\n` +
            `> Stok: *${product.stock === -1 ? '∞' : product.stock}*`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}

