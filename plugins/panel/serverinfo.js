const axios = require('axios')
const config = require('../../config')
const { hasFullAccess, getUserRole, VALID_SERVERS } = require('../../src/lib/cpanelRoles')

const allCommands = VALID_SERVERS.map(v => `serverinfo${v}`)
const allAliases = VALID_SERVERS.map(v => `sinfo${v}`)

const pluginConfig = {
    name: allCommands,
    alias: allAliases,
    category: 'panel',
    description: 'Info detail server (v1-v5)',
    usage: '.serverinfov1 serverid',
    example: '.serverinfov2 5',
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

function validateServerConfig(serverConfig) {
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

function formatBytes(bytes) {
    if (bytes === 0) return 'Unlimited'
    const mb = bytes
    if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
    return `${mb} MB`
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
    const missingConfig = validateServerConfig(serverConfig)
    
    if (missingConfig.length > 0) {
        const available = getAvailableServers(pteroConfig)
        let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`
        if (available.length > 0) {
            txt += `> Server tersedia: *${available.join(', ')}*`
        }
        return m.reply(txt)
    }
    
    if (!serverId || isNaN(serverId)) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${m.command} serverid\`\n\n` +
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
        
        const s = serverRes.data.attributes
        const limits = s.limits || {}
        const features = s.feature_limits || {}
        
        let txt = `📊 *ɪɴꜰᴏ sᴇʀᴠᴇʀ [${serverLabel}]*\n\n`
        txt += `╭─「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
        txt += `┃ 🆔 \`ɪᴅ\`: *${s.id}*\n`
        txt += `┃ 📛 \`ɴᴀᴍᴀ\`: *${s.name}*\n`
        txt += `┃ 👤 \`ᴏᴡɴᴇʀ ɪᴅ\`: *${s.user}*\n`
        txt += `┃ 📝 \`ᴅᴇsᴋʀɪᴘsɪ\`: *${s.description || '-'}*\n`
        txt += `┃ 📊 \`sᴛᴀᴛᴜs\`: *${s.suspended ? '⛔ Suspended' : '✅ Active'}*\n`
        txt += `╰───────────────\n\n`
        txt += `╭─「 🧠 *sᴘᴇsɪꜰɪᴋᴀsɪ* 」\n`
        txt += `┃ 💾 \`ʀᴀᴍ\`: *${formatBytes(limits.memory)}*\n`
        txt += `┃ ⚡ \`ᴄᴘᴜ\`: *${limits.cpu === 0 ? 'Unlimited' : limits.cpu + '%'}*\n`
        txt += `┃ 📦 \`ᴅɪsᴋ\`: *${formatBytes(limits.disk)}*\n`
        txt += `┃ 🔄 \`sᴡᴀᴘ\`: *${limits.swap} MB*\n`
        txt += `╰───────────────\n\n`
        txt += `╭─「 📦 *ꜰᴇᴀᴛᴜʀᴇ ʟɪᴍɪᴛs* 」\n`
        txt += `┃ 🗄️ \`ᴅᴀᴛᴀʙᴀsᴇ\`: *${features.databases}*\n`
        txt += `┃ 💾 \`ʙᴀᴄᴋᴜᴘ\`: *${features.backups}*\n`
        txt += `┃ 🔌 \`ᴀʟʟᴏᴄᴀᴛɪᴏɴs\`: *${features.allocations}*\n`
        txt += `╰───────────────`
        
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
