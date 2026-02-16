const axios = require('axios')
const config = require('../../config')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'tts',
    alias: ['texttospeech', 'say'],
    category: 'tts',
    description: 'Text to Speech dengan berbagai karakter suara',
    usage: '.tts <text>',
    example: '.tts Halo semua!',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const VOICES = {
    nahida: { name: 'Nahida (Exclusive)', key: 'nahida' },
    nami: { name: 'Nami', key: 'nami' },
    ana: { name: 'Ana (Female)', key: 'ana' },
    optimus: { name: 'Optimus Prime', key: 'optimus_prime' },
    goku: { name: 'Goku', key: 'goku' },
    elon: { name: 'Elon Musk', key: 'elon_musk' },
    mickey: { name: 'Mickey Mouse', key: 'mickey_mouse' },
    kendrick: { name: 'Kendrick Lamar', key: 'kendrick_lamar' },
    eminem: { name: 'Eminem', key: 'eminem' }
}

async function convertToOpus(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-i', inputPath,
            '-c:a', 'libopus',
            '-b:a', '64k',
            '-vbr', 'on',
            '-compression_level', '10',
            '-y',
            outputPath
        ]) 
        
        ffmpeg.on('close', (code) => {
            if (code === 0) resolve(true)
            else reject(new Error(`FFmpeg exited with code ${code}`))
        })
        
        ffmpeg.on('error', reject)
    })
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        let voiceList = `🎤 *ᴛᴇxᴛ ᴛᴏ sᴘᴇᴇᴄʜ*\n\n`
        voiceList += `> Gunakan: \`${m.prefix}tts <text>\`\n\n`
        voiceList += `📋 *ᴠᴏɪᴄᴇ ᴛᴇʀsᴇᴅɪᴀ:*\n`
        
        Object.entries(VOICES).forEach(([cmd, voice]) => {
            voiceList += `• \`${m.prefix}tts${cmd}\` - ${voice.name}\n`
        })
        
        voiceList += `\n> Contoh: \`${m.prefix}ttsnahida Halo!\``
        
        return m.reply(voiceList)
    }
    
    m.react('🎤')
    
    try {
        const res = await axios.get(`https://api.emiliabot.my.id/tools/text-to-speech?text=${encodeURIComponent(text)}`, {
            timeout: 60000
        })
        
        if (!res.data?.status || !res.data?.result?.length) {
            m.react('❌')
            return m.reply(`❌ Gagal generate suara. Coba lagi nanti.`)
        }
        
        const voices = res.data.result.filter(v => !v.error)
        if (voices.length === 0) {
            m.react('❌')
            return m.reply(`❌ Semua model error. Coba lagi nanti.`)
        }
        
        const randomVoice = voices[Math.floor(Math.random() * voices.length)]
        const voiceKey = Object.keys(randomVoice).find(k => k !== 'channel_id' && k !== 'voice_name' && k !== 'voice_id' && randomVoice[k]?.startsWith('https://'))
        const audioUrl = randomVoice[voiceKey]
        
        if (!audioUrl) {
            m.react('❌')
            return m.reply(`❌ Audio URL tidak ditemukan.`)
        }
        
        const tempDir = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
        
        const wavPath = path.join(tempDir, `tts_${Date.now()}.wav`)
        const opusPath = path.join(tempDir, `tts_${Date.now()}.ogg`)
        
        const audioRes = await axios.get(audioUrl, { responseType: 'arraybuffer' })
        fs.writeFileSync(wavPath, Buffer.from(audioRes.data))
        
        await convertToOpus(wavPath, opusPath)
        
        const opusBuffer = fs.readFileSync(opusPath)
        
        await sock.sendMessage(m.chat, {
            audio: opusBuffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
                externalAdReply: {
                    title: `🎤 ${randomVoice.voice_name || 'TTS'}`,
                    body: text.substring(0, 50),
                    thumbnailUrl: 'https://i.ibb.co/5xK7QnW/tts.png',
                    mediaType: 2
                }
            }
        }, { quoted: m })
        
        fs.unlinkSync(wavPath)
        fs.unlinkSync(opusPath)
        
        m.react('✅')
        
    } catch (err) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
