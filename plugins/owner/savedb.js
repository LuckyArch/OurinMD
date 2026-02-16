const fs = require('fs')
const path = require('path')
const config = require('../../config')

const pluginConfig = {
    name: 'savedb',
    alias: ['backupdb', 'downloaddb', 'getdb'],
    category: 'owner',
    description: 'Download file database',
    usage: '.savedb',
    example: '.savedb',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (!config.isOwner(m.sender)) {
        return m.reply('❌ *Owner Only!*')
    }
    
    const dbPath = path.join(process.cwd(), 'database', 'db.json')
    
    if (!fs.existsSync(dbPath)) {
        return m.reply(`❌ File database tidak ditemukan!`)
    }
    
    try {
        const stats = fs.statSync(dbPath)
        const data = fs.readFileSync(dbPath)
        
        const moment = require('moment-timezone')
        const now = moment().tz('Asia/Jakarta')
        const timestamp = now.format('YYYY-MM-DD_HH-mm-ss')
        const fileName = `db_backup_${timestamp}.json`
        
        await sock.sendMessage(m.chat, {
            document: data,
            fileName: fileName,
            mimetype: 'application/json',
            caption: `📦 *ᴅᴀᴛᴀʙᴀsᴇ ʙᴀᴄᴋᴜᴘ*\n\n` +
                `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n` +
                `┃ 📁 File: \`db.json\`\n` +
                `┃ 📊 Size: \`${(stats.size / 1024).toFixed(2)} KB\`\n` +
                `┃ 📅 Date: \`${now.format('DD/MM/YYYY')}\`\n` +
                `┃ ⏰ Time: \`${now.format('HH:mm:ss')}\`\n` +
                `╰┈┈┈┈┈┈┈┈⬡`
        }, { quoted: m })
        
    } catch (error) {
        await m.reply(`❌ Error: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
