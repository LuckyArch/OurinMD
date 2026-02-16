const { getDatabase } = require('../../src/lib/database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'uplist',
    alias: ['editlist', 'updatelist'],
    category: 'store',
    description: 'Edit konten list store yang sudah ada (support gambar)',
    usage: '.uplist <nama> (reply pesan/gambar baru)',
    example: '.uplist freefire',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const STORE_IMAGES_DIR = './assets/store'

async function handler(m, { sock }) {
    const db = getDatabase()
    const listName = m.args[0]?.toLowerCase().trim()

    if (!listName) {
        const storeData = db.setting('storeList') || {}
        const available = Object.keys(storeData)
        return m.reply(
            `✏️ *ᴜᴘᴅᴀᴛᴇ ʟɪsᴛ sᴛᴏʀᴇ*\n\n` +
            `> Reply pesan teks atau gambar+caption\n` +
            `> Lalu ketik: \`${m.prefix}uplist <nama>\`\n\n` +
            `\`Contoh: ${m.prefix}uplist freefire\`\n\n` +
            (available.length > 0
                ? `> List tersedia: ${available.map(l => `\`${l}\``).join(', ')}`
                : `> Belum ada list tersedia`)
        )
    }

    const storeData = db.setting('storeList') || {}

    if (!storeData[listName]) {
        const available = Object.keys(storeData)
        if (available.length === 0) {
            return m.reply(`❌ Tidak ada list yang tersedia! Buat dulu dengan \`${m.prefix}addlist\``)
        }
        return m.reply(
            `❌ List \`${listName}\` tidak ditemukan!\n\n` +
            `> List tersedia: ${available.map(l => `\`${l}\``).join(', ')}`
        )
    }

    const quoted = m.quoted
    if (!quoted) {
        return m.reply(`❌ Reply pesan yang berisi konten baru!\n\n> Bisa reply teks atau gambar+caption`)
    }

    let content = quoted.text || quoted.body || quoted.caption || ''
    let imageBuffer = null
    let imagePath = storeData[listName].imagePath || null

    const isQuotedImage = quoted.isImage || (quoted.message?.imageMessage)

    if (isQuotedImage && quoted.download) {
        try {
            imageBuffer = await quoted.download()

            if (!fs.existsSync(STORE_IMAGES_DIR)) {
                fs.mkdirSync(STORE_IMAGES_DIR, { recursive: true })
            }

            if (storeData[listName].imagePath && fs.existsSync(storeData[listName].imagePath)) {
                fs.unlinkSync(storeData[listName].imagePath)
            }

            imagePath = path.join(STORE_IMAGES_DIR, `${listName}.jpg`)
            fs.writeFileSync(imagePath, imageBuffer)

            if (quoted.message?.imageMessage?.caption) {
                content = quoted.message.imageMessage.caption
            }
        } catch (e) {
            console.error('[UpList] Error downloading image:', e.message)
        }
    }

    if (!content || content.length < 5) {
        if (!imageBuffer && !storeData[listName].hasImage) {
            return m.reply(`❌ Konten terlalu pendek! Minimal 5 karakter.\n\n> Atau reply gambar dengan caption`)
        }
        if (imageBuffer) {
            content = `Lihat gambar untuk detail pricelist ${listName.toUpperCase()}`
        } else {
            content = storeData[listName].content
        }
    }

    const oldContent = storeData[listName].content

    storeData[listName] = {
        ...storeData[listName],
        content,
        imagePath,
        hasImage: imageBuffer ? true : storeData[listName].hasImage,
        updatedBy: m.sender,
        updatedByName: m.pushName || 'Owner',
        updatedAt: new Date().toISOString()
    }

    db.setting('storeList', storeData)

    m.react('✅')

    let replyText = `✅ *ʟɪsᴛ ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🏷️ ɴᴀᴍᴀ: \`${listName}\`\n` +
        `┃ 📝 ᴄᴏᴍᴍᴀɴᴅ: \`${m.prefix}${listName}\`\n` +
        `┃ 📷 ɢᴀᴍʙᴀʀ: \`${imageBuffer ? 'Diperbarui ✅' : (storeData[listName].hasImage ? 'Tetap' : 'Tidak')}\`\n` +
        `╰┈┈⬡\n\n` +
        `> Konten berhasil diperbarui`

    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: replyText
        }, { quoted: m })
    } else {
        await m.reply(replyText)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
