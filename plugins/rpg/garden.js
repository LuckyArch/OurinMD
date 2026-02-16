const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')

const pluginConfig = {
    name: 'garden',
    alias: ['kebun', 'farm', 'tanam'],
    category: 'rpg',
    description: 'Berkebun dan panen tanaman',
    usage: '.garden <plant/harvest/status>',
    example: '.garden plant carrot',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const CROPS = {
    carrot: { name: '🥕 Wortel', growTime: 300000, exp: 50, sellPrice: 30, seedPrice: 10 },
    tomato: { name: '🍅 Tomat', growTime: 600000, exp: 80, sellPrice: 50, seedPrice: 20 },
    corn: { name: '🌽 Jagung', growTime: 900000, exp: 120, sellPrice: 80, seedPrice: 35 },
    potato: { name: '🥔 Kentang', growTime: 1200000, exp: 150, sellPrice: 100, seedPrice: 45 },
    strawberry: { name: '🍓 Stroberi', growTime: 1800000, exp: 200, sellPrice: 150, seedPrice: 60 },
    watermelon: { name: '🍉 Semangka', growTime: 3600000, exp: 350, sellPrice: 300, seedPrice: 100 },
    pumpkin: { name: '🎃 Labu', growTime: 7200000, exp: 500, sellPrice: 500, seedPrice: 150 },
    herb: { name: '🌿 Herba', growTime: 1500000, exp: 180, sellPrice: 120, seedPrice: 50 }
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    if (!user.rpg.garden) user.rpg.garden = { plots: [], maxPlots: 3 }
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const cropName = args[1]?.toLowerCase()
    
    if (!action || !['plant', 'harvest', 'status', 'buy'].includes(action)) {
        let txt = `🌱 *ɢᴀʀᴅᴇɴ - ʙᴇʀᴋᴇʙᴜɴ*\n\n`
        txt += `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n`
        txt += `┃ ${m.prefix}garden status\n`
        txt += `┃ ${m.prefix}garden plant <crop>\n`
        txt += `┃ ${m.prefix}garden harvest\n`
        txt += `┃ ${m.prefix}garden buy <crop> <qty>\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `╭┈┈⬡「 🌾 *ᴛᴀɴᴀᴍᴀɴ* 」\n`
        for (const [key, crop] of Object.entries(CROPS)) {
            txt += `┃ ${crop.name} - ${formatTime(crop.growTime)}\n`
            txt += `┃ 💰 Jual: ${crop.sellPrice} | 🌱 Seed: ${crop.seedPrice}\n`
            txt += `┃ → \`${key}\`\n┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        return m.reply(txt)
    }
    
    if (action === 'status') {
        const garden = user.rpg.garden
        let txt = `🌱 *sᴛᴀᴛᴜs ᴋᴇʙᴜɴ*\n\n`
        txt += `> Plot: ${garden.plots.length}/${garden.maxPlots}\n\n`
        
        if (garden.plots.length === 0) {
            txt += `> 🌾 Kebun kosong.\n> Gunakan \`${m.prefix}garden plant <crop>\``
        } else {
            txt += `╭┈┈⬡「 🌿 *ᴘʟᴏᴛs* 」\n`
            for (let i = 0; i < garden.plots.length; i++) {
                const plot = garden.plots[i]
                const crop = CROPS[plot.crop]
                const elapsed = Date.now() - plot.plantedAt
                const remaining = Math.max(0, crop.growTime - elapsed)
                const ready = remaining <= 0
                
                txt += `┃ Plot ${i + 1}: ${crop.name}\n`
                txt += `┃ ${ready ? '✅ SIAP PANEN!' : `⏳ ${formatTime(remaining)}`}\n`
                txt += `┃\n`
            }
            txt += `╰┈┈┈┈┈┈┈┈⬡`
        }
        return m.reply(txt)
    }
    
    if (action === 'buy') {
        if (!cropName) {
            return m.reply(`❌ Tentukan tanaman!\n\n> Contoh: \`${m.prefix}garden buy carrot 5\``)
        }
        
        const crop = CROPS[cropName]
        if (!crop) {
            return m.reply(`❌ Tanaman tidak ditemukan!`)
        }
        
        const qty = Math.max(1, parseInt(args[2]) || 1)
        const totalCost = crop.seedPrice * qty
        
        if ((user.koin || 0) < totalCost) {
            return m.reply(`❌ Balance kurang! Butuh ${totalCost.toLocaleString()}`)
        }
        
        user.koin -= totalCost
        const seedKey = `${cropName}seed`
        user.inventory[seedKey] = (user.inventory[seedKey] || 0) + qty
        db.save()
        
        return m.reply(
            `✅ *ʙᴇʟɪ ʙɪʙɪᴛ*\n\n` +
            `> 🌱 ${crop.name} Seed x${qty}\n` +
            `> 💰 -${totalCost.toLocaleString()}`
        )
    }
    
    if (action === 'plant') {
        if (!cropName) {
            return m.reply(`❌ Tentukan tanaman!\n\n> Contoh: \`${m.prefix}garden plant carrot\``)
        }
        
        const crop = CROPS[cropName]
        if (!crop) {
            return m.reply(`❌ Tanaman tidak ditemukan!`)
        }
        
        if (user.rpg.garden.plots.length >= user.rpg.garden.maxPlots) {
            return m.reply(`❌ Plot penuh! Panen dulu atau upgrade kebun.`)
        }
        
        const seedKey = `${cropName}seed`
        if ((user.inventory[seedKey] || 0) < 1) {
            return m.reply(`❌ Tidak punya bibit ${crop.name}!\n\n> Beli: \`${m.prefix}garden buy ${cropName}\``)
        }
        
        user.inventory[seedKey]--
        if (user.inventory[seedKey] <= 0) delete user.inventory[seedKey]
        
        user.rpg.garden.plots.push({
            crop: cropName,
            plantedAt: Date.now()
        })
        db.save()
        
        return m.reply(
            `🌱 *ᴛᴀɴᴀᴍ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `> ${crop.name} ditanam!\n` +
            `> ⏳ Panen dalam ${formatTime(crop.growTime)}`
        )
    }
    
    if (action === 'harvest') {
        const garden = user.rpg.garden
        const readyPlots = garden.plots.filter(p => {
            const crop = CROPS[p.crop]
            return Date.now() - p.plantedAt >= crop.growTime
        })
        
        if (readyPlots.length === 0) {
            return m.reply(`❌ Belum ada tanaman siap panen!`)
        }
        
        let totalExp = 0
        let harvestedItems = []
        
        for (const plot of readyPlots) {
            const crop = CROPS[plot.crop]
            const qty = Math.floor(Math.random() * 3) + 2
            user.inventory[plot.crop] = (user.inventory[plot.crop] || 0) + qty
            totalExp += crop.exp
            harvestedItems.push(`${crop.name} x${qty}`)
        }
        
        garden.plots = garden.plots.filter(p => {
            const crop = CROPS[p.crop]
            return Date.now() - p.plantedAt < crop.growTime
        })
        
        await addExpWithLevelCheck(sock, m, db, user, totalExp)
        db.save()
        
        await m.react('✅')
        return m.reply(
            `🌾 *ᴘᴀɴᴇɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `╭┈┈⬡「 📦 *ʜᴀsɪʟ* 」\n` +
            harvestedItems.map(h => `┃ ${h}`).join('\n') + `\n` +
            `┃ ✨ EXP: +${totalExp}\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
