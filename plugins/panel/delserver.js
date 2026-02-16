const axios = require('axios')
const config = require('../../config')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/cpanelRoles')

const allCommands = VALID_SERVERS.map(v => `delserver${v}`)
const allAliases = VALID_SERVERS.map(v => `hapusserver${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'Hapus server dari panel (v1-v5)',
    usage: '.delserverv1 serverid',
    example: '.delserverv2 5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

function parseServerVersion(cmd) {
    const match = cmd.match(/v([1-5])$/i)
    if (!match) return { server: 'v1', serverKey: 's1' }
    return { server: 'v' + match[1], serverKey: 's' + match[1] }
}

function getServerConfig(pteroConfig, serverKey) {
    const serverConfigs = {
        's1': pteroConfig.server1,
        's2': pteroConfig.server2,
        's3': pteroConfig.server3,
        's4': pteroConfig.server4,
        's5': pteroConfig.server5
    }
    return serverConfigs[serverKey] || null
}

function validateConfig(serverConfig) {
    const missing = []
    if (!serverConfig?.domain) missing.push('domain')
    if (!serverConfig?.apikey) missing.push('apikey (PTLA)')
    return missing
}

function getAvailableServers(pteroConfig) {
    const available = []
    for (let i = 1; i <= 5; i++) {
        const cfg = pteroConfig[`server${i}`]
        if (cfg?.domain && cfg?.apikey) available.push(`v${i}`)
    }
    return available
}

async function handler(m, { sock }) {
    const pteroConfig = config.pterodactyl
    
    const { server: serverVersion, serverKey } = parseServerVersion(m.command)
    const serverLabel = serverVersion.toUpperCase()
    
    if (!hasFullAccess(m.sender, serverVersion, m.isOwner)) {
        const userRole = getUserRole(m.sender, serverVersion)
        return m.reply(
            `❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n` +
            `> Kamu tidak punya akses ke *${serverLabel}*\n` +
            `> Role kamu: *${userRole || 'Tidak ada'}*`
        )
    }
    
    const serverId = m.text?.trim()
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*\n`
            txt += `> Contoh: \`${m.prefix}delserver${available[0]} serverid\``
        } else {
            txt += `> Isi config pterodactyl di \`config.js\``
        }
        return m.reply(txt)
    }
    
    if (!serverId || isNaN(serverId)) {
        const available = getAvailableServers(pteroConfig)
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${m.command} serverid\`\n\n` +
            `> Server tersedia: *${available.join(', ') || 'none'}*\n` +
            `> Lihat ID dengan \`${m.prefix}listserver${serverVersion}\``
        )
    }
    
    try {
        const serverRes = await axios.get(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const server = serverRes.data.attributes
        
        await axios.delete(`${serverConfig.domain}/api/application/servers/${serverId}`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        return m.reply(
            `✅ *sᴇʀᴠᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Panel: *${serverLabel}*\n` +
            `> Server ID: \`${serverId}\`\n` +
            `> Nama: \`${server.name}\``
        )
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢʜᴀᴘᴜs sᴇʀᴠᴇʀ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
