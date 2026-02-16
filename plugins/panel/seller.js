const config = require('../../config')
const fs = require('fs')
const path = require('path')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')
const { getDatabase } = require('../../src/lib/database')
const { getGroupMode } = require('../group/botmode')

const pluginConfig = {
    name: 'addseller',
    alias: ['addreseller', 'delseller', 'delreseller', 'listseller', 'listreseller'],
    category: 'panel',
    description: 'Kelola seller/reseller panel',
    usage: '.addseller @user atau .delseller @user',
    example: '.addseller @user',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function getNumber(jid) {
    const clean = cleanJid(jid)
    return clean ? clean.split('@')[0] : null
}

function hasAccess(senderJid, isOwner, pteroConfig) {
    if (isOwner) return true
    const cleanSender = cleanJid(senderJid)?.split('@')[0]
    if (!cleanSender) return false
    const ownerPanels = pteroConfig?.ownerPanels || []
    return ownerPanels.includes(cleanSender)
}

function saveConfig() {
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let content = fs.readFileSync(configPath, 'utf8')
        
        const sellersStr = JSON.stringify(config.pterodactyl.sellers || [])
        content = content.replace(
            /sellers:\s*\[.*?\]/s,
            `sellers: ${sellersStr}`
        )
        
        const ownerPanelsStr = JSON.stringify(config.pterodactyl.ownerPanels || [])
        content = content.replace(
            /ownerPanels:\s*\[.*?\]/s,
            `ownerPanels: ${ownerPanelsStr}`
        )
        
        fs.writeFileSync(configPath, content, 'utf8')
        return true
    } catch (e) {
        console.error('[Panel] Failed to save config:', e.message)
        return false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const pteroConfig = config.pterodactyl
    
    if (!hasAccess(m.sender, m.isOwner, pteroConfig)) {
        return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n> Fitur ini hanya untuk Owner atau Owner Panel.`)
    }
    
    if (!pteroConfig) {
        return m.reply(`❌ Konfigurasi pterodactyl tidak ditemukan di config.js`)
    }
    
    if (!pteroConfig.sellers) {
        pteroConfig.sellers = []
    }
    
    const isAdd = ['addseller', 'addreseller'].includes(cmd)
    const isDel = ['delseller', 'delreseller'].includes(cmd)
    const isList = ['listseller', 'listreseller'].includes(cmd)
    
    if (isList) {
        if (pteroConfig.sellers.length === 0) {
            return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ sᴇʟʟᴇʀ/ʀᴇsᴇʟʟᴇʀ*\n\n> Belum ada seller terdaftar.`)
        }
        
        let txt = `📋 *ᴅᴀꜰᴛᴀʀ sᴇʟʟᴇʀ/ʀᴇsᴇʟʟᴇʀ*\n\n`
        txt += `> Total: *${pteroConfig.sellers.length}* seller\n\n`
        pteroConfig.sellers.forEach((s, i) => {
            txt += `${i + 1}. \`${s}\`\n`
        })
        txt += `\n> _Seller bisa create server (1gb-10gb v1/v2/v3)_`
        return m.reply(txt)
    }
    
    let targetUser = null
    if (m.quoted?.sender) {
        targetUser = getNumber(m.quoted.sender)
    } else if (m.mentionedJid?.length > 0) {
        targetUser = getNumber(m.mentionedJid[0])
    } else if (m.text?.trim()) {
        targetUser = m.text.trim().replace(/[^0-9]/g, '')
    } else {
        targetUser = getNumber(m.sender)
    }
    
    if (!targetUser) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}${cmd} @user\`\n` +
            `> \`${m.prefix}${cmd} 628xxx\`\n` +
            `> Reply pesan user`
        )
    }
    
    if (isAdd) {
        if (pteroConfig.sellers.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` sudah menjadi seller.`)
        }
        
        let roleChanged = ''
        const ownerIdx = (pteroConfig.ownerPanels || []).indexOf(targetUser)
        if (ownerIdx !== -1) {
            pteroConfig.ownerPanels.splice(ownerIdx, 1)
            roleChanged = `\n> ⚡ Auto-downgrade dari Owner Panel ke Seller`
        }
        
        pteroConfig.sellers.push(targetUser)
        
        if (saveConfig()) {
            m.react('✅')
            return m.reply(
                `✅ *sᴇʟʟᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📱 ɴᴏᴍᴏʀ: \`${targetUser}\`\n` +
                `┃ 🏷️ sᴛᴀᴛᴜs: \`Seller/Reseller\`\n` +
                `┃ 🔓 ᴀᴋsᴇs: \`Create Server (1gb-10gb v1-v3)\`\n` +
                `┃ 📊 ᴛᴏᴛᴀʟ: \`${pteroConfig.sellers.length}\` seller\n` +
                `╰┈┈⬡${roleChanged}`
            )
        } else {
            pteroConfig.sellers = pteroConfig.sellers.filter(s => s !== targetUser)
            return m.reply(`❌ Gagal menyimpan ke config.js`)
        }
    }
    
    if (isDel) {
        if (!pteroConfig.sellers.includes(targetUser)) {
            return m.reply(`❌ \`${targetUser}\` bukan seller.`)
        }
        
        pteroConfig.sellers = pteroConfig.sellers.filter(s => s !== targetUser)
        
        if (saveConfig()) {
            m.react('✅')
            return m.reply(
                `✅ *sᴇʟʟᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Nomor: \`${targetUser}\`\n` +
                `> Total: *${pteroConfig.sellers.length}* seller`
            )
        } else {
            return m.reply(`❌ Gagal menyimpan ke config.js`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
