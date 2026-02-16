const { getDatabase } = require('../../src/lib/database')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'inventory',
    alias: ['inv', 'tas', 'bag'],
    category: 'rpg',
    description: 'Melihat isi inventory RPG',
    usage: '.inventory',
    example: '.inventory',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const ITEMS = {
    common: { emote: '📦', name: 'Common Crate' },
    uncommon: { emote: '🛍️', name: 'Uncommon Crate' },
    mythic: { emote: '🎁', name: 'Mythic Crate' },
    legendary: { emote: '💎', name: 'Legendary Crate' },
    
    rock: { emote: '🪨', name: 'Batu' },
    coal: { emote: '⚫', name: 'Batubara' },
    iron: { emote: '⛓️', name: 'Besi' },
    gold: { emote: '🥇', name: 'Emas' },
    diamond: { emote: '💠', name: 'Berlian' },
    emerald: { emote: '💚', name: 'Emerald' },
    
    trash: { emote: '🗑️', name: 'Sampah' },
    fish: { emote: '🐟', name: 'Ikan' },
    prawn: { emote: '🦐', name: 'Udang' },
    octopus: { emote: '🐙', name: 'Gurita' },
    shark: { emote: '🦈', name: 'Hiu' },
    whale: { emote: '🐳', name: 'Paus' },
    
    potion: { emote: '🥤', name: 'Health Potion' },
    mpotion: { emote: '🧪', name: 'Mana Potion' },
    stamina: { emote: '⚡', name: 'Stamina Potion' }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    if (!user.inventory) user.inventory = {}
    
    let invText = `╭━━━━━━━━━━━━━━━━━╮\n`
    invText += `┃ 🎒 *ɪɴᴠᴇɴᴛᴏʀʏ ᴜsᴇʀ*\n`
    invText += `╰━━━━━━━━━━━━━━━━━╯\n\n`
    
    let hasItem = false
    const categories = {
        '📦 *ᴄʀᴀᴛᴇs*': ['common', 'uncommon', 'mythic', 'legendary'],
        '⛏️ *ᴍɪɴɪɴɢ*': ['rock', 'coal', 'iron', 'gold', 'diamond', 'emerald'],
        '🎣 *ꜰɪsʜɪɴɢ*': ['trash', 'fish', 'prawn', 'octopus', 'shark', 'whale'],
        '🧪 *ᴘᴏᴛɪᴏɴs*': ['potion', 'mpotion', 'stamina']
    }
    
    for (const [catName, items] of Object.entries(categories)) {
        let catText = ''
        for (const itemKey of items) {
            const count = user.inventory[itemKey] || 0
            if (count > 0) {
                const item = ITEMS[itemKey]
                catText += `┃ ${item.emote} ${item.name}: *${count}*\n`
                hasItem = true
            }
        }
        if (catText) {
            invText += `╭┈┈⬡「 ${catName} 」\n`
            invText += catText
            invText += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        }
    }
    
    if (!hasItem) {
        invText += `> *Inventory Kosong!*\n`
        invText += `> Gunakan command RPG untuk mendapatkan item.`
    } else {
        invText += `> Gunakan \`.use <item>\` untuk memakai item.`
    }
    
    await m.reply(invText)
}

module.exports = {
    config: pluginConfig,
    handler
}
