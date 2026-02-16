const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { execSync } = require('child_process')

const pluginConfig = {
    name: 'updatescript',
    alias: ['updatebot', 'updatescript', 'updatesc'],
    category: 'owner',
    description: 'Update script otomatis dengan backup data penting',
    usage: '.updatescript [link zip]',
    example: '.updatescript https://github.com/user/repo/archive/main.zip',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

const IMPORTANT_FILES = [
    'config.js',
    'db.json',
    'sessions',
    'database/main',
    'assets/images',
    'assets/audio',
    'assets/video',
    'backup',
    '.env'
]

async function createBackup(baseDir, backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupName = `backup_${timestamp}.zip`
    const backupPath = path.join(backupDir, backupName)
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
    }
    
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(backupPath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        
        const backedUpItems = []
        
        output.on('close', () => {
            resolve({
                path: backupPath,
                size: archive.pointer(),
                items: backedUpItems
            })
        })
        
        output.on('error', reject)
        archive.on('error', reject)
        
        archive.pipe(output)
        
        for (const item of IMPORTANT_FILES) {
            const fullPath = path.join(baseDir, item)
            
            if (!fs.existsSync(fullPath)) continue
            
            const stat = fs.statSync(fullPath)
            
            if (stat.isDirectory()) {
                archive.directory(fullPath, item)
                backedUpItems.push(`📁 ${item}/`)
            } else {
                archive.file(fullPath, { name: item })
                backedUpItems.push(`📄 ${item}`)
            }
        }
        
        archive.finalize()
    })
}

async function downloadAndExtract(url, destDir) {
    const axios = require('axios')
    const AdmZip = require('adm-zip')
    
    const tempPath = path.join(destDir, 'temp_update.zip')
    
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: 500 * 1024 * 1024
    })
    
    fs.writeFileSync(tempPath, response.data)
    
    const zip = new AdmZip(tempPath)
    const extractPath = path.join(destDir, 'temp_extract')
    
    if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true })
    }
    
    zip.extractAllTo(extractPath, true)
    
    fs.unlinkSync(tempPath)
    
    const entries = fs.readdirSync(extractPath)
    let sourceDir = extractPath
    
    if (entries.length === 1) {
        const potentialSubdir = path.join(extractPath, entries[0])
        if (fs.statSync(potentialSubdir).isDirectory()) {
            sourceDir = potentialSubdir
        }
    }
    
    return { extractPath, sourceDir }
}

function copyNewFiles(sourceDir, destDir, skipItems) {
    const copiedFiles = []
    const skippedFiles = []
    
    function copyRecursive(src, dest, relativePath = '') {
        const entries = fs.readdirSync(src, { withFileTypes: true })
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name)
            const destPath = path.join(dest, entry.name)
            const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name
            
            const shouldSkip = skipItems.some(item => {
                if (relPath === item) return true
                if (relPath.startsWith(item + path.sep)) return true
                if (item.includes('/') && relPath.startsWith(item.replace(/\//g, path.sep))) return true
                return false
            })
            
            if (shouldSkip) {
                skippedFiles.push(relPath)
                continue
            }
            
            if (entry.isDirectory()) {
                if (!fs.existsSync(destPath)) {
                    fs.mkdirSync(destPath, { recursive: true })
                }
                copyRecursive(srcPath, destPath, relPath)
            } else {
                if (!fs.existsSync(path.dirname(destPath))) {
                    fs.mkdirSync(path.dirname(destPath), { recursive: true })
                }
                fs.copyFileSync(srcPath, destPath)
                copiedFiles.push(relPath)
            }
        }
    }
    
    copyRecursive(sourceDir, destDir)
    
    return { copiedFiles, skippedFiles }
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `🔄 *ᴜᴘᴅᴀᴛᴇ sᴄʀɪᴘᴛ*\n\n` +
            `> Update script otomatis dengan backup data penting\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}updatescript <link zip>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}updatescript https://github.com/user/repo/archive/main.zip\`\n\n` +
            `*ᴅᴀᴛᴀ ʏᴀɴɢ ᴅɪ-ʙᴀᴄᴋᴜᴘ:*\n` +
            `• config.js\n` +
            `• db.json\n` +
            `• sessions/\n` +
            `• database/main/\n` +
            `• assets/ (images, audio, video)\n` +
            `• backup/\n` +
            `• .env\n\n` +
            `⚠️ *ᴘᴇʀɪɴɢᴀᴛᴀɴ:*\n` +
            `> Bot akan restart setelah update selesai`
        )
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> URL tidak valid\n> Harus dimulai dengan http:// atau https://`)
    }
    
    if (!url.endsWith('.zip') && !url.includes('/archive/') && !url.includes('/releases/')) {
        return m.reply(
            `⚠️ *ᴘᴇʀɪɴɢᴀᴛᴀɴ*\n\n` +
            `> URL sepertinya bukan file ZIP\n` +
            `> Pastikan link mengarah ke file .zip\n\n` +
            `> Reply pesan ini dengan \`lanjut\` untuk tetap melanjutkan`
        )
    }
    
    await m.react('⏳')
    
    const baseDir = process.cwd()
    const backupDir = path.join(baseDir, 'backup', 'updates')
    const tempDir = path.join(baseDir, 'temp')
    
    try {
        await m.reply(`📦 *ꜱᴛᴇᴘ 1/4* - Membuat backup data penting...`)
        
        let backupResult
        try {
            backupResult = await createBackup(baseDir, backupDir)
        } catch (backupError) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ʙᴀᴄᴋᴜᴘ*\n\n` +
                `> ${backupError.message}\n\n` +
                `> Update dibatalkan untuk keamanan data`
            )
        }
        
        const formatSize = (bytes) => {
            if (bytes < 1024) return bytes + ' B'
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
        }
        
        await m.reply(
            `✅ *ʙᴀᴄᴋᴜᴘ sᴜᴋsᴇs*\n\n` +
            `📦 Size: \`${formatSize(backupResult.size)}\`\n` +
            `📁 Items: \`${backupResult.items.length}\`\n\n` +
            `${backupResult.items.slice(0, 10).join('\n')}` +
            (backupResult.items.length > 10 ? `\n... dan ${backupResult.items.length - 10} lainnya` : '')
        )
        
        await m.reply(`📥 *ꜱᴛᴇᴘ 2/4* - Mengunduh script baru...`)
        
        let extractResult
        try {
            extractResult = await downloadAndExtract(url, tempDir)
        } catch (downloadError) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
                `> ${downloadError.message}\n\n` +
                `💾 Backup tersimpan di:\n> \`${path.relative(baseDir, backupResult.path)}\``
            )
        }
        
        await m.reply(`✅ *ᴅᴏᴡɴʟᴏᴀᴅ sᴜᴋsᴇs*\n\n> Script berhasil diunduh dan diekstrak`)
        
        await m.reply(`📋 *ꜱᴛᴇᴘ 3/4* - Menyalin file baru...`)
        
        let copyResult
        try {
            copyResult = copyNewFiles(extractResult.sourceDir, baseDir, IMPORTANT_FILES)
        } catch (copyError) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ᴄᴏᴘʏ*\n\n` +
                `> ${copyError.message}\n\n` +
                `💾 Backup tersimpan di:\n> \`${path.relative(baseDir, backupResult.path)}\``
            )
        }
        
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        } catch {}
        
        await m.reply(
            `✅ *ᴄᴏᴘʏ sᴜᴋsᴇs*\n\n` +
            `📄 File dicopy: \`${copyResult.copiedFiles.length}\`\n` +
            `⏭️ File dilewati: \`${copyResult.skippedFiles.length}\`\n\n` +
            `> Data penting tidak ditimpa`
        )
        
        await m.reply(`🔧 *ꜱᴛᴇᴘ 4/4* - Installing dependencies...`)
        
        try {
            execSync('npm install', { cwd: baseDir, timeout: 300000, stdio: 'pipe' })
            await m.reply(`✅ *ɴᴘᴍ ɪɴsᴛᴀʟʟ sᴜᴋsᴇs*`)
        } catch (npmError) {
            await m.reply(`⚠️ *ɴᴘᴍ ɪɴsᴛᴀʟʟ ɢᴀɢᴀʟ*\n\n> ${npmError.message}\n\n> Jalankan \`npm install\` manual`)
        }
        
        await m.react('✅')
        
        const finalMsg = 
            `✅ *ᴜᴘᴅᴀᴛᴇ sᴜᴋsᴇs!*\n\n` +
            `╭┈┈⬡「 📊 *ʀɪɴɢᴋᴀsᴀɴ* 」\n` +
            `┃ 📄 File baru: \`${copyResult.copiedFiles.length}\`\n` +
            `┃ ⏭️ File dilewati: \`${copyResult.skippedFiles.length}\`\n` +
            `┃ 📦 Backup size: \`${formatSize(backupResult.size)}\`\n` +
            `╰┈┈⬡\n\n` +
            `💾 *ʙᴀᴄᴋᴜᴘ ʟᴏᴋᴀsɪ:*\n` +
            `> \`${path.relative(baseDir, backupResult.path)}\`\n\n` +
            `⚠️ *ᴘᴇɴᴛɪɴɢ:*\n` +
            `> Restart bot untuk menerapkan update\n` +
            `> Ketik \`${m.prefix}restart\` atau restart manual\n\n` +
            `💡 *ᴛɪᴘ:*\n` +
            `> Jika ada error, restore dari backup`
        
        await sock.sendMessage(m.chat, { text: finalMsg }, { quoted: m })
        
    } catch (error) {
        await m.react('❌')
        
        try {
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        } catch {}
        
        return m.reply(
            `❌ *ᴜᴘᴅᴀᴛᴇ ɢᴀɢᴀʟ*\n\n` +
            `> ${error.message}\n\n` +
            `> Cek backup folder untuk memulihkan data`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
