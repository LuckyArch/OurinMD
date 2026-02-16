const axios = require('axios')

const pluginConfig = {
    name: 'githubstalk',
    alias: ['ghstalk', 'stalkgh'],
    category: 'stalker',
    description: 'Stalk akun GitHub',
    usage: '.githubstalk <username>',
    example: '.githubstalk torvalds',
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
        return m.reply(`🐙 *ɢɪᴛʜᴜʙ sᴛᴀʟᴋ*\n\n> Masukkan username GitHub\n\n\`Contoh: ${m.prefix}githubstalk torvalds\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.baguss.xyz/api/stalker/github?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status) {
            m.react('❌')
            return m.reply(`❌ Username *${username}* tidak ditemukan`)
        }
        
        const d = res.data
        
        const caption = `🐙 *ɢɪᴛʜᴜʙ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${d.username}\n` +
            `📛 *Nama:* ${d.nickname || '-'}\n` +
            `🏢 *Company:* ${d.company || '-'}\n` +
            `📍 *Location:* ${d.location || '-'}\n\n` +
            `📦 *Public Repos:* ${d.public_repo}\n` +
            `👥 *Followers:* ${d.followers}\n` +
            `👤 *Following:* ${d.following}\n\n` +
            `📝 *Bio:*\n${d.bio || '-'}\n\n` +
            `🔗 ${d.url}`
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: { url: d.profile_pic },
            caption
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
