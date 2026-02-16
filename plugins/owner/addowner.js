const config = require('../../config')
const { getDatabase } = require('../../src/lib/database')
const { addJadibotOwner, removeJadibotOwner, getJadibotOwners } = require('../../src/lib/jadibotDatabase')
const fs = require('fs')
const path = require('path')
const { isLid, lidToJid } = require('../../src/lib/lidHelper')
const { getGroupMode } = require('../group/botmode')

const pluginConfig = {
    name: 'addowner',
    alias: ['addown', 'setowner', 'delowner', 'dedown', 'ownerlist', 'listowner'],
    category: 'owner',
    description: 'Kelola owner bot (mode-aware)',
    usage: '.addowner <nomor/@tag/reply>',
    example: '.addowner 6281234567890',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function cleanJid(jid) {
    if (!jid) return null
    if (isLid(jid)) jid = lidToJid(jid)
    return jid.includes('@') ? jid : jid + '@s.whatsapp.net'
}

function extractNumber(m) {
    const { resolveAnyLidToJid, isLid, isLidConverted } = require('../../src/lib/lidHelper')
    let targetNumber = ''
    
    if (m.quoted) {
        let sender = m.quoted.sender || ''
        if (isLid(sender) || isLidConverted(sender)) {
            sender = resolveAnyLidToJid(sender, m.groupMembers || [])
        }
        targetNumber = sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        let jid = cleanJid(m.mentionedJid[0])
        if (isLid(jid) || isLidConverted(jid)) {
            jid = resolveAnyLidToJid(jid, m.groupMembers || [])
        }
        targetNumber = jid?.replace(/[^0-9]/g, '') || ''
    } else if (m.args[0]) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
        if (targetNumber.startsWith('08')) {
            targetNumber = '62' + targetNumber.slice(1)
        }
    }
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (targetNumber.length > 15) {
        return ''
    }
    
    return targetNumber
}

function savePanelConfig() {
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let content = fs.readFileSync(configPath, 'utf8')
        
        const ownerPanelsStr = JSON.stringify(config.pterodactyl.ownerPanels || [])
        content = content.replace(
            /ownerPanels:\s*\[.*?\]/s,
            `ownerPanels: ${ownerPanelsStr}`
        )
        
        const sellersStr = JSON.stringify(config.pterodactyl.sellers || [])
        content = content.replace(
            /sellers:\s*\[.*?\]/s,
            `sellers: ${sellersStr}`
        )
        
        fs.writeFileSync(configPath, content, 'utf8')
        return true
    } catch (e) {
        console.error('[AddOwner] Failed to save panel config:', e.message)
        return false
    }
}

function removeFromSellers(targetNumber) {
    if (!config.pterodactyl.sellers) return false
    const idx = config.pterodactyl.sellers.findIndex(s => String(s).trim() === String(targetNumber).trim())
    if (idx !== -1) {
        config.pterodactyl.sellers.splice(idx, 1)
        return true
    }
    return false
}

function removeFromOwnerPanels(targetNumber) {
    if (!config.pterodactyl.ownerPanels) return false
    const idx = config.pterodactyl.ownerPanels.findIndex(s => String(s).trim() === String(targetNumber).trim())
    if (idx !== -1) {
        config.pterodactyl.ownerPanels.splice(idx, 1)
        return true
    }
    return false
}

async function handler(m, { sock, jadibotId, isJadibot }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const groupMode = m.isGroup ? getGroupMode(m.chat, db) : 'private'
    const isCpanelMode = m.isGroup && groupMode === 'cpanel'
    
    const isAdd = ['addowner', 'addown', 'setowner'].includes(cmd)
    const isDel = ['delowner', 'dedown'].includes(cmd)
    const isList = ['ownerlist', 'listowner'].includes(cmd)
    
    if (!config.pterodactyl) config.pterodactyl = {}
    if (!config.pterodactyl.ownerPanels) config.pterodactyl.ownerPanels = []
    if (!config.pterodactyl.sellers) config.pterodactyl.sellers = []
    if (!db.data.owner) db.data.owner = []
    
    if (isList) {
        if (isJadibot && jadibotId) {
            const jbOwners = getJadibotOwners(jadibotId)
            if (jbOwners.length === 0) {
                return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴏᴡɴᴇʀ ᴊᴀᴅɪʙᴏᴛ*\n\n> Belum ada owner terdaftar.\n> Gunakan \`${m.prefix}addowner\` untuk menambah.`)
            }
            let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴏᴡɴᴇʀ ᴊᴀᴅɪʙᴏᴛ*\n\n`
            txt += `> Bot: *${jadibotId}*\n`
            txt += `> Total: *${jbOwners.length}* owner\n\n`
            jbOwners.forEach((s, i) => {
                txt += `${i + 1}. 👑 \`${s}\`\n`
            })
            return m.reply(txt)
        } else if (isCpanelMode) {
            const panelOwners = config.pterodactyl.ownerPanels || []
            const fullOwners = db.data.owner || []
            const allOwners = [...new Set([...panelOwners, ...fullOwners])]
            
            if (allOwners.length === 0) {
                return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ*\n\n> Belum ada owner panel terdaftar.`)
            }
            let txt = `📋 *ᴅᴀꜰᴛᴀʀ ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ*\n\n`
            txt += `> Mode: *CPANEL*\n`
            txt += `> Total: *${allOwners.length}* owner\n\n`
            allOwners.forEach((s, i) => {
                const isPanelOwner = panelOwners.includes(s)
                const isFullOwner = fullOwners.includes(s)
                let label = isPanelOwner && isFullOwner ? '👑🖥️' : (isFullOwner ? '👑' : '🖥️')
                txt += `${i + 1}. ${label} \`${s}\`\n`
            })
            txt += `\n> 👑 = Full Owner, 🖥️ = Panel Owner`
            return m.reply(txt)
        } else {
            const fullOwners = db.data.owner || []
            if (fullOwners.length === 0) {
                return m.reply(`📋 *ᴅᴀꜰᴛᴀʀ ꜰᴜʟʟ ᴏᴡɴᴇʀ*\n\n> Belum ada full owner terdaftar.`)
            }
            let txt = `📋 *ᴅᴀꜰᴛᴀʀ ꜰᴜʟʟ ᴏᴡɴᴇʀ*\n\n`
            txt += `> Mode: *${m.isGroup ? groupMode.toUpperCase() : 'PRIVATE'}*\n`
            txt += `> Total: *${fullOwners.length}* owner\n\n`
            fullOwners.forEach((s, i) => {
                txt += `${i + 1}. 👑 \`${s}\`\n`
            })
            txt += `\n> _Full owner bisa akses semua fitur_`
            return m.reply(txt)
        }
    }
    
    const targetNumber = extractNumber(m)
    
    if (!targetNumber) {
        const modeLabel = isCpanelMode ? 'Owner Panel' : 'Full Owner'
        return m.reply(
            `👑 *${isAdd ? 'ADD' : 'DEL'} ${modeLabel.toUpperCase()}*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply pesan user\n` +
            `┃ ◦ Tag user @mention\n` +
            `┃ ◦ Ketik nomor langsung\n` +
            `╰┈┈⬡\n\n` +
            `> Mode: *${isCpanelMode ? 'CPANEL' : 'FULL ACCESS'}*\n` +
            `\`Contoh: ${m.prefix}${cmd} 6281234567890\``
        )
    }
    
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Format nomor tidak valid`)
    }
    
    if (isJadibot && jadibotId) {
        if (isAdd) {
            if (addJadibotOwner(jadibotId, targetNumber)) {
                m.react('👑')
                return m.reply(
                    `👑 *ᴏᴡɴᴇʀ ᴊᴀᴅɪʙᴏᴛ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                    `> Bot: \`${jadibotId}\`\n` +
                    `> Nomor: \`${targetNumber}\`\n` +
                    `> Total: *${getJadibotOwners(jadibotId).length}* owner`
                )
            } else {
                return m.reply(`❌ \`${targetNumber}\` sudah menjadi owner Jadibot ini.`)
            }
        } else if (isDel) {
            if (removeJadibotOwner(jadibotId, targetNumber)) {
                m.react('✅')
                return m.reply(
                    `✅ *ᴏᴡɴᴇʀ ᴊᴀᴅɪʙᴏᴛ ᴅɪʜᴀᴘᴜs*\n\n` +
                    `> Bot: \`${jadibotId}\`\n` +
                    `> Nomor: \`${targetNumber}\`\n` +
                    `> Total: *${getJadibotOwners(jadibotId).length}* owner`
                )
            } else {
                return m.reply(`❌ \`${targetNumber}\` bukan owner Jadibot ini.`)
            }
        }
        return
    }
    
    if (isCpanelMode) {
        if (isAdd) {
            if (config.pterodactyl.ownerPanels.includes(targetNumber)) {
                return m.reply(`❌ \`${targetNumber}\` sudah menjadi owner panel.`)
            }
            
            let roleChanged = ''
            if (removeFromSellers(targetNumber)) {
                roleChanged = `\n> ⚡ Auto-upgrade dari Seller ke Owner Panel`
            }
            
            config.pterodactyl.ownerPanels.push(targetNumber)
            if (savePanelConfig()) {
                m.react('👑')
                return m.reply(
                    `👑 *ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                    `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                    `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNumber}\`\n` +
                    `┃ 👑 sᴛᴀᴛᴜs: \`Owner Panel\`\n` +
                    `┃ 🖥️ ᴀᴋsᴇs: \`CPanel Only\`\n` +
                    `┃ 📊 ᴛᴏᴛᴀʟ: \`${config.pterodactyl.ownerPanels.length}\` owner panel\n` +
                    `╰┈┈⬡${roleChanged}`
                )
            } else {
                config.pterodactyl.ownerPanels = config.pterodactyl.ownerPanels.filter(s => s !== targetNumber)
                return m.reply(`❌ Gagal menyimpan ke config.js`)
            }
        } else if (isDel) {
            const ownerList = config.pterodactyl.ownerPanels || []
            const found = ownerList.find(o => String(o).trim() === String(targetNumber).trim())
            if (!found) {
                return m.reply(`❌ \`${targetNumber}\` bukan owner panel.\n\n> Current list: ${ownerList.join(', ') || 'empty'}`)
            }
            config.pterodactyl.ownerPanels = ownerList.filter(s => String(s).trim() !== String(targetNumber).trim())
            if (savePanelConfig()) {
                m.react('✅')
                return m.reply(
                    `✅ *ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ ᴅɪʜᴀᴘᴜs*\n\n` +
                    `> Nomor: \`${targetNumber}\`\n` +
                    `> Total: *${config.pterodactyl.ownerPanels.length}* owner panel`
                )
            } else {
                return m.reply(`❌ Gagal menyimpan ke config.js`)
            }
        }
    } else {
        if (isAdd) {
            if (db.data.owner.includes(targetNumber)) {
                return m.reply(`❌ \`${targetNumber}\` sudah menjadi full owner.`)
            }
            
            let roleChanged = ''
            if (removeFromSellers(targetNumber)) {
                roleChanged = `\n> ⚡ Auto-upgrade dari Seller`
                savePanelConfig()
            }
            if (removeFromOwnerPanels(targetNumber)) {
                roleChanged = `\n> ⚡ Auto-upgrade dari Panel Owner`
                savePanelConfig()
            }
            
            db.data.owner.push(targetNumber)
            db.save()
            
            m.react('👑')
            return m.reply(
                `👑 *ꜰᴜʟʟ ᴏᴡɴᴇʀ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📱 ɴᴏᴍᴏʀ: \`${targetNumber}\`\n` +
                `┃ 👑 sᴛᴀᴛᴜs: \`Full Owner\`\n` +
                `┃ 🔓 ᴀᴋsᴇs: \`Semua Fitur\`\n` +
                `┃ 📊 ᴛᴏᴛᴀʟ: \`${db.data.owner.length}\` owner\n` +
                `╰┈┈⬡\n\n` +
                `> _Full owner bisa akses 100% semua fitur_${roleChanged}`
            )
        } else if (isDel) {
            const index = db.data.owner.indexOf(targetNumber)
            if (index === -1) {
                return m.reply(`❌ \`${targetNumber}\` bukan full owner.`)
            }
            
            db.data.owner.splice(index, 1)
            db.save()
            
            m.react('✅')
            return m.reply(
                `✅ *ꜰᴜʟʟ ᴏᴡɴᴇʀ ᴅɪʜᴀᴘᴜs*\n\n` +
                `> Nomor: \`${targetNumber}\`\n` +
                `> Total: *${db.data.owner.length}* owner`
            )
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    removeFromSellers,
    removeFromOwnerPanels
}
