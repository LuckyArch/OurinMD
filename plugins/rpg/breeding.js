const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')

const pluginConfig = {
    name: 'breeding',
    alias: ['breed', 'kawin', 'petbreed'],
    category: 'rpg',
    description: 'Breeding pets untuk mendapat pet baru',
    usage: '.breeding @user',
    example: '.breeding @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3600,
    energi: 3,
    isEnabled: true
}

const BREEDING_RESULTS = {
    'cat+cat': ['cat', 'cat', 'lion'],
    'dog+dog': ['dog', 'dog', 'wolf'],
    'cat+dog': ['cat', 'dog', 'rabbit'],
    'bird+bird': ['bird', 'bird', 'phoenix'],
    'fish+fish': ['fish', 'fish', 'dragon'],
    'rabbit+rabbit': ['rabbit', 'rabbit', 'thunderbunny'],
    'cat+bird': ['cat', 'bird', 'phoenix'],
    'dog+rabbit': ['dog', 'rabbit', 'wolf'],
    'default': ['cat', 'dog', 'bird', 'fish', 'rabbit']
}

const PET_NAMES = {
    cat: '🐱 Kucing',
    dog: '🐕 Anjing',
    bird: '🐦 Burung',
    fish: '🐟 Ikan',
    rabbit: '🐰 Kelinci',
    lion: '🦁 Singa',
    wolf: '🐺 Serigala',
    phoenix: '🔥 Phoenix',
    dragon: '🐉 Naga',
    thunderbunny: '⚡ Thunder Bunny'
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const mentioned = m.mentionedJid?.[0] || m.quoted?.sender
    
    if (!mentioned) {
        return m.reply(
            `🐾 *ʙʀᴇᴇᴅɪɴɢ sʏsᴛᴇᴍ*\n\n` +
            `> Kawinkan pet-mu dengan pet player lain!\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${m.prefix}breeding @user\n` +
            `┃ Reply pesan + ${m.prefix}breeding\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `⚠️ *Syarat:*\n` +
            `> • Kedua player punya pet\n` +
            `> • Pet level 5+\n` +
            `> • Biaya: 3000 gold masing-masing`
        )
    }
    
    if (mentioned === m.sender) {
        return m.reply(`❌ Tidak bisa breeding dengan diri sendiri!`)
    }
    
    if (!user.rpg.pet) {
        return m.reply(`❌ Kamu belum punya pet! Beli di \`${m.prefix}petshop\``)
    }
    
    const partner = db.getUser(mentioned)
    if (!partner?.rpg?.pet) {
        return m.reply(`❌ Partner belum punya pet!`)
    }
    
    const myPet = user.rpg.pet
    const partnerPet = partner.rpg.pet
    
    if ((myPet.level || 1) < 5) {
        return m.reply(`❌ Pet-mu harus level 5+! (Current: ${myPet.level || 1})`)
    }
    
    if ((partnerPet.level || 1) < 5) {
        return m.reply(`❌ Pet partner harus level 5+! (Current: ${partnerPet.level || 1})`)
    }
    
    const breedingCost = 3000
    if ((user.koin || 0) < breedingCost) {
        return m.reply(`❌ Balance kurang! Butuh ${breedingCost.toLocaleString()}`)
    }
    
    user.koin -= breedingCost
    
    await m.react('🐾')
    await m.reply(`🐾 *ʙʀᴇᴇᴅɪɴɢ...*\n\n> ${PET_NAMES[myPet.type]} + ${PET_NAMES[partnerPet.type]}`)
    await new Promise(r => setTimeout(r, 3000))
    
    const breedKey = [myPet.type, partnerPet.type].sort().join('+')
    const possibleResults = BREEDING_RESULTS[breedKey] || BREEDING_RESULTS['default']
    const resultPetType = possibleResults[Math.floor(Math.random() * possibleResults.length)]
    
    const isRare = ['lion', 'wolf', 'phoenix', 'dragon', 'thunderbunny'].includes(resultPetType)
    
    if (!user.rpg.petStorage) user.rpg.petStorage = []
    
    const newPet = {
        type: resultPetType,
        name: PET_NAMES[resultPetType]?.split(' ')[1] || 'Baby',
        level: 1,
        exp: 0,
        hunger: 100,
        stats: null,
        birthDate: Date.now()
    }
    
    user.rpg.petStorage.push(newPet)
    
    const expReward = isRare ? 500 : 200
    await addExpWithLevelCheck(sock, m, db, user, expReward)
    db.save()
    
    await m.react(isRare ? '🎉' : '✅')
    
    let txt = `${isRare ? '🎉' : '✅'} *ʙʀᴇᴇᴅɪɴɢ ʙᴇʀʜᴀsɪʟ!*\n\n`
    txt += `╭┈┈⬡「 🐾 *ʙᴀʙʏ ᴘᴇᴛ* 」\n`
    txt += `┃ 🏷️ Jenis: *${PET_NAMES[resultPetType]}*\n`
    txt += `┃ ${isRare ? '⭐ *RARE PET!*' : '📊 Common pet'}\n`
    txt += `┃ ✨ EXP: *+${expReward}*\n`
    txt += `┃ 💰 Cost: *-${breedingCost.toLocaleString()}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> Pet disimpan di storage. Total: ${user.rpg.petStorage.length}`
    
    return m.reply(txt, { mentions: [m.sender, mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
