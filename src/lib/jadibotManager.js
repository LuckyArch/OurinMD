const QRCode = require('qrcode')
const path = require('path')
const fs = require('fs')
const { delay, DisconnectReason, jidNormalizedUser, useMultiFileAuthState } = require('ourin')
const { logger } = require('./colors')

const JADIBOT_AUTH_FOLDER = path.join(process.cwd(), 'session', 'jadibot')
const jadibotSessions = new Map()
const reconnectAttempts = new Map()
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_INTERVAL = 5000

if (!fs.existsSync(JADIBOT_AUTH_FOLDER)) {
    fs.mkdirSync(JADIBOT_AUTH_FOLDER, { recursive: true })
}

const captionPairing = `
🤖 *ᴊᴀᴅɪʙᴏᴛ - ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ*

Kode Pairing kamu:
\`%code\`

> Masukkan kode ini di WhatsApp kamu
> Settings > Linked Devices > Link a Device
`.trim()

const captionQR = `
🤖 *ᴊᴀᴅɪʙᴏᴛ - Qʀ ᴄᴏᴅᴇ*

Scan kode QR ini untuk menjadi bot.
Expired dalam %time detik.

> QR Count: %count/3
`.trim()

function getJadibotAuthPath(jid) {
    const id = jid.replace(/@.+/g, '')
    return path.join(JADIBOT_AUTH_FOLDER, id)
}

function isJadibotActive(jid) {
    const id = jid.replace(/@.+/g, '')
    return jadibotSessions.has(id)
}

function getActiveJadibots() {
    return Array.from(jadibotSessions.entries()).map(([id, data]) => ({
        id,
        jid: id + '@s.whatsapp.net',
        ...data
    }))
}

function getAllJadibotSessions() {
    const sessions = []
    if (!fs.existsSync(JADIBOT_AUTH_FOLDER)) return sessions
    
    const dirs = fs.readdirSync(JADIBOT_AUTH_FOLDER)
    for (const dir of dirs) {
        const credsPath = path.join(JADIBOT_AUTH_FOLDER, dir, 'creds.json')
        if (fs.existsSync(credsPath)) {
            sessions.push({
                id: dir,
                jid: dir + '@s.whatsapp.net',
                isActive: jadibotSessions.has(dir),
                credsPath
            })
        }
    }
    return sessions
}

const rateLimit = new Map()

const ERROR_MESSAGES = {
    401: { reason: 'Nomor tidak terdaftar WhatsApp', action: 'Pastikan nomor ini aktif di WhatsApp', fatal: true },
    403: { reason: 'Akses ditolak/dibanned', action: 'Nomor ini mungkin terkena banned WhatsApp', fatal: true },
    405: { reason: 'Metode tidak diizinkan', action: 'Coba lagi nanti', fatal: true },
    406: { reason: 'Nomor dibatasi', action: 'Nomor ini dibatasi oleh WhatsApp, tunggu beberapa jam', fatal: true },
    408: { reason: 'Request timeout', action: 'Koneksi lambat, akan mencoba reconnect', fatal: false },
    409: { reason: 'Konflik session', action: 'Session sedang digunakan di device lain', fatal: true },
    411: { reason: 'Autentikasi gagal', action: 'Perlu scan ulang QR/pairing', fatal: true },
    428: { reason: 'Rate limit', action: 'Terlalu banyak request, tunggu beberapa menit', fatal: true },
    440: { reason: 'Login required', action: 'Session expired, perlu login ulang', fatal: true },
    500: { reason: 'Server error WhatsApp', action: 'Server WhatsApp bermasalah', fatal: false },
    501: { reason: 'Tidak diimplementasi', action: 'Fitur belum didukung', fatal: true },
    503: { reason: 'Layanan tidak tersedia', action: 'WhatsApp sedang maintenance', fatal: false },
    515: { reason: 'Stream error', action: 'Akan mencoba reconnect', fatal: false }
}

const CONNECTION_CLOSED_REASONS = [
    { match: /Connection Closed/i, reason: 'Koneksi ditutup', action: 'Kemungkinan nomor dibanned atau ada masalah jaringan', fatal: true },
    { match: /write EOF/i, reason: 'Koneksi terputus', action: 'Masalah jaringan, akan mencoba reconnect', fatal: false },
    { match: /ECONNRESET/i, reason: 'Reset koneksi', action: 'Jaringan tidak stabil', fatal: false },
    { match: /ETIMEDOUT/i, reason: 'Timeout', action: 'Koneksi lambat', fatal: false },
    { match: /logged out/i, reason: 'Logged out', action: 'Akun di-logout dari perangkat', fatal: true },
    { match: /replaced/i, reason: 'Session replaced', action: 'Login di perangkat lain', fatal: true },
    { match: /Multidevice mismatch/i, reason: 'Session tidak valid', action: 'Perlu scan ulang', fatal: true },
    { match: /restart required/i, reason: 'Restart diperlukan', action: 'Akan restart otomatis', fatal: false },
    { match: /bad session/i, reason: 'Session rusak', action: 'Perlu scan ulang', fatal: true }
]

function parseDisconnectError(lastDisconnect) {
    const statusCode = lastDisconnect?.error?.output?.statusCode
    const errorMessage = lastDisconnect?.error?.message || 'Unknown error'
    
    if (statusCode && ERROR_MESSAGES[statusCode]) {
        return { 
            ...ERROR_MESSAGES[statusCode], 
            code: statusCode,
            message: errorMessage
        }
    }
    
    for (const pattern of CONNECTION_CLOSED_REASONS) {
        if (pattern.match.test(errorMessage)) {
            return {
                code: statusCode || 'N/A',
                reason: pattern.reason,
                action: pattern.action,
                fatal: pattern.fatal,
                message: errorMessage
            }
        }
    }
    
    return {
        code: statusCode || 'N/A',
        reason: 'Error tidak dikenal',
        action: 'Hubungi admin jika berulang',
        fatal: false,
        message: errorMessage
    }
}

async function startJadibot(sock, m, userJid, usePairing = true) {
    if (!userJid || typeof userJid !== 'string' || !userJid.includes('@s.whatsapp.net')) {
        throw new Error('Invalid User JID')
    }

    const id = userJid.replace(/@.+/g, '')
    
    if (usePairing) {
        const lastAttempt = rateLimit.get(id) || 0
        if (Date.now() - lastAttempt < 60000) {
            throw new Error('Tunggu 1 menit sebelum mencoba lagi.')
        }
        rateLimit.set(id, Date.now())
    }

    const authPath = getJadibotAuthPath(userJid)
    
    if (jadibotSessions.has(id)) {
        throw new Error('Jadibot sudah aktif untuk nomor ini!')
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(authPath)
    
    const { default: makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('ourin')
    const { version } = await fetchLatestBaileysVersion()
    const pinoLogger = require('pino')({ level: 'silent' })
    
    const childSock = makeWASocket({
        version,
        logger: pinoLogger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pinoLogger)
        },
        browser: ['Ubuntu', 'Chrome', '20.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: 20000,
        connectTimeoutMs: 20000,
        keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 150,
        fireInitQueries: true,
        emitOwnEvents: true,
        shouldSyncHistoryMessage: () => false,
        transactionOpts: { maxCommitRetries: 5, delayBetweenTriesMs: 500 }
    })
    
    let qrCount = 0
    let lastQRMsg = null
    let pairingCode = null
    let heartbeatInterval = null
    
    if (usePairing && !state.creds?.registered) {
        try {
            await delay(3000)
            pairingCode = await childSock.requestPairingCode(id)
            pairingCode = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode
            
            if (m && m.chat) {
                await sock.sendMessage(m.chat, {
                    text: captionPairing.replace(/%code/g, pairingCode)
                }, { quoted: m })
            } else {
                logger.info('Jadibot', `Pairing Code for ${id}: ${pairingCode}`)
            }
        } catch (e) {
            logger.error('Jadibot', 'Failed to get pairing code: ' + e.message)
            
            let errorMsg = 'Gagal mendapatkan pairing code'
            if (e.message?.includes('rate') || e.message?.includes('limit') || e.message?.includes('428')) {
                errorMsg = 'Rate limited! Tunggu 5-10 menit.'
            } else if (e.message?.includes('banned') || e.message?.includes('blocked')) {
                errorMsg = 'Nomor mungkin dibanned WhatsApp.'
            } else if (e.message?.includes('Connection Closed') || e.message?.includes('closed')) {
                errorMsg = 'Koneksi terputus. Coba lagi.'
            }
            
            try {
                await sock.sendMessage(m.chat, {
                    text: `❌ *ᴊᴀᴅɪʙᴏᴛ ɢᴀɢᴀʟ*\n\n> ${errorMsg}`
                }, { quoted: m })
            } catch {}
            
            try { childSock.end?.() } catch {}
            jadibotSessions.delete(id)
            reconnectAttempts.delete(id)
            throw new Error(errorMsg)
        }
    }
    
    childSock.ev.on('creds.update', saveCreds)
    
    childSock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update
        
        if (qr && !usePairing) {
            qrCount++
            if (qrCount > 3) {
                await sock.sendMessage(m.chat, { text: '❌ QR Code expired! Silakan coba lagi.' })
                if (lastQRMsg?.key) {
                    await sock.sendMessage(m.chat, { delete: lastQRMsg.key })
                }
                jadibotSessions.delete(id)
                reconnectAttempts.delete(id)
                try { childSock.ws.close() } catch {}
                return
            }
            
            try {
                const qrBuffer = await QRCode.toBuffer(qr, {
                    scale: 8,
                    margin: 4,
                    width: 256,
                    color: { dark: '#000000ff', light: '#ffffffff' }
                })
                
                if (lastQRMsg?.key) {
                    await sock.sendMessage(m.chat, { delete: lastQRMsg.key })
                }
                
                lastQRMsg = await sock.sendMessage(m.chat, {
                    image: qrBuffer,
                    caption: captionQR
                        .replace(/%time/g, '20')
                        .replace(/%count/g, qrCount)
                }, { quoted: m })
            } catch (e) {
                logger.error('Jadibot', 'Failed to send QR: ' + e.message)
            }
        }
        
        if (connection === 'open') {
            logger.info('Jadibot', `Connected: ${id}`)
            
            reconnectAttempts.delete(id)
            
            jadibotSessions.set(id, {
                sock: childSock,
                jid: childSock.user?.jid || userJid,
                startedAt: Date.now(),
                ownerJid: m.sender,
                status: 'connected',
                connectionReady: false,
                pendingMessages: []
            })
            
            heartbeatInterval = setInterval(() => {
                try {
                    if (childSock.ws?.readyState === 1) {
                    }
                } catch {}
            }, 30000)
            
            const session = jadibotSessions.get(id)
            if (session) {
                session.heartbeatInterval = heartbeatInterval
            }
            
            try {
                await childSock.sendPresenceUpdate('available')
            } catch {}
            
            await sock.sendMessage(m.chat, {
                text: `✅ *ᴊᴀᴅɪʙᴏᴛ ʙᴇʀʜᴀsɪʟ!*\n\n` +
                    `> Nomor: @${id}\n` +
                    `> Status: *Aktif*\n\n` +
                    `> Bot kamu sekarang aktif & siap digunakan!`,
                mentions: [userJid]
            }, { quoted: m })
            
            if (lastQRMsg?.key) {
                await sock.sendMessage(m.chat, { delete: lastQRMsg.key })
            }
            
            setTimeout(async () => {
                const sess = jadibotSessions.get(id)
                if (sess) {
                    sess.connectionReady = true
                    const pending = sess.pendingMessages || []
                    sess.pendingMessages = []
                    if (pending.length > 0) {
                        logger.info('Jadibot', `Flushing ${pending.length} buffered messages for ${id}`)
                        const { messageHandler } = require('../handler')
                        for (const bufferedMsg of pending) {
                            try {
                                await messageHandler(bufferedMsg, childSock, { isJadibot: true, jadibotId: id })
                            } catch {}
                        }
                    }
                }
            }, 2000)
        }
        
        if (connection === 'close') {
            const errorInfo = parseDisconnectError(lastDisconnect)
            
            logger.info('Jadibot', `Disconnected: ${id}, code: ${errorInfo.code}, reason: ${errorInfo.reason}`)
            
            const session = jadibotSessions.get(id)
            if (session?.heartbeatInterval) {
                clearInterval(session.heartbeatInterval)
            }
            
            const attempts = reconnectAttempts.get(id) || 0
            
            if (errorInfo.fatal || attempts >= MAX_RECONNECT_ATTEMPTS) {
                jadibotSessions.delete(id)
                reconnectAttempts.delete(id)
                
                if (errorInfo.fatal) {
                    try {
                        if (fs.existsSync(authPath)) {
                            fs.rmSync(authPath, { recursive: true, force: true })
                        }
                    } catch {}
                }
                
                try {
                    let statusEmoji = '❌'
                    if (errorInfo.code === 403 || errorInfo.reason?.includes('banned')) {
                        statusEmoji = '🚫'
                    } else if (errorInfo.code === 406 || errorInfo.reason?.includes('dibatasi')) {
                        statusEmoji = '⚠️'
                    }
                    
                    await sock.sendMessage(m.chat, {
                        text: `${statusEmoji} *ᴊᴀᴅɪʙᴏᴛ ᴅɪsᴄᴏɴɴᴇᴄᴛᴇᴅ*\n\n` +
                            `> Nomor: @${id}\n` +
                            `> Code: \`${errorInfo.code}\`\n` +
                            `> Alasan: *${errorInfo.reason}*\n` +
                            `> Info: ${errorInfo.action}\n\n` +
                            (errorInfo.fatal ? `> ⚠️ Session telah dihapus. Silakan .jadibot ulang jika diperlukan.` : ''),
                        mentions: [userJid]
                    })
                } catch {}
            } else {
                reconnectAttempts.set(id, attempts + 1)
                
                try {
                    await sock.sendMessage(m.chat, {
                        text: `🔄 *ᴊᴀᴅɪʙᴏᴛ ʀᴇᴄᴏɴɴᴇᴄᴛɪɴɢ...*\n\n` +
                            `> Nomor: @${id}\n` +
                            `> Alasan: ${errorInfo.reason}\n` +
                            `> Percobaan: ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}\n\n` +
                            `> Mencoba reconnect dalam ${RECONNECT_INTERVAL / 1000} detik...`,
                        mentions: [userJid]
                    })
                } catch {}
                
                setTimeout(() => {
                    startJadibot(sock, m, userJid, false).catch((e) => {
                        logger.error('Jadibot', `Reconnect failed for ${id}: ${e.message}`)
                        jadibotSessions.delete(id)
                        reconnectAttempts.delete(id)
                    })
                }, RECONNECT_INTERVAL)
            }
        }
    })
    
    const processedMessages = new Map()
    
    childSock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!childSock.user || !childSock.user.id) {
            childSock.user = { 
                id: jidNormalizedUser(id), 
                name: 'Jadibot' 
            }
        }

        if (type !== 'notify') return
        
        try {
            const { messageHandler } = require('../handler')
            for (const msg of messages) {
                if (!msg.message) continue
                const msgId = msg.key?.id
                if (msgId && processedMessages.has(msgId)) continue
                if (msgId) processedMessages.set(msgId, Date.now())
                if (msg.key?.fromMe) continue
                if (msg.key && msg.key.remoteJid === 'status@broadcast') continue
                
                const msgTimestamp = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now()
                const now = Date.now()
                const msgAge = now - msgTimestamp
                
                if (msgAge > 60 * 60 * 1000) continue
                
                const msgType = Object.keys(msg.message)[0]
                const ignoredTypes = [
                    "protocolMessage", "senderKeyDistributionMessage", "reactionMessage",
                    "stickerSyncRmrMessage", "encReactionMessage", "pollUpdateMessage",
                    "keepInChatMessage"
                ]
                
                if (ignoredTypes.includes(msgType)) continue
                
                const session = jadibotSessions.get(id)
                if (session && !session.connectionReady) {
                    session.pendingMessages = session.pendingMessages || []
                    session.pendingMessages.push(msg)
                    continue
                }
                
                await messageHandler(msg, childSock, { isJadibot: true, jadibotId: id })
            }
            const fiveMinAgo = Date.now() - 300000
            for (const [key, time] of processedMessages) {
                if (time < fiveMinAgo) processedMessages.delete(key)
            }
        } catch (e) {
            console.error(`[Jadibot ${id}] Handler Error:`, e)
            logger.error('Jadibot', `Handler error: ${e.message}`)
        }
    })
    
    return { sock: childSock, pairingCode }
}

async function stopJadibot(jid, deleteSession = false) {
    const id = jid.replace(/@.+/g, '')
    const session = jadibotSessions.get(id)
    
    if (session) {
        try {
            if (session.heartbeatInterval) {
                clearInterval(session.heartbeatInterval)
            }
            session.sock.ws.close()
            session.sock.ev.removeAllListeners()
        } catch {}
        jadibotSessions.delete(id)
    }
    
    reconnectAttempts.delete(id)
    
    if (deleteSession) {
        const authPath = getJadibotAuthPath(jid)
        if (fs.existsSync(authPath)) {
            fs.rmSync(authPath, { recursive: true, force: true })
        }
    }
    
    return true
}

async function stopAllJadibots() {
    const stopped = []
    for (const [id, session] of jadibotSessions) {
        try {
            if (session.heartbeatInterval) {
                clearInterval(session.heartbeatInterval)
            }
            session.sock.ws.close()
            session.sock.ev.removeAllListeners()
        } catch {}
        stopped.push(id)
    }
    jadibotSessions.clear()
    reconnectAttempts.clear()
    return stopped
}

async function restartJadibotSession(sock, sessionId) {
    const userJid = sessionId + '@s.whatsapp.net'
    try {
        logger.info('Jadibot', `Restoring session: ${sessionId}`)
        const mockM = { 
            chat: userJid, 
            sender: userJid,
            key: { 
                remoteJid: userJid, 
                fromMe: false, 
                id: 'restart-' + Date.now() 
            }
        } 
        await startJadibot(sock, mockM, userJid, false)
    } catch (e) {
        logger.error('Jadibot', `Failed to restore ${sessionId}: ${e.message}`)
    }
}

function getJadibotStatus(jid) {
    const id = jid.replace(/@.+/g, '')
    const session = jadibotSessions.get(id)
    if (!session) return null
    
    return {
        id,
        jid: session.jid,
        status: session.status || 'unknown',
        startedAt: session.startedAt,
        ownerJid: session.ownerJid,
        uptime: Date.now() - session.startedAt
    }
}

module.exports = {
    JADIBOT_AUTH_FOLDER,
    jadibotSessions,
    getJadibotAuthPath,
    isJadibotActive,
    getActiveJadibots,
    getAllJadibotSessions,
    startJadibot,
    stopJadibot,
    stopAllJadibots,
    restartJadibotSession,
    getJadibotStatus
}
