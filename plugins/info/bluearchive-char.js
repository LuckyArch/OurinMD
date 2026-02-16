const axios = require('axios')
const config = require('../../config')

const pluginConfig = {
    name: 'bluearchive-char',
    alias: ['bachar', 'bluearchive', 'ba'],
    category: 'info',
    description: 'Lihat info character Blue Archive',
    usage: '.bluearchive-char <nama>',
    example: '.bluearchive-char shiroko',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

class BluArchive {
    findUrl(input, urls) {
        const clean = input.toLowerCase().replace(/\s+/g, '_')
        if (urls.includes(clean)) return clean
        
        const words = clean.split('_')
        const matches = urls.filter(url => 
            words.every(word => url.toLowerCase().includes(word))
        )
        
        return matches.length > 0 ? matches[0] : null
    }
    
    async list() {
        const { data } = await axios.get('https://api.dotgg.gg/bluearchive/characters')
        return data.map(item => ({
            ...item,
            imgSmall: item.imgSmall ? 'https://images.dotgg.gg/bluearchive/characters/' + item.imgSmall : null,
            img: item.img ? 'https://images.dotgg.gg/bluearchive/characters/' + item.img : null
        }))
    }
    
    async char(name) {
        const listc = await this.list()
        const urls = listc.map(c => c.url)
        const foundUrl = this.findUrl(name, urls)
        
        if (!foundUrl) {
            const suggestions = urls.filter(u => u.includes(name.toLowerCase().split(' ')[0])).slice(0, 5)
            throw new Error(`Character "${name}" tidak ditemukan.\n\n> Mungkin maksud: ${suggestions.join(', ') || 'tidak ada'}`)
        }
        
        const { data } = await axios.get(`https://api.dotgg.gg/bluearchive/characters/${foundUrl}`)
        return {
            ...data,
            imgSmall: data.imgSmall ? 'https://images.dotgg.gg/bluearchive/characters/' + data.imgSmall : null,
            img: data.img ? 'https://images.dotgg.gg/bluearchive/characters/' + data.img : null
        }
    }
}

async function handler(m, { sock }) {
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `🎮 *ʙʟᴜᴇ ᴀʀᴄʜɪᴠᴇ ᴄʜᴀʀᴀᴄᴛᴇʀ*\n\n` +
            `> Lihat info character Blue Archive\n\n` +
            `> *Contoh:*\n` +
            `> ${m.prefix}bluearchive-char shiroko\n` +
            `> ${m.prefix}bachar hoshino\n` +
            `> ${m.prefix}ba aru`
        )
    }
    
    await m.react('⏳')
    
    try {
        const ba = new BluArchive()
        const char = await ba.char(name)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        let caption = `🎮 *${char.name?.toUpperCase()}*\n\n`
        
        if (char.bio) {
            caption += `> ${char.bio.substring(0, 200)}${char.bio.length > 200 ? '...' : ''}\n\n`
        }
        
        caption += `╭┈┈⬡「 📋 *ᴘʀᴏꜰɪʟᴇ* 」\n`
        if (char.profile?.familyName) caption += `┃ 👤 Family: *${char.profile.familyName}*\n`
        if (char.profile?.age) caption += `┃ 🎂 Age: *${char.profile.age}*\n`
        if (char.profile?.height) caption += `┃ 📏 Height: *${char.profile.height}*\n`
        if (char.profile?.school) caption += `┃ 🏫 School: *${char.profile.school}*\n`
        if (char.profile?.club) caption += `┃ 🎯 Club: *${char.profile.club}*\n`
        if (char.profile?.hobby) caption += `┃ ⭐ Hobby: *${char.profile.hobby}*\n`
        if (char.profile?.CV) caption += `┃ 🎤 CV: *${char.profile.CV}*\n`
        caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        caption += `╭┈┈⬡「 ⚔️ *ʙᴀᴛᴛʟᴇ* 」\n`
        if (char.type) caption += `┃ 🏷️ Type: *${char.type}*\n`
        if (char.role) caption += `┃ 🎭 Role: *${char.role}*\n`
        if (char.position) caption += `┃ 📍 Position: *${char.position}*\n`
        if (char.profile?.weaponType) caption += `┃ 🔫 Weapon: *${char.profile.weaponType}*\n`
        if (char.profile?.weaponName) caption += `┃ ⚔️ Weapon Name: *${char.profile.weaponName}*\n`
        caption += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        if (char.skills && char.skills.length > 0) {
            caption += `╭┈┈⬡「 ✨ *sᴋɪʟʟs* 」\n`
            for (const skill of char.skills.slice(0, 4)) {
                caption += `┃ 🔹 *${skill.name}* (${skill.type})\n`
            }
            caption += `╰┈┈┈┈┈┈┈┈⬡`
        }
        
        if (char.img) {
            await sock.sendMessage(m.chat, {
                image: { url: char.img },
                caption,
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
        } else {
            await m.reply(caption)
        }
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
