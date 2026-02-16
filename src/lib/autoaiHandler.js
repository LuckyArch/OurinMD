const gemini = require('../scraper/gemini')
const { getDatabase } = require('./database')

const userCooldowns = new Map()
const COOLDOWN_MS = 3000

const fallbackResponses = [
    'Hmm, aku sedang berpikir...',
    'Maaf, pikiranku sedang blank sebentar~',
    'Eh tunggu sebentar ya, aku loading dulu...',
    'Aduh, otakku lag nih, coba lagi ya!',
    'Hmm apa ya, bentar mikir dulu~'
]

function getFallbackResponse() {
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
}

function isOnCooldown(userId) {
    const lastTime = userCooldowns.get(userId)
    if (!lastTime) return false
    return Date.now() - lastTime < COOLDOWN_MS
}

function setCooldown(userId) {
    userCooldowns.set(userId, Date.now())
}

function buildContextFromHistory(autoai, senderNumber, botPreviousMessage, userMessage, pushName) {
    const sessions = autoai.sessions || {}
    const userSession = sessions[senderNumber] || {}
    const history = userSession.history || []
    
    let contextParts = []
    
    if (pushName && pushName !== 'Unknown') {
        contextParts.push(`User yang sedang berbicara denganmu bernama "${pushName}".`)
    }
    
    if (history.length > 0) {
        const recentHistory = history.slice(-5)
        const historyText = recentHistory.map((h, i) => {
            if (h.role === 'user') return `User: ${h.content}`
            return `Kamu: ${h.content}`
        }).join('\n')
        contextParts.push(`Riwayat percakapan sebelumnya:\n${historyText}`)
    }
    
    if (botPreviousMessage) {
        contextParts.push(`Kamu sebelumnya mengatakan: "${botPreviousMessage.substring(0, 300)}"`)
    }
    
    contextParts.push(`${pushName || 'User'} sekarang berkata: ${userMessage}`)
    
    return contextParts.join('\n\n')
}

function saveToHistory(autoai, senderNumber, role, content) {
    if (!autoai.sessions) autoai.sessions = {}
    if (!autoai.sessions[senderNumber]) {
        autoai.sessions[senderNumber] = { history: [], sessionId: null }
    }
    
    const history = autoai.sessions[senderNumber].history
    history.push({ role, content: content.substring(0, 500), timestamp: Date.now() })
    
    if (history.length > 20) {
        autoai.sessions[senderNumber].history = history.slice(-20)
    }
}

async function handleAutoAI(m, sock) {
    if (!m.isGroup) return false
    if (m.fromMe) return false
    
    const db = getDatabase()
    if (!db?.db?.data?.autoai) return false
    
    const autoai = db.db.data.autoai[m.chat]
    if (!autoai || !autoai.enabled) return false
    
    const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const botLid = sock.user?.id
    
    if (m.isCommand && m.command === 'autoai') return false
    
    if (m.isCommand && !m.isOwner) {
        return true
    }
    
    const isMentioned = m.mentionedJid?.some(jid => 
        jid === botId || jid === botLid || jid.includes(sock.user?.id?.split(':')[0])
    )
    
    let isBotQuoted = false
    if (m.quoted) {
        const quotedSender = m.quoted.sender || m.quoted.key?.participant
        isBotQuoted = quotedSender === botId || m.quoted.key?.fromMe
    }
    
    if (!isBotQuoted && !isMentioned) return false
    
    const userMessage = m.body || ''
    if (!userMessage || userMessage.trim() === '') return false
    
    const senderNumber = m.sender.split('@')[0]
    
    if (isOnCooldown(senderNumber)) {
        return false
    }
    
    const botPreviousMessage = m.quoted?.body || ''
    
    try {
        await sock.sendPresenceUpdate('composing', m.chat)
        setCooldown(senderNumber)
        
        if (!autoai.sessions) autoai.sessions = {}
        const userSession = autoai.sessions[senderNumber] || { history: [], sessionId: null }
        
        const contextMessage = buildContextFromHistory(
            autoai, 
            senderNumber, 
            botPreviousMessage, 
            userMessage,
            m.pushName
        )
        
        saveToHistory(autoai, senderNumber, 'user', userMessage)
        
        let aiResponse = ''
        
        try {
            const result = await gemini({
                message: contextMessage,
                instruction: autoai.instruction,
                sessionId: userSession.sessionId
            })
            
            autoai.sessions[senderNumber].sessionId = result.sessionId
            aiResponse = result.text || getFallbackResponse()
            
        } catch (apiError) {
            console.error('[AutoAI API Error]', apiError.message)
            aiResponse = getFallbackResponse()
        }
        
        aiResponse = aiResponse.replace(/\*\*(.+?)\*\*/g, '*$1*')
        
        saveToHistory(autoai, senderNumber, 'assistant', aiResponse)
        db.save()
        
        await sock.sendPresenceUpdate('paused', m.chat)
        
        const typingDelay = Math.min(aiResponse.length * 20, 2000)
        await new Promise(r => setTimeout(r, typingDelay))
        
        if (autoai.responseType === 'voice') {
            try {
                await sock.sendPresenceUpdate('recording', m.chat)
                
                const generateCustomTTS = require('../../src/scraper/topmedia')
                const axios = require('axios')
                const { exec } = require('child_process')
                const { promisify } = require('util')
                const fs = require('fs')
                const path = require('path')
                const execAsync = promisify(exec)
                
                const tempDir = path.join(process.cwd(), 'temp')
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true })
                }
                
                const audioUrl = await generateCustomTTS(null, aiResponse.substring(0, 500))
                const audioRes = await axios.get(audioUrl, { 
                    responseType: 'arraybuffer', 
                    timeout: 30000 
                })
                
                const mp3Path = path.join(tempDir, `autoai_${Date.now()}.mp3`)
                fs.writeFileSync(mp3Path, Buffer.from(audioRes.data))
                
                const oggPath = mp3Path.replace('.mp3', '.ogg')
                try {
                    await execAsync(`ffmpeg -y -i "${mp3Path}" -c:a libopus -b:a 64k -ac 1 -ar 48000 "${oggPath}"`, { timeout: 30000 })
                } catch {}
                
                let audioBuffer
                if (fs.existsSync(oggPath)) {
                    audioBuffer = fs.readFileSync(oggPath)
                    fs.unlinkSync(oggPath)
                } else {
                    audioBuffer = fs.readFileSync(mp3Path)
                }
                fs.unlinkSync(mp3Path)
                
                await sock.sendMessage(m.chat, {
                    audio: audioBuffer,
                    mimetype: fs.existsSync(oggPath) ? 'audio/ogg; codecs=opus' : 'audio/mpeg',
                    ptt: true
                }, { quoted: m })
                
                await sock.sendPresenceUpdate('paused', m.chat)
                
            } catch (voiceError) {
                console.error('[AutoAI Voice Error]', voiceError.message)
                await sock.sendMessage(m.chat, {
                    text: aiResponse
                }, { quoted: m })
            }
        } else {
            await sock.sendMessage(m.chat, {
                text: aiResponse
            }, { quoted: m })
        }
        
        return true
        
    } catch (error) {
        console.error('[AutoAI Error]', error.message)
        await sock.sendPresenceUpdate('paused', m.chat)
        
        try {
            await sock.sendMessage(m.chat, {
                text: getFallbackResponse()
            }, { quoted: m })
        } catch (e) {}
        
        return true
    }
}

function isAutoAIEnabled(chatId) {
    const db = getDatabase()
    if (!db?.db?.data?.autoai) return false
    return db.db.data.autoai[chatId]?.enabled || false
}

function getAutoAICharacter(chatId) {
    const db = getDatabase()
    if (!db?.db?.data?.autoai) return null
    return db.db.data.autoai[chatId]?.characterName || null
}

function clearUserSession(chatId, senderNumber) {
    const db = getDatabase()
    if (!db?.db?.data?.autoai?.[chatId]?.sessions?.[senderNumber]) return false
    delete db.db.data.autoai[chatId].sessions[senderNumber]
    db.save()
    return true
}

module.exports = {
    handleAutoAI,
    isAutoAIEnabled,
    getAutoAICharacter,
    clearUserSession
}
