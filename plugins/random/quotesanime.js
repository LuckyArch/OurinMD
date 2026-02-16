const axios = require('axios')

const pluginConfig = {
    name: 'quotesanime',
    alias: ['animequote', 'qanime', 'quoteanime'],
    category: 'random',
    description: 'Random quotes dari anime',
    usage: '.quotesanime',
    example: '.quotesanime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🎌')
    
    try {
        const res = await axios.get('https://animechan.io/api/v1/quotes/random', {
            timeout: 15000
        })
        
        if (!res.data?.data) {
            throw new Error('Quote tidak ditemukan')
        }
        
        const quote = res.data.data
        
        let txt = `🎌 *ᴀɴɪᴍᴇ ǫᴜᴏᴛᴇ*\n\n`
        txt += `╭┈┈⬡「 💬 *ǫᴜᴏᴛᴇ* 」\n`
        txt += `┃\n`
        txt += `┃ _"${quote.content}"_\n`
        txt += `┃\n`
        txt += `╰┈┈⬡\n\n`
        txt += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
        txt += `┃ ◦ ᴄʜᴀʀᴀᴄᴛᴇʀ: *${quote.character?.name || '-'}*\n`
        txt += `┃ ◦ ᴀɴɪᴍᴇ: *${quote.anime?.name || '-'}*\n`
        txt += `╰┈┈⬡`
        
        await m.reply(txt)
        m.react('✅')
        
    } catch (error) {
        try {
            const backupRes = await axios.get('https://api.siputzx.my.id/api/r/animequotes', {
                timeout: 15000
            })
            
            if (backupRes.data?.status && backupRes.data?.data) {
                const q = backupRes.data.data
                
                let txt = `🎌 *ᴀɴɪᴍᴇ ǫᴜᴏᴛᴇ*\n\n`
                txt += `╭┈┈⬡「 💬 *ǫᴜᴏᴛᴇ* 」\n`
                txt += `┃\n`
                txt += `┃ _"${q.quote}"_\n`
                txt += `┃\n`
                txt += `╰┈┈⬡\n\n`
                txt += `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n`
                txt += `┃ ◦ ᴄʜᴀʀᴀᴄᴛᴇʀ: *${q.character || '-'}*\n`
                txt += `┃ ◦ ᴀɴɪᴍᴇ: *${q.anime || '-'}*\n`
                txt += `╰┈┈⬡`
                
                await m.reply(txt)
                m.react('✅')
                return
            }
        } catch {}
        
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
