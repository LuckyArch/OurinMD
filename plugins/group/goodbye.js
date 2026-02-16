const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const { createGoodbyeCard } = require('../../src/lib/welcomeCard')
const { resolveAnyLidToJid } = require('../../src/lib/lidHelper')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'goodbye',
    alias: ['bye', 'leave'],
    category: 'group',
    description: 'Mengatur goodbye message untuk grup',
    usage: '.goodbye <on/off>',
    example: '.goodbye on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function buildGoodbyeMessage(participant, groupName, memberCount, customMsg = null) {
    const farewells = [
        `Sayonara`,
        `Sampai jumpa`,
        `Bye bye`,
        `Dadah`,
        `See you`,
        `Hati-hati`,
        `Oyasumi~`
    ]

    const quotes = [
        `Semoga langkahmu selalu dimudahkan ke depannya.`,
        `Terima kasih sudah jadi bagian dari grup ini.`,
        `Semoga kita bisa bertemu lagi di lain waktu.`,
        `Pintu selalu terbuka kalau suatu saat mau kembali.`,
        `Jaga diri baik-baik ya, tomodachi.`,
        `Kenangan di sini bakal tetap ada.`
    ]

    const emojis = ['🌙', '👋', '🥀', '💫', '😢', '🤍']

    const headers = [
`🌙 Oyasumi~ minna-san...
Hari ini satu tomodachi harus berpamitan.
Semoga perjalanan barunya penuh kebaikan.`,

`🥀 Minna-san...
Ada perpisahan kecil hari ini.
Terima kasih sudah pernah berjalan bersama.`,

`💫 Sayonara~
Bukan akhir, hanya sampai jumpa.
Semoga hari-harimu selalu hangat.`,

`🌌 Minna-san...
Satu bintang berpindah langit malam ini.
Doakan yang terbaik untuknya ya.`
    ]

    const farewell = farewells[Math.floor(Math.random() * farewells.length)]
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]
    const header = headers[Math.floor(Math.random() * headers.length)]
    const username = participant?.split('@')[0] || 'User'

    if (customMsg) {
        return customMsg
            .replace(/{user}/gi, `@${username}`)
            .replace(/{group}/gi, groupName || 'Grup')
            .replace(/{count}/gi, memberCount?.toString() || '0')
    }

    return `
${header}

${emoji} ${farewell}, *@${username}* 🤍

╭─〔 📌 *ɪɴꜰᴏ ɢʀᴏᴜᴘ* 〕─✧
│ 🏠 *Nama*        : \`${groupName}\`
│ 👥 *Sisa Member* : ${memberCount}
│ 📅 *Tanggal*     : ${require('moment-timezone')()
        .tz('Asia/Jakarta')
        .format('DD/MM/YYYY')}
╰──────────────────────✦

💌 *Pesan*
「 ${quote} 」

🌸 _Sampai jumpa lagi, tomodachi._ 🤍
`
}

async function sendGoodbyeMessage(sock, groupJid, participant, groupMeta) {
    try {
        const db = getDatabase()
        const groupData = db.getGroup(groupJid)
        
        if (groupData?.goodbye !== true && groupData?.leave !== true) return false

        const goodbyeType = db.setting('goodbyeType') || 1
        const { cacheParticipantLids, getCachedJid, isLid, isLidConverted, lidToJid } = require('../../src/lib/lidHelper')
        
        if (groupMeta?.participants) {
            cacheParticipantLids(groupMeta.participants)
        }
        
        let realParticipant = participant
        
        const cachedJid = getCachedJid(participant)
        if (cachedJid && !isLidConverted(cachedJid)) {
            realParticipant = cachedJid
        } else if (isLid(participant)) {
            const lidFormat = participant
            const cachedFromLid = getCachedJid(lidFormat)
            if (cachedFromLid && !isLidConverted(cachedFromLid)) {
                realParticipant = cachedFromLid
            } else {
                realParticipant = lidToJid(participant)
            }
        } else if (isLidConverted(participant)) {
            const lidNumber = participant.replace('@s.whatsapp.net', '')
            const lidFormat = lidNumber + '@lid'
            const cachedFromLid = getCachedJid(lidFormat)
            if (cachedFromLid && !isLidConverted(cachedFromLid)) {
                realParticipant = cachedFromLid
            }
        }
        
        const memberCount = groupMeta?.participants?.length || 0
        const groupName = groupMeta?.subject || 'Grup'
        
        let userName = realParticipant?.split('@')[0] || 'User'
        try {
            const pushName = await sock.getName(realParticipant)
            if (pushName && pushName.trim()) userName = pushName
        } catch {}
        let ppUrl = 'https://cdn.gimita.id/download/pp%20kosong%20wa%20default%20(1)_1769506608569_52b57f5b.jpg'
        try {
            ppUrl = await sock.profilePictureUrl(realParticipant, 'image') || ppUrl
        } catch {}

        const text = buildGoodbyeMessage(
            realParticipant,
            groupMeta?.subject,
            memberCount,
            groupData?.goodbyeMsg
        )

        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

        if (goodbyeType === 2) {
            await sock.sendMessage(groupJid, {
                text: 'Sampai Jumpa!',
                title: `Goodbye ${userName}`,
                subtitle: groupName,
                footer: `Sisa ${memberCount} Member`,
                cards: [
                    {
                        image: { url: ppUrl },
                        title: `Sayonara ${userName}!`,
                        body: `Terima kasih sudah bergabung di ${groupName}`,
                        footer: 'Semoga sukses selalu~',
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '👋 Selamat Tinggal',
                                    id: 'bye'
                                })
                            },
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '🌐 Website',
                                    url: config.info?.website || 'https://sc.ourin.my.id/'
                                })
                            }
                        ]
                    }
                ]
            })
        } else if (goodbyeType === 3) {
             await sock.sendMessage(groupJid, {
                image: { url: ppUrl },
                caption: text,
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 9999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `Goodbye ${userName}`,
                        body: `Sisa ${memberCount} Member`,
                        thumbnailUrl: ppUrl,
                        sourceUrl: config.saluran?.link || 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })
        } else if (goodbyeType === 4) {
            const { createGoodbyeCardV4 } = require('../../src/lib/welcomeCard')
            let canvasV4 = null
            try {
                canvasV4 = await createGoodbyeCardV4(userName, ppUrl, groupName, memberCount)
            } catch (e) {
                console.error('Goodbye V4 Error:', e)
            }

            if (canvasV4) {
                await sock.sendMessage(groupJid, {
                    image: canvasV4,
                    caption: text,
                    footer: config.bot.name,
                                        interactiveButtons: [
                                             {
                                                name: 'quick_reply',
                                                buttonParamsJson: JSON.stringify({
                                                    display_text: 'Selamat Tinggal Kawan',
                                                    id: 'bye'
                                                })
                                             }
                                        ],
                    contextInfo: {
                        mentionedJid: [realParticipant],
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            title: `GOODBYE FROM ${groupName.toUpperCase()}`,
                            body: `Remaining ${memberCount}`,
                            thumbnailUrl: ppUrl,
                            sourceUrl: config.saluran?.link || '',
                            mediaType: 1,
                            renderLargerThumbnail: false
                        }
                    }
                })
            } else {
                 await sock.sendMessage(groupJid, {
                    text: text,
                    mentions: [realParticipant]
                })
            }
        } else {
            let canvasBuffer = null
            try {
                canvasBuffer = await createGoodbyeCard(userName, ppUrl, groupName, memberCount.toLocaleString())
            } catch (e) {
                console.error('Goodbye Canvas Error:', e.message)
            }

            await sock.sendMessage(groupJid, {
                image: canvasBuffer,
                caption: text,
                mentions: [realParticipant],
                contextInfo: {
                    mentionedJid: [realParticipant],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    },
                    externalAdReply: {
                        sourceUrl: config.info?.website || 'https://sc.ourin.my.id/',
                        mediaUrl: config.info?.website || 'https://sc.ourin.my.id/',
                        mediaType: 3,
                        thumbnailUrl: ppUrl,
                        title: `Goodbye ${userName}`,
                        body: null,
                        renderLargerThumbnail: false
                    }
                }
            })
        }
        
        return true
    } catch (error) {
        console.error('Goodbye Error:', error)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    const sub2 = args[1]?.toLowerCase()
    const groupData = db.getGroup(m.chat) || {}
    const currentStatus = groupData.goodbye === true
    
    if (sub === 'on' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Hanya owner yang bisa menggunakan fitur ini!`)
        }
        
        m.react('⏳')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { goodbye: true, leave: true })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `✅ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏɴ*\n\n` +
                `> Goodbye diaktifkan di *${count}* grup!`
            )
        } catch (err) {
            m.react('❌')
            return m.reply(`❌ Error: ${err.message}`)
        }
    }
    
    if (sub === 'off' && sub2 === 'all') {
        if (!m.isOwner) {
            return m.reply(`❌ Hanya owner yang bisa menggunakan fitur ini!`)
        }
        
        m.react('⏳')
        
        try {
            const groups = await sock.groupFetchAllParticipating()
            const groupIds = Object.keys(groups)
            let count = 0
            
            for (const groupId of groupIds) {
                db.setGroup(groupId, { goodbye: false, leave: false })
                count++
            }
            
            m.react('✅')
            return m.reply(
                `❌ *ɢᴏᴏᴅʙʏᴇ ɢʟᴏʙᴀʟ ᴏꜰꜰ*\n\n` +
                `> Goodbye dinonaktifkan di *${count}* grup!`
            )
        } catch (err) {
            m.react('❌')
            return m.reply(`❌ Error: ${err.message}`)
        }
    }
    
    if (sub === 'on') {
        if (currentStatus) {
            return m.reply(
                `⚠️ *ɢᴏᴏᴅʙʏᴇ ᴀʟʀᴇᴀᴅʏ ᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *✅ ON*\n` +
                `> Goodbye sudah aktif di grup ini.\n\n` +
                `_Gunakan \`${m.prefix}goodbye off\` untuk menonaktifkan._`
            )
        }
        db.setGroup(m.chat, { goodbye: true, leave: true })
        return m.reply(
            `✅ *ɢᴏᴏᴅʙʏᴇ ᴀᴋᴛɪꜰ*\n\n` +
            `> Goodbye message berhasil diaktifkan!\n` +
            `> Member yang keluar akan diberi pesan.\n\n` +
            `_Gunakan \`${m.prefix}setgoodbye\` untuk custom pesan._`
        )
    }
    
    if (sub === 'off') {
        if (!currentStatus) {
            return m.reply(
                `⚠️ *ɢᴏᴏᴅʙʏᴇ ᴀʟʀᴇᴀᴅʏ ɪɴᴀᴄᴛɪᴠᴇ*\n\n` +
                `> Status: *❌ OFF*\n` +
                `> Goodbye sudah nonaktif di grup ini.\n\n` +
                `_Gunakan \`${m.prefix}goodbye on\` untuk mengaktifkan._`
            )
        }
        db.setGroup(m.chat, { goodbye: false, leave: false })
        return m.reply(
            `❌ *ɢᴏᴏᴅʙʏᴇ ɴᴏɴᴀᴋᴛɪꜰ*\n\n` +
            `> Goodbye message berhasil dinonaktifkan.\n` +
            `> Member yang keluar tidak akan diberi pesan.`
        )
    }
    
    m.reply(
        `👋 *ɢᴏᴏᴅʙʏᴇ sᴇᴛᴛɪɴɢs*\n\n` +
        `> Status: *${currentStatus ? '✅ ON' : '❌ OFF'}*\n\n` +
        `\`\`\`━━━ ᴘɪʟɪʜᴀɴ ━━━\`\`\`\n` +
        `> \`${m.prefix}goodbye on\` → Aktifkan\n` +
        `> \`${m.prefix}goodbye off\` → Nonaktifkan\n` +
        `> \`${m.prefix}goodbye on all\` → Global ON (owner)\n` +
        `> \`${m.prefix}goodbye off all\` → Global OFF (owner)\n` +
        `> \`${m.prefix}setgoodbye\` → Custom pesan\n` +
        `> \`${m.prefix}resetgoodbye\` → Reset default`
    )
}

module.exports = {
    config: pluginConfig,
    handler,
    sendGoodbyeMessage
}
