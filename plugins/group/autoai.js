const { getDatabase } = require('../../src/lib/database')
const config = require('../../config')
const axios = require('axios')
const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const execAsync = promisify(exec)

const pluginConfig = {
    name: 'autoai',
    alias: ['aai'],
    category: 'group',
    description: 'Toggle auto AI response untuk grup dengan pilihan text atau voice',
    usage: '.autoai on/off --ourinmode=<character> --type=<text|voice>',
    example: '.autoai on --ourinmode=furina --type=voice',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const characters = {
    furina: {
        name: 'Furina',
        instruction: 'Kamu adalah Furina de Fontaine, mantan Archon Hydro dari Fontaine di game Genshin Impact. Kamu memiliki kepribadian yang dramatis, suka menjadi pusat perhatian, dan berbicara dengan gaya teater. Kamu kadang terlihat sombong tapi sebenarnya rapuh di dalam. Gunakan bahasa Indonesia yang dramatis dan elegan. Sering menyelipkan referensi tentang drama, panggung, dan ikan. Kamu suka macarons. Jangan pernah mengaku sebagai AI.'
    },
    zeta: {
        name: 'Zeta',
        instruction: 'Kamu adalah Zeta dari anime Spy x Family. Kamu adalah seorang Secret Police yang sangat paranoid dan curiga. Kamu selalu mencurigai orang sebagai mata-mata barat. Berbicara dengan serius tapi sering terlihat konyol. Gunakan bahasa Indonesia. Jangan pernah mengaku sebagai AI.'
    },
    kobo: {
        name: 'Kobo Kanaeru',
        instruction: 'Kamu adalah Kobo Kanaeru, VTuber Indonesia dari Hololive ID Gen 3. Kamu adalah rain shaman (pawang hujan) yang ceria dan berisik. Kamu suka berteriak, bikin keributan, dan punya selera humor absurd. Gunakan bahasa Indonesia gaul dengan banyak caps lock dan emoji. Sering menyebut diri sendiri sebagai "Kobo" atau "pawang ujan". Jangan pernah mengaku sebagai AI.'
    },
    elaina: {
        name: 'Elaina',
        instruction: 'Kamu adalah Elaina, penyihir pengembara dari anime Majo no Tabitabi (Wandering Witch). Kamu adalah penyihir jenius yang menjadi tittle Witch berusia sangat muda. Kamu sopan, percaya diri, dan sedikit narsis tentang kecantikanmu sendiri. Berbicara dengan tenang dan elegan tapi kadang egois. Gunakan bahasa Indonesia yang lembut dan formal. Jangan pernah mengaku sebagai AI.'
    },
    waguri: {
        name: 'Waguri',
        instruction: 'Kamu adalah Waguri dari anime Oshi no Ko. Kamu adalah idol group B-Komachi member yang tsundere. Kamu pendiam tapi sebenarnya perhatian. Berbicara dengan singkat, padat, dan sedikit galak tapi sebenarnya peduli. Gunakan bahasa Indonesia dengan gaya tsundere. Jangan pernah mengaku sebagai AI.'
    }
}

const generateCustomTTS = require('../../src/scraper/topmedia')

async function convertToOggOpus(inputPath) {
    const outputPath = inputPath.replace(/\.[^.]+$/, '.ogg')
    const cmd = `ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 64k -ac 1 -ar 48000 "${outputPath}"`
    
    try {
        await execAsync(cmd, { timeout: 60000 })
        if (fs.existsSync(outputPath)) {
            return outputPath
        }
    } catch (e) {
        console.log('[AutoAI] FFmpeg error:', e.message)
    }
    return null
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args || []
    const fullArgs = m.fullArgs || ''
    
    if (!m.isGroup) {
        return m.reply(`❌ Fitur ini hanya untuk grup!`)
    }
    
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ Hanya admin yang bisa menggunakan fitur ini!`)
    }
    
    if (!db.db.data.autoai) db.db.data.autoai = {}
    
    const mode = args[0]?.toLowerCase()
    const modeMatch = fullArgs.match(/--ourinmode=(\w+)/i)
    const typeMatch = fullArgs.match(/--type=(text|voice)/i)
    const charKey = modeMatch ? modeMatch[1].toLowerCase() : null
    const responseType = typeMatch ? typeMatch[1].toLowerCase() : 'text'
    
    if (!mode || !['on', 'off'].includes(mode)) {
        const charList = Object.entries(characters).map(([key, val]) => `> ${key} - ${val.name}`).join('\n')
        let txt = `🤖 *ᴀᴜᴛᴏ ᴀɪ*\n\n`
        txt += `> Mengaktifkan/menonaktifkan auto AI response\n\n`
        txt += `*Penggunaan:*\n`
        txt += `> .autoai on --ourinmode=<karakter> --type=<text|voice>\n`
        txt += `> .autoai off\n\n`
        txt += `*Karakter tersedia:*\n${charList}\n\n`
        txt += `*Response Type:*\n`
        txt += `> text - Reply dengan text biasa\n`
        txt += `> voice - Reply dengan voice note (TTS)\n\n`
        txt += `*Contoh:*\n`
        txt += `> .autoai on --ourinmode=furina --type=text\n`
        txt += `> .autoai on --ourinmode=kobo --type=voice`
        return m.reply(txt)
    }
    
    if (mode === 'off') {
        delete db.db.data.autoai[m.chat]
        db.save()
        return m.reply(`🤖 *ᴀᴜᴛᴏ ᴀɪ ᴅɪɴᴏɴᴀᴋᴛɪғᴋᴀɴ*\n\n> Auto AI untuk grup ini telah dimatikan\n> Semua command kembali aktif`)
    }
    
    if (!charKey || !characters[charKey]) {
        const charList = Object.keys(characters).join(', ')
        return m.reply(`❌ Karakter tidak valid!\n\n> Karakter tersedia: ${charList}\n\n> Contoh: .autoai on --ourinmode=furina --type=voice`)
    }
    
    db.db.data.autoai[m.chat] = {
        enabled: true,
        character: charKey,
        characterName: characters[charKey].name,
        instruction: characters[charKey].instruction,
        responseType: responseType,
        sessions: {},
        activatedBy: m.sender,
        activatedAt: new Date().toISOString()
    }
    db.save()
    
    let txt = `🤖 *ᴀᴜᴛᴏ ᴀɪ ᴅɪᴀᴋᴛɪғᴋᴀɴ*\n\n`
    txt += `╭┈┈⬡「 📋 *ɪɴғᴏ* 」\n`
    txt += `┃ 🎭 Karakter: *${characters[charKey].name}*\n`
    txt += `┃ 📢 Response: *${responseType === 'voice' ? '🎤 Voice Note' : '💬 Text'}*\n`
    txt += `┃ 👤 Diaktifkan: @${m.sender.split('@')[0]}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> ℹ️ Semua command (kecuali owner) dinonaktifkan\n`
    txt += `> ℹ️ Bot respond ketika di-reply atau di-tag\n`
    txt += responseType === 'voice' ? `> ℹ️ Response dalam bentuk voice note\n` : ''
    txt += `> ℹ️ Ketik *.autoai off* untuk menonaktifkan`
    
    await m.reply(txt, { mentions: [m.sender] })
}

async function generateVoiceResponse(text, sock, chatId, quotedMsg) {
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
    }
    
    try {
        const audioUrl = await generateCustomTTS(null, text)
        
        const audioRes = await axios.get(audioUrl, { 
            responseType: 'arraybuffer',
            timeout: 30000 
        })
        
        const mp3Path = path.join(tempDir, `tts_${Date.now()}.mp3`)
        fs.writeFileSync(mp3Path, Buffer.from(audioRes.data))
        
        const oggPath = await convertToOggOpus(mp3Path)
        
        if (oggPath && fs.existsSync(oggPath)) {
            const audioBuffer = fs.readFileSync(oggPath)
            
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            }, { quoted: quotedMsg })
            
            fs.unlinkSync(mp3Path)
            fs.unlinkSync(oggPath)
            
            return true
        } else {
            const audioBuffer = fs.readFileSync(mp3Path)
            
            await sock.sendMessage(chatId, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: quotedMsg })
            
            fs.unlinkSync(mp3Path)
            
            return true
        }
    } catch (e) {
        console.log('[AutoAI Voice] Error:', e.message)
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    characters,
    generateVoiceResponse
}
