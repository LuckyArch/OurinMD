const axios = require('axios')

const pluginConfig = {
    name: 'ytstalk',
    alias: ['youtubestalk', 'stalkyt'],
    category: 'stalker',
    description: 'Stalk channel YouTube',
    usage: '.ytstalk <username>',
    example: '.ytstalk mrbeast',
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
        return m.reply(`📺 *ʏᴏᴜᴛᴜʙᴇ sᴛᴀʟᴋ*\n\n> Masukkan username YouTube\n\n\`Contoh: ${m.prefix}ytstalk mrbeast\``)
    }
    
    m.react('🔍')
    
    try {
        const res = await axios.get(`https://api.baguss.xyz/api/stalker/ytstalk?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        })
        
        if (!res.data?.status || !res.data?.result) {
            m.react('❌')
            return m.reply(`❌ Channel *${username}* tidak ditemukan`)
        }
        
        const c = res.data.result.channelMetadata
        const videos = res.data.result.videoDataList
        
        let caption = `📺 *ʏᴏᴜᴛᴜʙᴇ sᴛᴀʟᴋ*\n\n` +
            `👤 *Username:* ${c.username}\n` +
            `👥 *Subscribers:* ${c.subscriberCount}\n` +
            `🎬 *Videos:* ${c.videoCount}\n\n` +
            `📝 *Description:*\n${c.description?.substring(0, 300) || '-'}${c.description?.length > 300 ? '...' : ''}\n\n` +
            `🔗 ${c.channelUrl}\n\n`
        
        if (videos?.length > 0) {
            caption += `📹 *ᴠɪᴅᴇᴏ ᴛᴇʀʙᴀʀᴜ:*\n`
            videos.slice(0, 5).forEach((v, i) => {
                caption += `${i+1}. ${v.title}\n   ⏱️ ${v.duration} | 👁️ ${v.viewCount}\n\n`
            })
        }
        
        m.react('✅')
        
        if (c.avatarUrl) {
            await sock.sendMessage(m.chat, {
                image: { url: c.avatarUrl },
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
