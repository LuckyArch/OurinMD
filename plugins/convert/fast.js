const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'fast',
    alias: ['speed', 'sped'],
    category: 'convert',
    description: 'Mengubah audio menjadi lebih cepat',
    usage: '.fast (reply audio/video)',
    example: '.fast',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let downloadFn = null
    let ext = 'mp3'
    
    if (m.isAudio || m.isVideo || m.message?.audioMessage || m.message?.videoMessage) {
        downloadFn = m.download
        ext = m.isVideo || m.message?.videoMessage ? 'mp4' : 'ogg'
    } else if (m.quoted?.isAudio || m.quoted?.isVideo || m.quoted?.message?.audioMessage || m.quoted?.message?.videoMessage) {
        downloadFn = m.quoted.download
        ext = m.quoted.isVideo || m.quoted.message?.videoMessage ? 'mp4' : 'ogg'
    }
    
    if (!downloadFn) {
        return m.reply(`⚡ *ғᴀsᴛ ᴀᴜᴅɪᴏ*\n\n> Reply audio/video dengan command ini`)
    }
    
    m.react('⚡')
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs...*`)
    
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
    
    const inputPath = path.join(tempDir, `input_${Date.now()}.${ext}`)
    const outputPath = path.join(tempDir, `fast_${Date.now()}.mp3`)
    
    try {
        const buffer = await downloadFn()
        fs.writeFileSync(inputPath, buffer)
        
        execSync(`ffmpeg -y -i "${inputPath}" -af "atempo=1.5" -vn "${outputPath}"`, { stdio: 'ignore' })
        
        const audioBuffer = fs.readFileSync(outputPath)
        
        await sock.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg'
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    } finally {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
