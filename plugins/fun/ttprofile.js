const axios = require('axios')

const pluginConfig = {
    name: ['ttprofile', 'tiktokprofile', 'ttcanvas'],
    alias: [],
    category: 'fun',
    description: 'Generate gambar profil TikTok',
    usage: '.ttprofile <username>|<displayName>|<bio>|<likes>|<followers>|<following>|<verified>',
    example: '.ttprofile luckyarchz|Lucky Archz|Developer|1000|9400|120|true',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const BASE_URL = 'https://api.denayrestapi.xyz'

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}ttprofile <data>\`\n\n` +
            `*Format:*\n` +
            `> username|displayName|bio|likes|followers|following|verified\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}ttprofile luckyarchz|Lucky|Dev|1000|9400|120|true\`\n\n` +
            `💡 Reply gambar untuk custom avatar`
        )
    }
    
    const parts = text.split('|').map(s => s.trim())
    const [username, displayName, bio, likes, followers, following, verified] = parts
    
    if (!username) {
        return m.reply(`❌ Username wajib diisi!`)
    }
    
    await m.reply(`⏳ *Generating TikTok profile...*`)
    
    try {
        let profileImageUrl = 'https://i.pinimg.com/736x/0c/b5/a4/0cb5a4c54ecd6475f559a07066cb1e87.jpg'
        
        try {
            profileImageUrl = await sock.profilePictureUrl(m.sender, 'image')
        } catch {}
        
        const params = new URLSearchParams({
            username: username || 'user',
            displayName: displayName || username || 'User',
            bio: bio || '',
            profileImageUrl,
            likes: likes || '0',
            followers: followers || '0',
            following: following || '0',
            verified: verified === 'true' ? 'true' : 'false'
        })
        
        const apiUrl = `${BASE_URL}/api/v1/maker/ttprofile?${params.toString()}`
        
        await sock.sendMessage(m.chat, {
            image: { url: apiUrl },
            caption: `🎵 *TikTok Profile*\n> @${username}`
        }, { quoted: m })
        
        m.react('🎵')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
