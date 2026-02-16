const util = require('util')

const pluginConfig = {
    name: 'q',
    alias: ['quoted', 'inspect'],
    category: 'tools',
    description: 'Ambil JSON message dari pesan yang direply',
    usage: '.q (reply pesan)',
    isOwner: true,
    cooldown: 3,
    isEnabled: true
}

async function handler(m) {
    if (!m.quoted) {
        return m.reply('❌ *Reply pesan yang ingin di-inspect*')
    }

    try {
        const quoted = m.quoted || {}

        await m.reply(JSON.stringify(quoted, null, 2))
    } catch (err) {
        m.reply(`❌ Gagal mengambil quoted message\n\n${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}