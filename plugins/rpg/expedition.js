const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')

const pluginConfig = {
    name: 'expedition',
    alias: ['ekspedisi', 'exp', 'explore'],
    category: 'rpg',
    description: 'Kirim ekspedisi otomatis untuk item',
    usage: '.expedition <start/claim/status>',
    example: '.expedition start forest',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const EXPEDITIONS = {
    forest: { name: '🌲 Hutan', duration: 1800000, rewards: ['wood', 'herb', 'mushroom'], exp: 100, minLevel: 1 },
    cave: { name: '🏔️ Gua', duration: 3600000, rewards: ['iron', 'gold', 'gem'], exp: 200, minLevel: 5 },
    volcano: { name: '🌋 Gunung Api', duration: 7200000, rewards: ['lava', 'dragonscale', 'titancore'], exp: 400, minLevel: 15 },
    ocean: { name: '🌊 Samudra', duration: 5400000, rewards: ['fish', 'pearl', 'seagem'], exp: 300, minLevel: 10 },
    ruins: { name: '🏛️ Reruntuhan', duration: 10800000, rewards: ['ancientcoin', 'relic', 'mysterybox'], exp: 600, minLevel: 20 }
}

function formatTime(ms) {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    if (hours > 0) return `${hours}h ${minutes}m`
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.inventory) user.inventory = {}
    if (!user.rpg) user.rpg = {}
    if (!user.rpg.expeditions) user.rpg.expeditions = []
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const expType = args[1]?.toLowerCase()
    
    const maxExpeditions = Math.min(5, 1 + Math.floor((user.level || 1) / 10))
    
    if (!action || !['start', 'claim', 'status', 'list'].includes(action)) {
        let txt = `🗺️ *ᴇxᴘᴇᴅɪᴛɪᴏɴ sʏsᴛᴇᴍ*\n\n`
        txt += `> Kirim ekspedisi untuk farming otomatis!\n\n`
        txt += `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n`
        txt += `┃ ${m.prefix}expedition list\n`
        txt += `┃ ${m.prefix}expedition start <area>\n`
        txt += `┃ ${m.prefix}expedition status\n`
        txt += `┃ ${m.prefix}expedition claim\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `> 📊 Slot: ${user.rpg.expeditions.length}/${maxExpeditions}`
        return m.reply(txt)
    }
    
    if (action === 'list') {
        let txt = `🗺️ *ᴅᴀꜰᴛᴀʀ ᴇxᴘᴇᴅɪsɪ*\n\n`
        txt += `╭┈┈⬡「 📍 *ᴀʀᴇᴀ* 」\n`
        
        for (const [key, exp] of Object.entries(EXPEDITIONS)) {
            const canGo = (user.level || 1) >= exp.minLevel
            txt += `┃ ${exp.name} ${canGo ? '✅' : '🔒'}\n`
            txt += `┃ ⏱️ Durasi: ${formatTime(exp.duration)}\n`
            txt += `┃ 📦 Rewards: ${exp.rewards.join(', ')}\n`
            txt += `┃ ✨ EXP: ${exp.exp}\n`
            txt += `┃ 📊 Min Level: ${exp.minLevel}\n`
            txt += `┃ → \`${key}\`\n┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        return m.reply(txt)
    }
    
    if (action === 'start') {
        if (user.rpg.expeditions.length >= maxExpeditions) {
            return m.reply(`❌ Slot ekspedisi penuh! (${user.rpg.expeditions.length}/${maxExpeditions})`)
        }
        
        if (!expType) {
            return m.reply(`❌ Pilih area!\n\n> Contoh: \`${m.prefix}expedition start forest\``)
        }
        
        const exp = EXPEDITIONS[expType]
        if (!exp) {
            return m.reply(`❌ Area tidak ditemukan!`)
        }
        
        if ((user.level || 1) < exp.minLevel) {
            return m.reply(`❌ Level kurang! Minimal level ${exp.minLevel}`)
        }
        
        user.rpg.expeditions.push({
            type: expType,
            startedAt: Date.now(),
            duration: exp.duration
        })
        db.save()
        
        return m.reply(
            `✅ *ᴇxᴘᴇᴅɪsɪ ᴅɪᴍᴜʟᴀɪ*\n\n` +
            `> 📍 Area: *${exp.name}*\n` +
            `> ⏱️ Durasi: *${formatTime(exp.duration)}*\n\n` +
            `💡 Claim setelah selesai dengan \`${m.prefix}expedition claim\``
        )
    }
    
    if (action === 'status') {
        if (user.rpg.expeditions.length === 0) {
            return m.reply(`❌ Tidak ada ekspedisi aktif!`)
        }
        
        let txt = `🗺️ *sᴛᴀᴛᴜs ᴇxᴘᴇᴅɪsɪ*\n\n`
        txt += `╭┈┈⬡「 📍 *ᴀᴋᴛɪꜰ* 」\n`
        
        for (let i = 0; i < user.rpg.expeditions.length; i++) {
            const exp = user.rpg.expeditions[i]
            const expInfo = EXPEDITIONS[exp.type]
            const elapsed = Date.now() - exp.startedAt
            const remaining = Math.max(0, exp.duration - elapsed)
            const done = remaining <= 0
            
            txt += `┃ ${i + 1}. ${expInfo.name}\n`
            txt += `┃ ${done ? '✅ SELESAI!' : `⏳ ${formatTime(remaining)}`}\n`
            txt += `┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        return m.reply(txt)
    }
    
    if (action === 'claim') {
        const completedExps = user.rpg.expeditions.filter(e => {
            return Date.now() - e.startedAt >= e.duration
        })
        
        if (completedExps.length === 0) {
            return m.reply(`❌ Belum ada ekspedisi selesai!`)
        }
        
        let totalExp = 0
        let allRewards = []
        
        for (const exp of completedExps) {
            const expInfo = EXPEDITIONS[exp.type]
            totalExp += expInfo.exp
            
            for (const rewardItem of expInfo.rewards) {
                if (Math.random() > 0.4) {
                    const qty = Math.floor(Math.random() * 5) + 1
                    user.inventory[rewardItem] = (user.inventory[rewardItem] || 0) + qty
                    allRewards.push(`${rewardItem} x${qty}`)
                }
            }
        }
        
        user.rpg.expeditions = user.rpg.expeditions.filter(e => {
            return Date.now() - e.startedAt < e.duration
        })
        
        await addExpWithLevelCheck(sock, m, db, user, totalExp)
        db.save()
        
        await m.react('✅')
        
        let txt = `🎉 *ᴇxᴘᴇᴅɪsɪ sᴇʟᴇsᴀɪ*\n\n`
        txt += `> Klaim ${completedExps.length} ekspedisi\n\n`
        txt += `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅ* 」\n`
        txt += `┃ ✨ EXP: *+${totalExp}*\n`
        if (allRewards.length > 0) {
            txt += `┃ 📦 Items:\n`
            for (const r of allRewards) {
                txt += `┃   • ${r}\n`
            }
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        return m.reply(txt)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
