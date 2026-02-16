const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'addpartner',
    alias: ['delpartner', 'listpartner', 'cekpartner'],
    category: 'owner',
    description: 'Kelola daftar partner bot',
    usage: '.addpartner <nomor/@tag> [hari]\n.delpartner <nomor/@tag>\n.listpartner\n.cekpartner <nomor/@tag>',
    example: '.addpartner 6281234567890 30',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function extractNumber(m) {
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    if (m.quoted?.sender) return m.quoted.sender

    const text = m.args?.join(' ')?.trim() || ''
    const match = text.match(/(\d{10,15})/)
    if (match) return `${match[1]}@s.whatsapp.net`

    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command?.toLowerCase()
    if (!db.data.partner) db.data.partner = []
    if (cmd === 'addpartner') {
        const target = extractNumber(m)
        if (!target) {
            return m.reply(
                `🤝 *ᴀᴅᴅ ᴘᴀʀᴛɴᴇʀ*\n\n` +
                `> Cara pakai:\n` +
                `> \`${m.prefix}addpartner @tag [hari]\`\n` +
                `> \`${m.prefix}addpartner 6281xxx 30\`\n\n` +
                `> Default: 30 hari`
            )
        }
        let targetNumber = target.replace(/@.+/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }
        if (config.isOwner(targetNumber)) {
            return m.reply(`⚠️ @${targetNumber} sudah menjadi owner!`, { mentions: [target] })
        }
        const existingIndex = db.data.partner.findIndex(p => p.id === targetNumber)
        const days = parseInt(m.args?.find(a => /^\d+$/.test(a) && a.length <= 4)) || 30
        const pushName = m.quoted?.pushName || m.pushName || 'Unknown'
        const now = Date.now()
        let newExpired
        let message = ''
        if (existingIndex !== -1) {
            const currentExpired = db.data.partner[existingIndex].expired || now
            const baseTime = currentExpired > now ? currentExpired : now
            newExpired = baseTime + (days * 24 * 60 * 60 * 1000)
            
            db.data.partner[existingIndex].expired = newExpired
            db.data.partner[existingIndex].name = pushName
            message = `Partner diperpanjang`
        } else {
            newExpired = now + (days * 24 * 60 * 60 * 1000)
            db.data.partner.push({
                id: targetNumber,
                expired: newExpired,
                name: pushName,
                addedAt: now
            })
            message = `Berhasil ditambahkan`
        }

        db.save()

        const expDate = new Date(newExpired).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        })

        await m.reply(
            `✅ *ᴘᴀʀᴛɴᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
            `> 👤 @${targetNumber}\n` +
            `> ⏳ Durasi: *${days} hari*\n` +
            `> 📅 Expired: *${expDate}*\n\n` +
            `> ${message}`,
            { mentions: [target] }
        )
        return
    }

    if (cmd === 'delpartner') {
        const target = extractNumber(m)
        if (!target) {
            return m.reply(`⚠️ Tag atau reply user yang ingin dihapus dari partner.`)
        }
        let targetNumber = target.replace(/@.+/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }

        const initialLength = db.data.partner.length
        db.data.partner = db.data.partner.filter(p => p.id !== targetNumber)
        
        if (db.data.partner.length < initialLength) {
            db.save()
            await m.reply(
                `✅ @${targetNumber} dihapus dari partner.`,
                { mentions: [target] }
            )
        } else {
            return m.reply(`⚠️ User tersebut bukan partner.`)
        }
        return
    }

    if (cmd === 'listpartner') {
        const partners = db.data.partner
        if (!partners.length) {
            return m.reply(`🤝 *ᴅᴀꜰᴛᴀʀ ᴘᴀʀᴛɴᴇʀ*\n\n> Belum ada partner.`)
        }

        let txt = `🤝 *ᴅᴀꜰᴛᴀʀ ᴘᴀʀᴛɴᴇʀ*\n\n`
        const mentions = []

        partners.forEach((p, i) => {
            const num = p.id
            const name = p.name || 'Unknown'
            const expDate = new Date(p.expired).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
            const remaining = Math.ceil((p.expired - Date.now()) / (1000 * 60 * 60 * 24))

            txt += `${i + 1}. @${num}\n`
            txt += `   > ${name} • ${expDate} (${remaining > 0 ? remaining + ' hari' : 'Expired'})\n`
            mentions.push(`${num}@s.whatsapp.net`)
        })

        txt += `\n> Total: *${partners.length}* partner`
        await m.reply(txt, { mentions })
        return
    }

    if (cmd === 'cekpartner') {
        const target = extractNumber(m) || `${m.senderNumber}@s.whatsapp.net`
        let targetNumber = target.replace(/@.+/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }

        const info = db.data.partner.find(p => p.id === targetNumber)

        if (!info) {
            return m.reply(`❌ @${targetNumber} bukan partner.`, { mentions: [target] })
        }

        const expDate = new Date(info.expired).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        const remaining = Math.ceil((info.expired - Date.now()) / (1000 * 60 * 60 * 24))
        const addedDate = new Date(info.addedAt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        })

        await m.reply(
            `🤝 *ɪɴꜰᴏ ᴘᴀʀᴛɴᴇʀ*\n\n` +
            `> 👤 @${targetNumber}\n` +
            `> 📛 Nama: *${info.name}*\n` +
            `> 📅 Ditambahkan: *${addedDate}*\n` +
            `> ⏳ Expired: *${expDate}*\n` +
            `> 🗓️ Sisa: *${remaining > 0 ? remaining + ' hari' : 'Expired'}*`,
            { mentions: [target] }
        )
        return
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
