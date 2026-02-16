const axios = require('axios')

const pluginConfig = {
    name: 'pintereststalk',
    alias: ['pinstalk', 'stalkpin'],
    category: 'stalker',
    description: 'Stalk akun Pinterest',
    usage: '.pintereststalk <username>',
    example: '.pintereststalk shiroko',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const username = m.args[0]
    
    if (!username) {
        return m.reply(`📌 *ᴘɪɴᴛᴇʀᴇsᴛ sᴛᴀʟᴋ*\n\n> Masukkan username Pinterest\n\n\`Contoh: ${m.prefix}pintereststalk shiroko\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.baguss.xyz/api/stalker/pinterest?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.user) {
            m.react('❌')
            return m.reply(`❌ Username *${username}* tidak ditemukan`)
        }
        
        const u = res.data.user
        const s = u.stats
        
        const caption = `📌 *ᴘɪɴᴛᴇʀᴇsᴛ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${u.username}\n` +
            `📛 *Nama:* ${u.full_name}\n\n` +
            `📍 *Pins:* ${s.pins}\n` +
            `👥 *Followers:* ${s.followers}\n` +
            `👤 *Following:* ${s.following}\n` +
            `📋 *Boards:* ${s.boards}\n\n` +
            `📝 *Bio:*\n${u.bio || '-'}\n\n` +
            `🔗 ${u.profile_url}`
        
        m.react('✅')
        
        const profilePic = u.image?.original || u.image?.large
        if (profilePic) {
            await sock.sendMessage(m.chat, {
                image: { url: profilePic },
                caption
            }, { quoted: m })
        } else {
            await m.reply(caption)
        }
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
