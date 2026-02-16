const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'enableplugin',
    alias: ['eplugin', 'pluginenable', 'onplugin'],
    category: 'owner',
    description: 'Mengaktifkan kembali plugin yang dinonaktifkan',
    usage: '.enableplugin <nama_plugin>',
    example: '.enableplugin sticker',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
}

function findPluginFile(pluginName) {
    const pluginsDir = path.join(process.cwd(), 'plugins')
    const categories = fs.readdirSync(pluginsDir).filter(f => {
        return fs.statSync(path.join(pluginsDir, f)).isDirectory()
    })
    
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            try {
                const filePath = path.join(categoryPath, file)
                const plugin = require(filePath)
                
                if (!plugin.config) continue
                
                const name = Array.isArray(plugin.config.name) 
                    ? plugin.config.name[0] 
                    : plugin.config.name
                    
                const aliases = plugin.config.alias || []
                
                if (name === pluginName || aliases.includes(pluginName)) {
                    return { filePath, plugin, category, file }
                }
            } catch {}
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const args = m.args || []
    const pluginName = args[0]?.toLowerCase()
    
    if (!pluginName) {
        return m.reply(
            `🔌 *ᴇɴᴀʙʟᴇ ᴘʟᴜɢɪɴ*\n\n` +
            `> Masukkan nama plugin yang ingin diaktifkan\n\n` +
            `*Contoh:*\n` +
            `> \`${m.prefix}enableplugin sticker\`\n` +
            `> \`${m.prefix}enableplugin tiktok\``
        )
    }
    
    const found = findPluginFile(pluginName)
    
    if (!found) {
        return m.reply(`❌ Plugin *${pluginName}* tidak ditemukan!`)
    }
    
    const { filePath, plugin, category, file } = found
    
    if (plugin.config.isEnabled !== false) {
        return m.reply(`⚠️ Plugin *${pluginName}* sudah aktif!`)
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8')
        
        content = content.replace(
            /isEnabled:\s*false/i,
            'isEnabled: true'
        )
        
        fs.writeFileSync(filePath, content)
        
        delete require.cache[require.resolve(filePath)]
        
        await m.reply(
            `✅ *ᴘʟᴜɢɪɴ ᴇɴᴀʙʟᴇᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📦 Plugin: *${plugin.config.name}*\n` +
            `┃ 📁 Category: *${category}*\n` +
            `┃ 📄 File: *${file}*\n` +
            `┃ 🟢 Status: *Enabled*\n` +
            `╰┈┈⬡\n\n` +
            `> Restart bot atau gunakan hot reload untuk apply.`
        )
        
    } catch (error) {
        await m.reply(`❌ Gagal enable plugin:\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
