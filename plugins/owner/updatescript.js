const fs = require('fs')
const path = require('path')
const { execSync, exec } = require('child_process')

const pluginConfig = {
    name: 'updatescript',
    alias: ['updatebot', 'updatesc'],
    category: 'owner',
    description: 'Update script otomatis dari GitHub dengan backup data penting',
    usage: '.updatescript',
    example: '.updatescript',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

const REPO_URL = 'https://github.com/LuckyArch/OurinMD.git'
const BRANCH = 'main'

const PRESERVE_ITEMS = [
    'config.js',
    'db.json',
    'sessions',
    'database',
    'backup',
    '.env',
    'node_modules',
    'tmp'
]

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function copyRecursiveSync(src, dest, preserve, relativePath = '') {
    const stats = fs.statSync(src)

    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src)
        let count = 0

        for (const entry of entries) {
            const relPath = relativePath ? `${relativePath}/${entry}` : entry
            const shouldPreserve = preserve.some(p => relPath === p || relPath.startsWith(p + '/'))

            if (shouldPreserve) continue

            count += copyRecursiveSync(
                path.join(src, entry),
                path.join(dest, entry),
                preserve,
                relPath
            )
        }
        return count
    }

    const dir = path.dirname(dest)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.copyFileSync(src, dest)
    return 1
}

function backupFile(baseDir, backupDir, filePath) {
    const src = path.join(baseDir, filePath)
    const dest = path.join(backupDir, filePath)

    if (!fs.existsSync(src)) return false

    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src, { withFileTypes: true })
        for (const entry of entries) {
            backupFile(baseDir, backupDir, path.join(filePath, entry.name))
        }
    } else {
        const dir = path.dirname(dest)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.copyFileSync(src, dest)
    }
    return true
}

function cleanDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true })
    }
}

async function handler(m, { sock }) {
    const baseDir = process.cwd()
    const tempDir = path.join(baseDir, 'tmp', 'update_clone')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupDir = path.join(baseDir, 'backup', `pre_update_${timestamp}`)

    try {
        let hasGit = false
        try {
            execSync('git --version', { stdio: 'pipe' })
            hasGit = true
        } catch {}

        if (!hasGit) {
            return m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Git tidak terinstall di server\n` +
                `> Install git dulu: \`apt install git\` / \`pkg install git\``
            )
        }

        await m.react('⏳')
        await m.reply(
            `🔄 *ᴜᴘᴅᴀᴛᴇ sᴄʀɪᴘᴛ*\n\n` +
            `> Repo: \`LuckyArch/OurinMD\`\n` +
            `> Branch: \`${BRANCH}\`\n\n` +
            `📦 Step 1/4 — Backup data penting...`
        )

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true })
        }

        const backedUp = []
        for (const item of PRESERVE_ITEMS) {
            if (item === 'node_modules' || item === 'tmp') continue
            if (backupFile(baseDir, backupDir, item)) {
                backedUp.push(item)
            }
        }

        await m.reply(
            `✅ *ʙᴀᴄᴋᴜᴘ sᴜᴋsᴇs*\n\n` +
            `> ${backedUp.length} item disimpan\n` +
            `> ${backedUp.map(i => `\`${i}\``).join(', ')}\n\n` +
            `📥 Step 2/4 — Clone repo terbaru...`
        )

        cleanDir(tempDir)

        try {
            execSync(`git clone --depth 1 --branch ${BRANCH} ${REPO_URL} "${tempDir}"`, {
                stdio: 'pipe',
                timeout: 120000
            })
        } catch (e) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ᴄʟᴏɴᴇ*\n\n` +
                `> ${e.message}\n\n` +
                `💾 Backup tersimpan di: \`backup/pre_update_${timestamp}\``
            )
        }

        const gitDir = path.join(tempDir, '.git')
        cleanDir(gitDir)

        await m.reply(
            `✅ *ᴄʟᴏɴᴇ sᴜᴋsᴇs*\n\n` +
            `> Script terbaru berhasil diunduh\n\n` +
            `📋 Step 3/4 — Menyalin file baru...`
        )

        let copiedCount = 0
        try {
            copiedCount = copyRecursiveSync(tempDir, baseDir, PRESERVE_ITEMS)
        } catch (e) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ᴄᴏᴘʏ*\n\n` +
                `> ${e.message}\n\n` +
                `💾 Backup tersimpan di: \`backup/pre_update_${timestamp}\``
            )
        }

        cleanDir(tempDir)

        await m.reply(
            `✅ *ᴄᴏᴘʏ sᴜᴋsᴇs*\n\n` +
            `> ${copiedCount} file diperbarui\n` +
            `> Data penting tidak ditimpa\n\n` +
            `🔧 Step 4/4 — Install dependencies...`
        )

        try {
            execSync('npm install --production', {
                cwd: baseDir,
                timeout: 300000,
                stdio: 'pipe'
            })
            await m.reply(`✅ *ɴᴘᴍ ɪɴsᴛᴀʟʟ sᴜᴋsᴇs*`)
        } catch (e) {
            await m.reply(
                `⚠️ *ɴᴘᴍ ɪɴsᴛᴀʟʟ ɢᴀɢᴀʟ*\n\n` +
                `> ${e.message?.slice(0, 200)}\n` +
                `> Jalankan \`npm install\` manual`
            )
        }

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
                `✅ *ᴜᴘᴅᴀᴛᴇ sᴇʟᴇsᴀɪ!*\n\n` +
                `╭┈┈⬡「 📊 *ʀɪɴɢᴋᴀsᴀɴ* 」\n` +
                `┃ 📄 File diperbarui: \`${copiedCount}\`\n` +
                `┃ 💾 Backup: \`backup/pre_update_${timestamp}\`\n` +
                `┃ 📦 Repo: \`LuckyArch/OurinMD\`\n` +
                `╰┈┈⬡\n\n` +
                `> Bot akan restart dalam 3 detik...\n` +
                `> Jika ada error, restore dari backup`
        }, { quoted: m })

        setTimeout(() => {
            process.exit(0)
        }, 3000)

    } catch (error) {
        cleanDir(tempDir)
        await m.react('❌')
        return m.reply(
            `❌ *ᴜᴘᴅᴀᴛᴇ ɢᴀɢᴀʟ*\n\n` +
            `> ${error.message}\n\n` +
            `💾 Backup tersimpan di: \`backup/pre_update_${timestamp}\``
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
