const axios = require('axios')
const cheerio = require('cheerio')
const FormData = require('form-data')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'terabox',
    alias: ['tb','tera'],
    category: 'download',
    description: 'Download file dari TeraBox',
    usage: '.terabox <url | nomor>',
    example: '.terabox https://1024terabox.com/s/xxxx',
    cooldown: 20,
    energi: 2,
    isEnabled: true
}

/* ===== THUMB ===== */

let thumbTera = null
try {
    const p = path.join(process.cwd(), 'assets/images/ourin-terabox.jpg')
    if (fs.existsSync(p)) thumbTera = fs.readFileSync(p)
} catch {}

/* ===== CONTEXT ===== */

function getCtx(title, body) {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbTera) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbTera,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

/* ===== SCRAPER ===== */

const BASE = 'https://terabxdownloader.org'
const AJAX = '/wp-admin/admin-ajax.php'

async function getNonce() {
    try {
        const { data } = await axios.get(BASE, { timeout: 20000 })
        const $ = cheerio.load(data)
        const js = $('#jquery-core-js-extra').html()
        if (!js) return null
        const m = js.match(/"nonce"\s*:\s*"([^"]+)"/)
        return m ? m[1] : null
    } catch {
        return null
    }
}

async function teraboxFetch(url) {
    const nonce = await getNonce()
    if (!nonce) return null

    const form = new FormData()
    form.append('action','terabox_fetch')
    form.append('url', url)
    form.append('nonce', nonce)

    try {
        const { data } = await axios.post(BASE + AJAX, form, {
            headers: form.getHeaders(),
            timeout: 30000
        })

        if (!data || !data.data) return null

        const raw = data.data

        return {
            files: (raw['📄 Files'] || []).map(v => ({
                name: v['📂 Name'],
                size: v['📏 Size'],
                link: v['🔽 Direct Download Link']
            }))
        }
    } catch {
        return null
    }
}

/* ===== SESSION ===== */

const teraSession = new Map()

/* ===== HANDLER ===== */

async function handler(m, { sock }) {
    const input = m.text?.trim()
    if (!input) return m.reply('📦 Kirim link TeraBox')

    /* download */
    if (/^\d+$/.test(input)) {
        const ses = teraSession.get(m.sender)
        if (!ses) return m.reply('❌ Session habis')

        const file = ses[Number(input)-1]
        if (!file) return m.reply('❌ Nomor tidak valid')

        await sock.sendMessage(m.chat, {
            document: { url: file.link },
            fileName: file.name,
            mimetype: 'application/octet-stream',
            contextInfo: getCtx('📦 TERABOX', file.name)
        }, { quoted: m })

        return
    }

    if (!input.includes('terabox') && !input.includes('1024terabox')) {
        return m.reply('❌ URL tidak valid')
    }

    m.react('📦')

    const data = await teraboxFetch(input)
    if (!data || !data.files.length) {
        m.react('❌')
        return m.reply('❌ Gagal mengambil file')
    }

    teraSession.set(m.sender, data.files)

    let text = `📦 *TERABOX*\n\n`
    data.files.forEach((f,i)=>{
        text += `${i+1}. ${f.name} (${f.size})\n`
    })
    text += `\nKirim: ${m.prefix}terabox <nomor>`

    await sock.sendMessage(m.chat, {
        text,
        contextInfo: getCtx('📦 TERABOX', `${data.files.length} Files`)
    }, { quoted: m })

    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
