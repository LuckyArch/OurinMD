const config = require('../../config')

const pluginConfig = {
    name: 'cjstoesm',
    alias: ['cjs2esm', 'cjsconvert'],
    category: 'tools',
    description: 'Convert CommonJS ke ESM (ES Modules)',
    usage: '.cjstoesm <reply kode>',
    example: '.cjstoesm',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

function convertCjsToEsm(code) {
    let result = code
    const requires = []
    const moduleExports = []
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, name, path) => {
        requires.push({ type: 'default', name, path })
        return `import ${name} from '${path}';`
    })

    result = result.replace(/(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (match, imports, path) => {
        const items = imports.split(',').map(i => {
            const parts = i.trim().split(/\s*:\s*/)
            if (parts.length === 2) {
                return `${parts[0].trim()} as ${parts[1].trim()}`
            }
            return parts[0].trim()
        })
        return `import { ${items.join(', ')} } from '${path}';`
    })

    result = result.replace(/^require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?$/gm, (match, path) => {
        return `import '${path}';`
    })

    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.default\s*;?/g, (match, name, path) => {
        return `import ${name} from '${path}';`
    })
    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.default\s*;?/g, (match, name, path) => {
        return `import ${name} from '${path}';`
    })

    result = result.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.(\w+)\s*;?/g, (match, name, path, prop) => {
        if (name === prop) {
            return `import { ${prop} } from '${path}';`
        }
        return `import { ${prop} as ${name} } from '${path}';`
    })

    result = result.replace(/module\.exports\s*=\s*(\w+)\s*;?/g, (match, name) => {
        moduleExports.push({ type: 'default', value: name })
        return `export default ${name};`
    })

    result = result.replace(/module\.exports\s*=\s*\{([^}]+)\}\s*;?/g, (match, exports) => {
        const items = exports.split(',').map(i => {
            const parts = i.trim().split(/\s*:\s*/)
            if (parts.length === 2) {
                return `${parts[1].trim()} as ${parts[0].trim()}`
            }
            return parts[0].trim()
        })
        return `export { ${items.join(', ')} };`
    })

    result = result.replace(/module\.exports\s*=\s*(async\s+)?(function|class)\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, async, type, name, params) => {
        if (name) {
            return `export default ${async || ''}${type} ${name}${params || ''} {`
        }
        return `export default ${async || ''}${type}${params || ''} {`
    })

    result = result.replace(/module\.exports\s*=\s*(async\s+)?\(([^)]*)\)\s*=>/g, (match, async, params) => {
        return `export default ${async || ''}(${params}) =>`
    })

    result = result.replace(/exports\.(\w+)\s*=\s*(\w+)\s*;?/g, (match, key, value) => {
        if (key === value) {
            return `export { ${key} };`
        }
        return `export { ${value} as ${key} };`
    })

    result = result.replace(/exports\.(\w+)\s*=\s*(async\s+)?function\s*(\w*)\s*(\([^)]*\))?\s*\{/g, (match, exportName, async, name, params) => {
        return `export ${async || ''}function ${exportName}${params || ''} {`
    })

    result = result.replace(/exports\.(\w+)\s*=\s*(async\s+)?\(([^)]*)\)\s*=>\s*\{/g, (match, exportName, async, params) => {
        return `export const ${exportName} = ${async || ''}(${params}) => {`
    })

    result = result.replace(/exports\.(\w+)\s*=\s*([^;\n]+)\s*;?/g, (match, key, value) => {
        if (value.trim().startsWith('function') || value.trim().startsWith('async') || value.trim().startsWith('(') || value.trim().startsWith('class')) {
            return match
        }
        return `export const ${key} = ${value};`
    })

    result = result.replace(/Object\.assign\s*\(\s*module\.exports\s*,\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)\s*;?/g, (match, path) => {
        return `export * from '${path}';`
    })

    result = result.replace(/module\.exports\.(\w+)\s*=\s*(\w+)\s*;?/g, (match, key, value) => {
        if (key === value) {
            return `export { ${key} };`
        }
        return `export { ${value} as ${key} };`
    })

    if (result.includes('__dirname') || result.includes('__filename')) {
        const helperCode = `import { fileURLToPath } from 'url';\nimport { dirname } from 'path';\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = dirname(__filename);\n\n`
        if (!result.includes('fileURLToPath')) {
            result = helperCode + result
        }
    }

    result = result.replace(/\n{3,}/g, '\n\n')

    return result
}

async function handler(m, { sock }) {
    let code = m.quotedBody || m.text?.trim()
    
    if (!code) {
        return m.reply(
            `🔄 *ᴄᴊs ᴛᴏ ᴇsᴍ ᴄᴏɴᴠᴇʀᴛᴇʀ*\n\n` +
            `> Convert CommonJS ke ES Modules\n\n` +
            `> *Cara pakai:*\n` +
            `> Reply kode CJS dengan ${m.prefix}cjstoesm\n\n` +
            `> *Contoh CJS:*\n` +
            `> \`const axios = require('axios')\`\n` +
            `> \`module.exports = { handler }\``
        )
    }

    try {
        const converted = convertCjsToEsm(code)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴄᴏɴᴠᴇʀᴛᴇᴅ ᴛᴏ ᴇsᴍ*\n\n\`\`\`${converted}\n\`\`\``,
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
