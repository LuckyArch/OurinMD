const fs = require('fs')

const pluginConfig = {
    name: 'testing',
    alias: ['test'],
    category: 'main',
    description: 'Test plugin - Send PTV to newsletter',
    usage: '.test',
    isOwner: true,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    await m.react('⏳')
    try {
        await sock.sendMessage(
    "120363424988641606@newsletter",
    {
        video: fs.readFileSync('./assets/video/ourin.mp4'),
        mimetype: "video/mp4",
        ptv: true
    }
)
    } catch (error) {
        console.error('[Test Plugin] Error:', error)
        await m.react('❌')
        await m.reply(`❌ Gagal: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}