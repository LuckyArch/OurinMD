const config = require('../../config')

const pluginConfig = {
    name: 'groupsettings',
    alias: ['gc', 'group', 'grup', 'groupset'],
    category: 'group',
    description: 'Menampilkan informasi dan pengaturan grup',
    usage: '.group',
    isGroup: true,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    const groupMetadata = await sock.groupMetadata(m.chat)
    const settings = db.getGroup(m.chat) || {}
    const status = (isActive) => isActive ? '🟢 ON' : '🔴 OFF'
    const text = `╭─── ❖ 𝗚𝗥𝗢𝗨𝗣 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 ❖ ───╮
│  📌 Group: ${groupMetadata.subject}
│
│  ⚙️ Control:
│  • open / close
│  • join: acc / reject
│  • disappearing: 90 / 7 / 1 / off
│
│  🔒 Proteksi:
│  • Antilink: ${status(settings.antilink)}
│  • Antivirtex: ${status(settings.antivirtex)}
│  • Antidelete: ${status(settings.antidelete)}
│  • AntiHidetag: ${status(settings.antihidetag)}
│  • AntiTagSW: ${status(settings.antitagsw)}
│  • AntiToxic: ${status(settings.antitoxic)}
│
│  👥 Notifikasi:
│  • Welcome: ${status(settings.welcome)}
│  • Leave: ${status(settings.leave)}
│  • Promote: ${status(settings.promote)}
│  • Demote: ${status(settings.demote)}
│
│  📖 Info:
│  • Intro: ${status(settings.intro)}
│  • NSFW: ${status(settings.nsfw)}
│  • Simi: ${status(settings.simi)}
│
│  ✍️ Custom Text:
│  • setwelcome <teks>
│  • setleave <teks>
│  • setpromote <teks>
│  • setdemote <teks>
│  • setintro <teks>
│
│  💡 Example:
│  ${m.prefix}group antilink on
│  ${m.prefix}group welcome off
╰────────────────────────╯`
    if (m.args && m.args.length > 0) {
        if (!m.isAdmin && !m.isOwner) {
            return m.reply('❌ Perintah ini hanya untuk Admin Grup!')
        }

        const feature = m.args[0].toLowerCase()
        const state = m.args[1]?.toLowerCase()

        const allowedFeatures = [
            'antilink', 'antivirtex', 'antidelete', 'antihidetag', 'antitagsw', 'antitoxic',
            'welcome', 'leave', 'promote', 'demote', 'intro', 'nsfw', 'simi'
        ]

        if (allowedFeatures.includes(feature)) {
            let value
            if (state === 'on' || state === 'enable' || state === '1') value = true
            else if (state === 'off' || state === 'disable' || state === '0') value = false
            else {
                value = !settings[feature]
            }
            const updates = {}
            updates[feature] = value
            db.setGroup(m.chat, updates)
            return m.reply(`✅ Berhasil mengubah *${feature}* menjadi *${value ? 'ON' : 'OFF'}*`)
        } else if (feature === 'open') {
             if (!m.isBotAdmin) return m.reply('❌ Bot harus menjadi Admin!')
             await sock.groupSettingUpdate(m.chat, 'announcement')
             return m.reply('✅ Grup berhasil ditutup (Hanya Admin yang dapat mengirim pesan)')
        } else if (feature === 'close') {
             if (!m.isBotAdmin) return m.reply('❌ Bot harus menjadi Admin!')
             await sock.groupSettingUpdate(m.chat, 'not_announcement')
             return m.reply('✅ Grup berhasil dibuka (Semua peserta dapat mengirim pesan)')
        }
    }
    m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
