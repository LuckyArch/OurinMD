const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')

const pluginConfig = {
    name: 'daftar',
    alias: ['register', 'reg'],
    category: 'user',
    description: 'Daftar sebagai user bot untuk mendapatkan rewards',
    usage: '.daftar <nama>',
    example: '.daftar Zann',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    skipRegistration: true
}

if (!global.registrationSessions) global.registrationSessions = {}

const SESSION_TIMEOUT = 300000

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (user?.isRegistered) {
        return m.reply(
            `✅ Kamu sudah terdaftar!\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴀᴛᴀ* 」\n` +
            `┃ 📛 Nama: *${user.regName || '-'}*\n` +
            `┃ 🎂 Umur: *${user.regAge || '-'}*\n` +
            `┃ 👤 Gender: *${user.regGender || '-'}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Untuk unregister: \`${m.prefix}unreg\``
        )
    }
    
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `📝 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ*\n\n` +
            `> Masukkan nama kamu!\n\n` +
            `*Contoh:*\n` +
            `\`${m.prefix}daftar Zann\`\n\n` +
            `*Rewards:*\n` +
            `> 💰 +${(config.registration?.rewards?.koin || 30000).toLocaleString('id-ID')} Koin\n` +
            `> ⚡ +${config.registration?.rewards?.energi || 300} Energi\n` +
            `> ⭐ +${(config.registration?.rewards?.exp || 300000).toLocaleString('id-ID')} EXP`
        )
    }
    
    if (name.length < 2 || name.length > 30) {
        return m.reply(`❌ Nama harus 2-30 karakter!`)
    }
    
    global.registrationSessions[m.sender] = {
        step: 'age',
        name: name,
        age: null,
        gender: null,
        chatJid: m.chat,
        startedAt: Date.now(),
        timeout: setTimeout(() => {
            if (global.registrationSessions[m.sender]) {
                delete global.registrationSessions[m.sender]
            }
        }, SESSION_TIMEOUT)
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    await sock.sendMessage(m.chat, {
        text: `📝 *ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ - sᴛᴇᴘ 1/2*\n\n` +
            `Halo *${name}*! 👋\n\n` +
            `> Berapa umur kamu?\n\n` +
            `*Reply pesan ini dengan umur kamu*\n` +
            `Contoh: \`17\``,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    m.react('📝')
}

async function registrationAnswerHandler(m, sock) {
    if (!m.body) return false
    if (m.isCommand) return false
    
    const session = global.registrationSessions[m.sender]
    if (!session) return false
    
    const text = m.body.trim()
    const db = getDatabase()
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    if (session.step === 'age') {
        const age = parseInt(text)
        
        if (isNaN(age) || age < 5 || age > 100) {
            await m.reply(`❌ Umur tidak valid! Masukkan angka 5-100.\n\n> Contoh: \`17\``)
            return true
        }
        
        session.age = age
        session.step = 'gender'
        
        await sock.sendMessage(m.chat, {
            text: `📝 *ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ - sᴛᴇᴘ 2/2*\n\n` +
                `> Pilih gender kamu:\n\n` +
                `┃ 👨 *Laki-laki* / *Cowok* / *L*\n` +
                `┃ 👩 *Perempuan* / *Cewek* / *P*\n\n` +
                `*Reply pesan ini dengan pilihanmu*`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        return true
    }
    
    if (session.step === 'gender') {
        let gender = null
        const lowText = text.toLowerCase()
        
        if (/^(laki[-\s]?laki|cowok?|cowo|l|male|pria)$/i.test(lowText)) {
            gender = 'Laki-laki'
        } else if (/^(perempuan|cewek?|cewe|p|female|wanita)$/i.test(lowText)) {
            gender = 'Perempuan'
        }
        
        if (!gender) {
            await m.reply(
                `❌ Gender tidak valid!\n\n` +
                `> Ketik: *Laki-laki* / *Cowok* / *L*\n` +
                `> Atau: *Perempuan* / *Cewek* / *P*`
            )
            return true
        }
        
        session.gender = gender
        
        clearTimeout(session.timeout)
        
        const rewards = config.registration?.rewards || { koin: 30000, energi: 300, exp: 300000 }
        
        db.setUser(m.sender, {
            isRegistered: true,
            regName: session.name,
            regAge: session.age,
            regGender: gender
        })
        
        db.updateKoin(m.sender, rewards.koin)
        db.updateEnergi(m.sender, rewards.energi)
        db.updateExp(m.sender, rewards.exp)
        
        await db.save()
        
        delete global.registrationSessions[m.sender]
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴘᴇɴᴅᴀꜰᴛᴀʀᴀɴ ʙᴇʀʜᴀsɪʟ!*\n\n` +
                `Selamat datang, *${session.name}*! 🎉\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴀᴛᴀ* 」\n` +
                `┃ 📛 Nama: *${session.name}*\n` +
                `┃ 🎂 Umur: *${session.age} tahun*\n` +
                `┃ 👤 Gender: *${gender}*\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅs* 」\n` +
                `┃ 💰 +${rewards.koin.toLocaleString('id-ID')} Koin\n` +
                `┃ ⚡ +${rewards.energi} Energi\n` +
                `┃ ⭐ +${rewards.exp.toLocaleString('id-ID')} EXP\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Selamat menggunakan bot! 🚀`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        await m.react('🎉')
        
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    registrationAnswerHandler
}
