const axios = require('axios')
const config = require('../../config')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/cpanelRoles')

const allCommands = VALID_SERVERS.map(v => `listadmin${v}`)
const allAliases = VALID_SERVERS.map(v => `admins${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'List semua admin panel (v1-v5)',
    usage: '.listadminv1 atau .listadminv2',
    example: '.listadminv1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
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
    
    const serverConfig = getServerConfig(pteroConfig, serverKey)
    const missingConfig = validateConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*`
        } else {
            txt += `> Isi di \`config.js\` bagian \`pterodactyl.server1\``
        }
        return m.reply(txt)
    }
    
    try {
        const res = await axios.get(`${serverConfig.domain}/api/application/users`, {
            headers: {
                'Authorization': `Bearer ${serverConfig.apikey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        
        const users = res.data.data || []
        const admins = users.filter(u => u.attributes.root_admin)
        
        if (admins.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ [${serverLabel}]*\n\n> Tidak ada admin terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴀᴅᴍɪɴ [${serverLabel}]*\n\n`
        txt += `> Total: *${admins.length}* admin\n\n`
        
        admins.forEach((u, i) => {
            const attr = u.attributes
            txt += `${i + 1}. *${attr.username}*\n`
            txt += `   └ ID: \`${attr.id}\` | Email: \`${attr.email}\`\n`
        })
        
        return m.reply(txt)
        
    } catch (err) {
        const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴀᴍʙɪʟ ᴅᴀᴛᴀ*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
