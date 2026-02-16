const { nightActionHandler } = require('./werewolf')

const pluginConfig = {
    name: 'wwsee',
    alias: ['seer', 'vision', 'wse'],
    category: 'game',
    description: 'Seer night action - See target role',
    usage: '.wwsee <nomor>',
    example: '.wwsee 1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        return await nightActionHandler(m, { sock })
    } catch (error) {
        console.error('[WWSEE ERROR]', error)
        await m.reply(`❌ Error: ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
