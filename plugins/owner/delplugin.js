const fs = require('fs')
const path = require('path')
const { unloadPlugin } = require('../../src/lib/plugins')

const pluginConfig = {
    name: 'delplugin',
    alias: ['delpl', 'hapusplugin', 'removeplugin'],
    category: 'owner',
    description: 'Hapus plugin berdasarkan nama',
    usage: '.delplugin <nama>',
    example: '.delplugin bliblidl',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

function findPluginFile(pluginsDir, name) {
    const folders = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
    
    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            const baseName = file.replace('.js', '')
            if (baseName.toLowerCase() === name.toLowerCase()) {
                return {
                    folder,
                    file,
                    path: path.join(folderPath, file)
                }
            }
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `🗑️ *ᴅᴇʟ ᴘʟᴜɢɪɴ*\n\n` +
            `> Hapus plugin berdasarkan nama\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}delplugin bliblidl\``
        )
    }
    
    m.react('⏳')
    
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const found = findPluginFile(pluginsDir, name)
        
        if (!found) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Plugin \`${name}\` tidak ditemukan`)
        }
        
        const unloadResult = unloadPlugin(name)
        
        fs.unlinkSync(found.path)
        
        m.react('✅')
        return m.reply(
            `✅ *ᴘʟᴜɢɪɴ ᴅɪʜᴀᴘᴜs*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ꜰɪʟᴇ: \`${found.file}\`\n` +
            `┃ 📁 ꜰᴏʟᴅᴇʀ: \`${found.folder}\`\n` +
            `┃ 🗑️ ᴜɴʟᴏᴀᴅ: ${unloadResult.success ? '✅ Sukses' : '⚠️ Pending'}\n` +
            `╰┈┈⬡\n\n` +
            `> Plugin sudah dihapus dan tidak aktif!`
        )
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
