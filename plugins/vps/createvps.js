const axios = require('axios')
const config = require('../../config')

const VPS_SPECS = {
    'vps1g1c': { size: 's-1vcpu-1gb', ram: '1GB', cpu: '1 vCPU' },
    'vps2g1c': { size: 's-1vcpu-2gb', ram: '2GB', cpu: '1 vCPU' },
    'vps2g2c': { size: 's-2vcpu-2gb', ram: '2GB', cpu: '2 vCPU' },
    'vps4g2c': { size: 's-2vcpu-4gb', ram: '4GB', cpu: '2 vCPU' },
    'vps8g4c': { size: 's-4vcpu-8gb', ram: '8GB', cpu: '4 vCPU' }
}

const vpsCommands = Object.keys(VPS_SPECS)

const pluginConfig = {
    name: vpsCommands,
    alias: [],
    category: 'vps',
    description: 'Create DigitalOcean VPS',
    usage: '.vps1g1c <hostname>',
    example: '.vps1g1c myserver',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energi: 0,
    isEnabled: true
}

function generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)]
    }
    return password
}

function hasAccess(sender, isOwner) {
    if (isOwner) return true
    const cleanSender = sender?.split('@')[0]
    if (!cleanSender) return false
    const doConfig = config.digitalocean || {}
    const sellers = doConfig.sellers || []
    const ownerPanels = doConfig.ownerPanels || []
    return sellers.includes(cleanSender) || ownerPanels.includes(cleanSender)
}

async function handler(m, { sock }) {
    const doConfig = config.digitalocean || {}
    const token = doConfig.token
    
    if (!token) {
        return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*\n\n> Isi \`digitalocean.token\` di config.js`)
    }
    
    if (!hasAccess(m.sender, m.isOwner)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Fitur ini hanya untuk Owner/Seller.`)
    }
    
    const hostname = m.text?.trim()
    if (!hostname) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${m.command} <hostname>\`\n\n` +
            `> Contoh: \`${m.prefix}${m.command} myserver\`\n\n` +
            `📦 *ᴘᴀᴋᴇᴛ ᴛᴇʀsᴇᴅɪᴀ:*\n` +
            Object.entries(VPS_SPECS).map(([cmd, spec]) => 
                `> \`${m.prefix}${cmd}\` - ${spec.ram} RAM, ${spec.cpu}`
            ).join('\n')
        )
    }
    
    if (!/^[a-zA-Z0-9-]+$/.test(hostname)) {
        return m.reply(`❌ Hostname hanya boleh huruf, angka, dan dash.`)
    }
    
    const spec = VPS_SPECS[m.command]
    if (!spec) {
        return m.reply(`❌ Paket VPS tidak ditemukan.`)
    }
    
    const password = generatePassword()
    const region = doConfig.region || 'sgp1'
    
    const dropletData = {
        name: hostname,
        region: region,
        size: spec.size,
        image: 'ubuntu-22-04-x64',
        ssh_keys: null,
        backups: false,
        ipv6: true,
        user_data: `#cloud-config
password: ${password}
chpasswd: { expire: False }
ssh_pwauth: True`,
        private_networking: null,
        volumes: null,
        tags: ['ourin-bot']
    }
    
    await m.reply(`🛠️ *ᴍᴇᴍʙᴜᴀᴛ ᴠᴘs...*\n\n> Hostname: \`${hostname}\`\n> Spec: ${spec.ram} RAM, ${spec.cpu}\n> Region: ${region}`)
    
    try {
        const response = await axios.post('https://api.digitalocean.com/v2/droplets', dropletData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        
        const droplet = response.data.droplet
        const dropletId = droplet.id
        
        await m.reply(`⏳ *ᴍᴇɴᴜɴɢɢᴜ ᴠᴘs sɪᴀᴘ...*\n\n> ID: \`${dropletId}\`\n> Estimasi: 60 detik`)
        
        await new Promise(resolve => setTimeout(resolve, 60000))
        
        const infoRes = await axios.get(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const dropletInfo = infoRes.data.droplet
        const ipv4 = dropletInfo.networks?.v4?.find(n => n.type === 'public')
        const ip = ipv4?.ip_address || 'Tidak tersedia'
        
        const detailTxt = `✅ *ᴠᴘs ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n` +
            `╭─「 📋 *ᴅᴇᴛᴀɪʟ ᴠᴘs* 」\n` +
            `┃ 🆔 \`ɪᴅ\`: *${dropletId}*\n` +
            `┃ 🏷️ \`ʜᴏsᴛɴᴀᴍᴇ\`: *${hostname}*\n` +
            `┃ 🌐 \`ɪᴘ\`: *${ip}*\n` +
            `┃ 👤 \`ᴜsᴇʀ\`: *root*\n` +
            `┃ 🔐 \`ᴘᴀss\`: *${password}*\n` +
            `╰───────────────\n\n` +
            `╭─「 🧠 *sᴘᴇᴄ* 」\n` +
            `┃ 💾 \`ʀᴀᴍ\`: *${spec.ram}*\n` +
            `┃ ⚡ \`ᴄᴘᴜ\`: *${spec.cpu}*\n` +
            `┃ 🌍 \`ʀᴇɢɪᴏɴ\`: *${region}*\n` +
            `┃ 💿 \`ᴏs\`: *Ubuntu 22.04*\n` +
            `╰───────────────\n\n` +
            `> ⚠️ Simpan data ini baik-baik!`
        
        await sock.sendMessage(m.sender, { text: detailTxt })
        await m.reply(`✅ *ᴠᴘs ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n> Data dikirim ke private chat.`)
        
    } catch (err) {
        const errMsg = err?.response?.data?.message || err.message
        return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ᴠᴘs*\n\n> ${errMsg}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
