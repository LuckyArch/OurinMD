const { Client } = require('ssh2')

const pluginConfig = {
    name: ['uinstalltema', 'uninstalltema', 'removetema', 'hapustema'],
    alias: [],
    category: 'panel',
    description: 'Uninstall tema Pterodactyl via SSH',
    usage: '.uinstalltema <ip>|<password>',
    example: '.uinstalltema 192.168.1.1|secretpass',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `╭┈┈⬡「 🗑️ *ᴜɴɪɴsᴛᴀʟʟ ᴛᴇᴍᴀ* 」
┃ ㊗ ᴜsᴀɢᴇ: \`${m.prefix}uinstalltema <ip>|<password>\`
╰┈┈⬡

> \`Contoh: ${m.prefix}uinstalltema 192.168.1.1|secretpass\``
        )
    }
    
    const parts = text.split('|')
    if (parts.length < 2) {
        return m.reply(`❌ Format salah! Gunakan: \`ip|password\``)
    }
    
    const ipvps = parts[0].trim()
    const passwd = parts[1].trim()
    
    global.installtema = { vps: ipvps, pwvps: passwd }
    
    const connSettings = {
        host: ipvps,
        port: 22,
        username: 'root',
        password: passwd
    }
    
    const command = `bash <(curl -s https://raw.githubusercontent.com/veryLinh/Theme-Autoinstaller/main/install.sh)`
    const ress = new Client()
    
    m.react('⏳')
    await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ᴜɴɪɴsᴛᴀʟʟ ᴛᴇᴍᴀ...*\n\n> Tunggu 1-10 menit hingga proses selesai`)
    
    ress.on('ready', () => {
        ress.exec(command, (err, stream) => {
            if (err) {
                m.react('❌')
                return m.reply(`❌ Error: ${err.message}`)
            }
            
            stream.on('close', async () => {
                m.react('✅')
                await m.reply(
                    `╭┈┈⬡「 ✅ *ᴜɴɪɴsᴛᴀʟʟ ᴛᴇᴍᴀ* 」
┃ ㊗ sᴛᴀᴛᴜs: *Berhasil*
┃ ㊗ ɪᴘ: ${ipvps}
╰┈┈⬡

> _Tema berhasil diuninstall!_`
                )
                ress.end()
            }).on('data', (data) => {
                console.log('[UninstallTema]', data.toString())
                stream.write('skyzodev\n')
                stream.write('2\n')
                stream.write('y\n')
                stream.write('x\n')
            }).stderr.on('data', (data) => {
                console.log('[UninstallTema STDERR]', data.toString())
            })
        })
    }).on('error', (err) => {
        console.log('[SSH Error]', err)
        m.react('❌')
        m.reply(`❌ Koneksi gagal!\n\n> IP atau Password tidak valid.`)
    }).connect(connSettings)
}

module.exports = {
    config: pluginConfig,
    handler
}
