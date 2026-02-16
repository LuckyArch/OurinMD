const { nightActionHandler } = require('./werewolf')

const pluginConfig = {
    name: 'wwsorcerer',
    alias: ['sorcerer', 'wws'],
    category: 'game',
    description: 'Sorcerer night action - Check if target is Seer',
    usage: '.wwsorcerer <nomor>',
    example: '.wwsorcerer 3',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: true,
    cooldown: 0,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    return await nightActionHandler(m, { sock })
}

module.exports = {
    config: pluginConfig,
    handler
}
