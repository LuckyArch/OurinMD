const config = require('../../config')

const pluginConfig = {
    name: 'esmtocjs',
    alias: ['esm2cjs', 'esmconvert'],
    category: 'tools',
    description: 'Convert ESM (ES Modules) ke CommonJS',
    usage: '.esmtocjs <reply kode>',
    example: '.esmtocjs',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function convertEsmToCjs(code) {
    let result = code
    const importMap = new Map()
    const exportedItems = []
    let hasDefaultExport = false
    let defaultExportValue = null

    result = result.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (match, name, path) => {
        importMap.set(name, path)
        return `const ${name} = require('${path}');`
    })

    result = result.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, imports, path) => {
        const items = imports.split(',').map(i => {
            const parts = i.trim().split(/\s+as\s+/)
            if (parts.length === 2) {
                return `${parts[0].trim()}: ${parts[1].trim()}`
            }
            return parts[0].trim()
        })
        const hasAlias = imports.includes(' as ')
        if (hasAlias) {
            const destructure = items.join(', ')
            return `const { ${destructure} } = require('${path}');`
        }
        return `const { ${items.join(', ')} } = require('${path}');`
    })

    result = result.replace(/import\s*\*\s*as\s+(\w+)\s+from\s+['"]([^'"]+)['"]\s*;?/g, (match, name, path) => {
        return `const ${name} = require('${path}');`
    })

    result = result.replace(/import\s+['"]([^'"]+)['"]\s*;?/g, (match, path) => {
        return `require('${path}');`
    })
    result = result.replace(/import\s+['"]([^'"]+)['"]\s*;?/g, (match, path) => {
        return `require('${path}');`
    })

    result = result.replace(/import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, defaultName, named, path) => {
        const items = named.split(',').map(i => i.trim())
        return `const ${defaultName} = require('${path}');\nconst { ${items.join(', ')} } = require('${path}');`
    })

    result = result.replace(/export\s+default\s+(\w+)\s*;?/g, (match, name) => {
        hasDefaultExport = true
        defaultExportValue = name
        return ''
    })
    result = result.replace(/export\s+default\s+(\w+)\s*;?/g, (match, name) => {
        hasDefaultExport = true
        defaultExportValue = name
        return ''
    })

    result = result.replace(/export\s+default\s+(function|class|async\s+function)\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, type, name, params) => {
        hasDefaultExport = true
        if (name) {
            defaultExportValue = name
            return `${type} ${name}${params || ''} {`
        }
        defaultExportValue = '__default__'
        return `const __default__ = ${type}${params || ''} {`
    })

    result = result.replace(/export\s+default\s+(\{[\s\S]*?\})\s*;?/g, (match, obj) => {
        hasDefaultExport = true
        defaultExportValue = obj
        return ''
    })

    result = result.replace(/export\s*\{\s*([^}]+)\s*\}\s*;?/g, (match, exports) => {
        const items = exports.split(',').map(i => {
            const parts = i.trim().split(/\s+as\s+/)
            if (parts.length === 2) {
                exportedItems.push({ name: parts[0].trim(), alias: parts[1].trim() })
            } else {
                exportedItems.push({ name: parts[0].trim(), alias: null })
            }
            return null
        })
        return ''
    })

    result = result.replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, (match, type, name) => {
        exportedItems.push({ name, alias: null })
        return `${type} ${name} =`
    })
    result = result.replace(/export\s+(async\s+)?function\s+(\w+)/g, (match, async, name) => {
        exportedItems.push({ name, alias: null })
        return `${async || ''}function ${name}`
    })
    result = result.replace(/export\s+class\s+(\w+)/g, (match, name) => {
        exportedItems.push({ name, alias: null })
        return `class ${name}`
    })
    result = result.replace(/export\s*\*\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, path) => {
        return `Object.assign(module.exports, require('${path}'));`
    })
    result = result.replace(/export\s*\{\s*([^}]+)\s*\}\s*from\s+['"]([^'"]+)['"]\s*;?/g, (match, exports, path) => {
        const items = exports.split(',').map(i => i.trim())
        return `const { ${items.join(', ')} } = require('${path}');\nmodule.exports = { ...module.exports, ${items.join(', ')} };`
    })
    let exportsCode = ''
    if (hasDefaultExport && exportedItems.length === 0) {
        exportsCode = `\nmodule.exports = ${defaultExportValue};`
    } else if (exportedItems.length > 0) {
        const exportObj = exportedItems.map(e => e.alias ? `${e.alias}: ${e.name}` : e.name).join(', ')
        if (hasDefaultExport) {
            exportsCode = `\nmodule.exports = ${defaultExportValue};\nmodule.exports = { ...module.exports, ${exportObj} };`
        } else {
            exportsCode = `\nmodule.exports = { ${exportObj} };`
        }
    }
    result = result.trim() + exportsCode
    result = result.replace(/\n{3,}/g, '\n\n')
    return result
}

async function handler(m, { sock }) {
    let code = m.quotedBody || m.text?.trim()
    
    if (!code) {
        return m.reply(
            `🔄 *ᴇsᴍ ᴛᴏ ᴄᴊs ᴄᴏɴᴠᴇʀᴛᴇʀ*\n\n` +
            `> Convert ES Modules ke CommonJS\n\n` +
            `> *Cara pakai:*\n` +
            `> Reply kode ESM dengan ${m.prefix}esmtocjs\n\n` +
            `> *Contoh ESM:*\n` +
            `> \`import axios from 'axios'\`\n` +
            `> \`export default function() {}\``
        )
    }

    try {
        const converted = convertEsmToCjs(code)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴄᴏᴍᴍᴏɴᴊs*\n\n\`\`\`${converted}\n\`\`\``,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
    } catch (error) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
