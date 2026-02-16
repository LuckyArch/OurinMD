const { getDatabase } = require('../../src/lib/database')
const { GAME_REWARD } = require('../../src/lib/gameData')
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper')
const config = require('../../config')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'quizbattle',
    alias: ['battle', 'qb', 'duelquiz'],
    category: 'game',
    description: 'Duel quiz 1v1 dengan user lain',
    usage: '.battle @user [jumlah soal]',
    example: '.battle @user 5',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energi: 1,
    isEnabled: true
}

if (!global.quizBattles) global.quizBattles = {}

function loadQuestions() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'quizbattle.json')
        const data = fs.readFileSync(filePath, 'utf-8')
        return JSON.parse(data)
    } catch {
        return [
            { q: 'Ibukota Indonesia?', a: 'jakarta' },
            { q: 'Planet terbesar?', a: 'jupiter' },
            { q: '1 + 1 = ?', a: '2' }
        ]
    }
}

function getRandomQuestions(count) {
    const questions = loadQuestions()
    const shuffled = [...questions].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const chatId = m.chat
    
    if (global.quizBattles[chatId]) {
        const battle = global.quizBattles[chatId]
        return m.reply(
            `❌ *ʙᴀᴛᴛʟᴇ ʙᴇʀʟᴀɴɢsᴜɴɢ*\n\n` +
            `> @${battle.player1.split('@')[0]} vs @${battle.player2.split('@')[0]}\n\n` +
            `> Tunggu sampai selesai!`
        )
    }
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    
    if (!target) {
        return m.reply(
            `⚔️ *ǫᴜɪᴢ ʙᴀᴛᴛʟᴇ*\n\n` +
            `> Tag user untuk battle!\n\n` +
            `*Format:*\n` +
            `> .battle @user\n` +
            `> .battle @user 5`
        )
    }
    
    if (target === m.sender) {
        return m.reply(`❌ Tidak bisa battle dengan diri sendiri!`)
    }
    
    const questionCount = parseInt(m.args?.[1]) || 5
    const validCount = Math.max(3, Math.min(10, questionCount))
    
    const questions = getRandomQuestions(validCount)
    
    global.quizBattles[chatId] = {
        player1: m.sender,
        player2: target,
        questions: questions,
        currentQ: 0,
        scores: { [m.sender]: 0, [target]: 0 },
        answered: false,
        startTime: Date.now(),
        timeout: null
    }
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
    
    await sock.sendMessage(chatId, {
        text: `⚔️ *ǫᴜɪᴢ ʙᴀᴛᴛʟᴇ ᴅɪᴍᴜʟᴀɪ!*\n\n` +
            `╭┈┈⬡「 👥 *ᴘᴇᴍᴀɪɴ* 」\n` +
            `┃ 🔴 @${m.sender.split('@')[0]}\n` +
            `┃ 🔵 @${target.split('@')[0]}\n` +
            `├┈┈⬡「 📋 *ɪɴғᴏ* 」\n` +
            `┃ 📝 Soal: ${validCount}\n` +
            `┃ ⏱️ Waktu: 15 detik/soal\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Siapa yang menjawab duluan dapat poin!\n` +
            `> Ketik jawaban langsung tanpa command`,
        mentions: [m.sender, target],
        contextInfo: {
            mentionedJid: [m.sender, target],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    setTimeout(() => sendQuestion(chatId, sock), 2000)
}

async function sendQuestion(chatId, sock) {
    const battle = global.quizBattles[chatId]
    if (!battle) return
    
    if (battle.currentQ >= battle.questions.length) {
        return endBattle(chatId, sock)
    }
    
    const q = battle.questions[battle.currentQ]
    battle.answered = false
    
    await sock.sendMessage(chatId, {
        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
            `┃  ❓ *sᴏᴀʟ ${battle.currentQ + 1}/${battle.questions.length}*\n` +
            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
            `> ${q.q}\n\n` +
            `⏱️ *15 detik!*`
    })
    
    battle.timeout = setTimeout(() => {
        if (!battle.answered) {
            sock.sendMessage(chatId, {
                text: `⏱️ *ᴡᴀᴋᴛᴜ ʜᴀʙɪs!*\n\n` +
                    `> Jawaban: *${q.a}*`
            })
            battle.currentQ++
            setTimeout(() => sendQuestion(chatId, sock), 2000)
        }
    }, 15000)
}

async function endBattle(chatId, sock) {
    const battle = global.quizBattles[chatId]
    if (!battle) return
    
    if (battle.timeout) clearTimeout(battle.timeout)
    
    const db = getDatabase()
    const p1Score = battle.scores[battle.player1]
    const p2Score = battle.scores[battle.player2]
    
    let winner = null
    let loser = null
    let resultText = ''
    
    if (p1Score > p2Score) {
        winner = battle.player1
        loser = battle.player2
        resultText = `🏆 @${battle.player1.split('@')[0]} MENANG!`
    } else if (p2Score > p1Score) {
        winner = battle.player2
        loser = battle.player1
        resultText = `🏆 @${battle.player2.split('@')[0]} MENANG!`
    } else {
        resultText = `🤝 SERI!`
    }
    
    if (winner) {
        db.updateKoin(winner, GAME_REWARD.koin * 2)
        db.updateEnergi(winner, GAME_REWARD.limit)
        const winnerUser = db.getUser(winner)
        await addExpWithLevelCheck(sock, { sender: winner, chat: chatId }, db, winnerUser, GAME_REWARD.exp * 2)
        
        db.updateKoin(loser, Math.floor(GAME_REWARD.koin / 2))
        const loserUser = db.getUser(loser)
        await addExpWithLevelCheck(sock, { sender: loser, chat: chatId }, db, loserUser, Math.floor(GAME_REWARD.exp / 2))
    } else {
        db.updateKoin(battle.player1, GAME_REWARD.koin)
        db.updateKoin(battle.player2, GAME_REWARD.koin)
    }
    
    await sock.sendMessage(chatId, {
        text: `╭━━━━━━━━━━━━━━━━━╮\n` +
            `┃  🏁 *ʙᴀᴛᴛʟᴇ sᴇʟᴇsᴀɪ!*\n` +
            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
            `${resultText}\n\n` +
            `╭┈┈⬡「 📊 *sᴋᴏʀ* 」\n` +
            `┃ 🔴 @${battle.player1.split('@')[0]}: ${p1Score}\n` +
            `┃ 🔵 @${battle.player2.split('@')[0]}: ${p2Score}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> +${GAME_REWARD.koin * 2} balance (winner)\n` +
            `> +${GAME_REWARD.exp * 2} exp (winner)`,
        mentions: [battle.player1, battle.player2]
    })
    
    delete global.quizBattles[chatId]
}

async function answerHandler(m, { sock }) {
    const chatId = m.chat
    const battle = global.quizBattles[chatId]
    
    if (!battle) return false
    if (battle.answered) return false
    if (m.sender !== battle.player1 && m.sender !== battle.player2) return false
    
    const currentQ = battle.questions[battle.currentQ]
    if (!currentQ) return false
    
    const userAnswer = (m.body || '').toLowerCase().trim()
    const correctAnswer = currentQ.a.toLowerCase().trim()
    
    if (userAnswer === correctAnswer) {
        battle.answered = true
        if (battle.timeout) clearTimeout(battle.timeout)
        
        battle.scores[m.sender]++
        
        await sock.sendMessage(chatId, {
            text: `✅ *ʙᴇɴᴀʀ!*\n\n` +
                `> @${m.sender.split('@')[0]} dapat 1 poin!\n\n` +
                `📊 Skor: ${battle.scores[battle.player1]} - ${battle.scores[battle.player2]}`,
            mentions: [m.sender]
        })
        
        battle.currentQ++
        setTimeout(() => sendQuestion(chatId, sock), 2000)
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
