const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'lookup',
    alias: ['dnslookup', 'dns', 'whois'],
    category: 'tools',
    description: 'DNS Lookup untuk domain',
    usage: '.lookup <domain>',
    example: '.lookup google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

let thumbTools = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'ourin-games.jpg')
    if (fs.existsSync(thumbPath)) thumbTools = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🔍 *ᴅɴs ʟᴏᴏᴋᴜᴘ*', body = 'Domain Info') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbTools) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbTools,
            mediaType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    let domain = m.args?.[0]
    
    if (!domain) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}lookup <domain>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}lookup google.com\``
        )
    }
    
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
    
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/.test(domain)) {
        return m.reply(`❌ *ғᴏʀᴍᴀᴛ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Contoh: \`google.com\``)
    }
    
    await m.react('⏳')
    await m.reply(`⏳ *ᴍᴇɴᴄᴀʀɪ ɪɴꜰᴏ ᴅᴏᴍᴀɪɴ...*`)
    
    try {
        const [dnsRes, whoisRes] = await Promise.allSettled([
            fetch(`https://api.hackertarget.com/dnslookup/?q=${domain}`).then(r => r.text()),
            fetch(`https://api.hackertarget.com/whois/?q=${domain}`).then(r => r.text())
        ])
        
        const dnsData = dnsRes.status === 'fulfilled' ? dnsRes.value : null
        const whoisData = whoisRes.status === 'fulfilled' ? whoisRes.value : null
        
        if (!dnsData && !whoisData) {
            await m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat memproses domain`)
        }
        
        let text = `🔍 *ᴅɴs ʟᴏᴏᴋᴜᴘ*\n\n`
        text += `> Domain: \`${domain}\`\n\n`
        
        if (dnsData && !dnsData.includes('error')) {
            const lines = dnsData.split('\n').filter(l => l.trim())
            const records = {}
            
            lines.forEach(line => {
                const parts = line.split(/\s+/)
                if (parts.length >= 2) {
                    const type = parts[parts.length - 2] || 'OTHER'
                    const value = parts[parts.length - 1]
                    if (!records[type]) records[type] = []
                    records[type].push(value)
                }
            })
            
            text += `╭┈┈⬡「 📋 *ᴅɴs ʀᴇᴄᴏʀᴅs* 」\n`
            if (records['A']) text += `┃ 🅰️ A: ${records['A'].slice(0, 3).join(', ')}\n`
            if (records['AAAA']) text += `┃ 🔢 AAAA: ${records['AAAA'].slice(0, 2).join(', ')}\n`
            if (records['MX']) text += `┃ 📧 MX: ${records['MX'].slice(0, 2).join(', ')}\n`
            if (records['NS']) text += `┃ 🌐 NS: ${records['NS'].slice(0, 3).join(', ')}\n`
            if (records['TXT']) text += `┃ 📝 TXT: ${records['TXT'].length} records\n`
            text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        }
        
        if (whoisData && !whoisData.includes('error') && whoisData.length < 2000) {
            const registrar = whoisData.match(/Registrar:\s*(.+)/i)?.[1] || '-'
            const created = whoisData.match(/Creation Date:\s*(.+)/i)?.[1] || '-'
            const expires = whoisData.match(/Expir.*Date:\s*(.+)/i)?.[1] || '-'
            const nameservers = whoisData.match(/Name Server:\s*(.+)/gi)?.slice(0, 2).map(ns => ns.split(':')[1]?.trim()) || []
            
            text += `╭┈┈⬡「 📄 *ᴡʜᴏɪs* 」\n`
            text += `┃ 🏢 Registrar: ${registrar.slice(0, 35)}\n`
            text += `┃ 📅 Created: ${created.slice(0, 20)}\n`
            text += `┃ ⏰ Expires: ${expires.slice(0, 20)}\n`
            if (nameservers.length > 0) text += `┃ 🌐 NS: ${nameservers.join(', ')}\n`
            text += `╰┈┈┈┈┈┈┈┈⬡`
        }
        
        await m.react('✅')
        await sock.sendMessage(m.chat, {
            text: text,
            contextInfo: getContextInfo('🔍 *ᴅɴs ʟᴏᴏᴋᴜᴘ*', domain)
        }, { quoted: m })
        
    } catch (e) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
