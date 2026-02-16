const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: ['delvps', 'deldroplet', 'deletevps'],
    alias: [],
    category: 'vps',
    description: 'Hapus VPS DigitalOcean',
    usage: '.delvps <id>',
    example: '.delvps 123456789',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function hasAccess(sender, isOwner) {
    if (isOwner) return true
    const cleanSender = sender?.split('@')[0]
    if (!cleanSender) return false
    const doConfig = config.digitalocean || {}
    return (doConfig.sellers || []).includes(cleanSender) || 
           (doConfig.ownerPanels || []).includes(cleanSender)
}

async function handler(m, { sock }) {
    const token = config.digitalocean?.token
    
    if (!token) {
        return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*`)
    }
    
    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*`)
    }
    
    const dropletId = m.text?.trim()
    if (!dropletId) {
        return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}delvps <droplet_id>\`\n\n> Gunakan \`${m.prefix}listvps\` untuk melihat ID`)
    }
    
    await m.reply(`🗑️ *ᴍᴇɴɢʜᴀᴘᴜs ᴠᴘs...*\n\n> ID: \`${dropletId}\``)
    
    try {
        await axios.delete(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        
        m.react('✅')
        await m.reply(`✅ *ᴠᴘs ʙᴇʀʜᴀsɪʟ ᴅɪʜᴀᴘᴜs*\n\n> ID: \`${dropletId}\``)
        
    } catch (err) {
        const errMsg = err?.response?.data?.message || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
