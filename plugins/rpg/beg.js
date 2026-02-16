const { getDatabase } = require('../../src/lib/database')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const { getRpgContextInfo } = require('../../src/lib/contextHelper')

const pluginConfig = {
    name: 'beg',
    alias: ['ngemis', 'minta'],
    category: 'rpg',
    description: 'Mengemis untuk mendapatkan uang receh',
    usage: '.beg',
    example: '.beg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    await m.reply('🙏 *sᴇᴅᴀɴɢ ᴍᴇɴɢᴇᴍɪs...*')
    await new Promise(r => setTimeout(r, 2000))
    
    const responses = [
        { success: true, money: 500, exp: 10, msg: 'Seorang dermawan memberikanmu uang!' },
        { success: true, money: 1000, exp: 20, msg: 'Kamu dapat tips dari orang baik!' },
        { success: true, money: 2000, exp: 50, msg: 'WOW! Ada sultan yang kasihan!' },
        { success: false, money: 0, exp: 0, msg: 'Tidak ada yang peduli...' },
        { success: false, money: 0, exp: 0, msg: 'Orang-orang mengabaikanmu...' },
        { success: true, money: 100, exp: 5, msg: 'Dapat receh dari kantong orang!' },
        { success: false, money: -500, exp: 0, msg: 'Kamu malah dirampok pengemis lain!' }
    ]
    
    const result = responses[Math.floor(Math.random() * responses.length)]
    
    if (result.money > 0) {
        user.koin = (user.koin || 0) + result.money
        if (result.exp > 0) {
            await addExpWithLevelCheck(sock, m, db, user, result.exp)
        }
    } else if (result.money < 0) {
        user.koin = Math.max(0, (user.koin || 0) + result.money)
    }
    
    db.save()
    
    let txt = ''
    if (result.success && result.money > 0) {
        txt = `🙏 *ɴɢᴇᴍɪs sᴜᴋsᴇs*\n\n> ${result.msg}\n> 💰 Dapat: *+Rp ${result.money.toLocaleString('id-ID')}*`
        if (result.exp > 0) txt += `\n> 🚄 Exp: *+${result.exp}*`
    } else if (result.money < 0) {
        txt = `😭 *ɴɢᴇᴍɪs ɢᴀɢᴀʟ*\n\n> ${result.msg}\n> 💸 Lost: *Rp ${Math.abs(result.money).toLocaleString('id-ID')}*`
    } else {
        txt = `😢 *ɴɢᴇᴍɪs ɢᴀɢᴀʟ*\n\n> ${result.msg}`
    }
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
