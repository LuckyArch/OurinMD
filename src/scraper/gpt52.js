const https = require('https')
const crypto = require('crypto')

const COOKIE_STR = '__Secure-authjs.callback-url=https%3A%2F%2Fdemo.chat-sdk.dev%2Fapi%2Fchat; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiVXNicXV0LWJsOXRjYmtuZTFwUklIZHNrbUxLczZ0bzdZRk1xV2pGVnhDQ0ZFbVBxR2NEbi04UGNYdXlVeWFCQmZGVFlaYkEtbjBZeFlOd2tlSVRjeWcifQ..hGvHEgPFgrgO2xeuHyYjBw.Km9d2qnP3VZtKP-xm3XfI-ygaDYP5gHOONG9c8fxgBefThBmVRmqkXvx5fm9x8n8NHKKz7EDx1YYGG4okcm7IcFJaJMOSk0wkgvO4VrSC0mBt321fH4gN76qqKhOLTrmy1tQa3OL1lRkscclS7II8wsKf62Y-8G7u2pmeLCtcXs0ShltjY2CltC5-6_UjTuG_p4dHbtI4rRgxWcvQyh-EwNSKwkDHzBVURHLnld1Eu8z07p5i25NwHGutf2kgTBQSlO7Zryrkwb7AWcg8CxW4QvB6fODf6m9ZS2Uf4rps04.73sZPy4T-mr1DS0pOZkZPH8Uip6kpHvn-3OW01ms6Qo; chat-model=openai/gpt-5.2'

const HEADERS = {
    'authority': 'demo.chat-sdk.dev',
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
    'cookie': COOKIE_STR,
    'referer': 'https://demo.chat-sdk.dev/chat',
    'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Android WebView";v="126"',
    'sec-ch-ua-mobile': '?1',
    'sec-ch-ua-platform': '"Android"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UQ1A.231205.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36',
    'x-requested-with': 'mark.via.gp'
}

const TIMEOUT_MS = 120000

async function gpt52(message) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('GPT-5.2 request timeout'))
        }, TIMEOUT_MS)
        
        const sessionReq = https.request({
            hostname: 'demo.chat-sdk.dev',
            path: '/api/auth/session',
            method: 'GET',
            headers: HEADERS,
            timeout: 30000
        }, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => {
                sendChat(message, timeout)
                    .then(resolve)
                    .catch(reject)
            })
        })
        
        sessionReq.on('timeout', () => {
            sessionReq.destroy()
            clearTimeout(timeout)
            reject(new Error('Session request timeout'))
        })
        
        sessionReq.on('error', (err) => {
            clearTimeout(timeout)
            reject(err)
        })
        
        sessionReq.end()
    })
}

function sendChat(textMessage, parentTimeout) {
    return new Promise((resolve, reject) => {
        const chatId = crypto.randomUUID()
        const messageId = crypto.randomUUID()
        
        const payload = JSON.stringify({
            message: {
                role: 'user',
                parts: [{ type: 'text', text: textMessage }],
                id: messageId
            },
            selectedChatModel: 'openai/gpt-5.2',
            selectedVisibilityType: 'private',
            id: chatId
        })
        
        const chatOptions = {
            hostname: 'demo.chat-sdk.dev',
            path: '/api/chat',
            method: 'POST',
            timeout: 90000,
            headers: {
                ...HEADERS,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(payload),
                'origin': 'https://demo.chat-sdk.dev'
            }
        }
        
        const chatReq = https.request(chatOptions, (res) => {
            let fullResponseText = ''
            let buffer = ''
            
            res.on('data', (chunk) => {
                buffer += chunk.toString()
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonStr = line.substring(6).trim()
                        if (jsonStr === '[DONE]') continue
                        
                        try {
                            const data = JSON.parse(jsonStr)
                            if (data.type === 'text-delta' && data.delta) {
                                fullResponseText += data.delta
                            }
                        } catch {}
                    }
                }
            })
            
            res.on('end', () => {
                if (parentTimeout) clearTimeout(parentTimeout)
                
                if (buffer && buffer.startsWith('data: ')) {
                    const jsonStr = buffer.substring(6).trim()
                    try {
                        const data = JSON.parse(jsonStr)
                        if (data.type === 'text-delta' && data.delta) {
                            fullResponseText += data.delta
                        }
                    } catch {}
                }
                
                if (fullResponseText && fullResponseText.trim().length > 0) {
                    resolve(fullResponseText.trim())
                } else {
                    reject(new Error('No response from GPT-5.2'))
                }
            })
            
            res.on('error', (err) => {
                if (parentTimeout) clearTimeout(parentTimeout)
                reject(err)
            })
        })
        
        chatReq.on('timeout', () => {
            chatReq.destroy()
            if (parentTimeout) clearTimeout(parentTimeout)
            reject(new Error('Chat request timeout'))
        })
        
        chatReq.on('error', (err) => {
            if (parentTimeout) clearTimeout(parentTimeout)
            reject(err)
        })
        
        chatReq.write(payload)
        chatReq.end()
    })
}

module.exports = gpt52