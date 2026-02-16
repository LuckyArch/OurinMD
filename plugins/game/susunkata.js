const { 
    getRandomItem, createSession, getSession, endSession, 
    checkAnswerAdvanced, hasActiveSession, setSessionTimer,
    getRemainingTime, formatRemainingTime, isSurrender, isReplyToGame,
    GAME_REWARD
} = require('../../src/lib/gameData');
const { getDatabase } = require('../../src/lib/database');
const { addExpWithLevelCheck } = require('../../src/lib/levelHelper');
const { getGameContextInfo } = require('../../src/lib/contextHelper');

const pluginConfig = {
    name: 'susunkata',
    alias: ['susun', 'scramble'],
    category: 'game',
    description: 'Susun huruf acak menjadi kata yang benar',
    usage: '.susunkata',
    example: '.susunkata',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

function scrambleWord(word) {
    const chars = word.split('');
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}

async function handler(m, { sock }) {
    const chatId = m.chat;
    
    if (hasActiveSession(chatId)) {
        const session = getSession(chatId);
        if (session && session.gameType === 'susunkata') {
            const remaining = getRemainingTime(chatId);
            let text = `⚠️ *ᴍᴀsɪʜ ᴀᴅᴀ ɢᴀᴍᴇ*\n\n`;
            text += `\`\`\`${session.question.scrambled}\`\`\`\n\n`;
            text += `> ⏱️ Sisa: *${formatRemainingTime(remaining)}*\n\n`;
            text += `_Reply pesan soal untuk menjawab atau ketik "nyerah"_`;
            await m.reply(text);
            return;
        }
    }
    
    const question = getRandomItem('susunkata.json');
    if (!question) {
        await m.reply('❌ *ᴅᴀᴛᴀ ᴛɪᴅᴀᴋ ᴛᴇʀsᴇᴅɪᴀ*\n\n> Data game tidak tersedia!');
        return;
    }
    
    const scrambled = scrambleWord(question.jawaban);
    const sessionData = { ...question, scrambled };
    
    let text = `🔀 *sᴜsᴜɴ ᴋᴀᴛᴀ*\n\n`;
    text += `\`\`\`${scrambled.toUpperCase()}\`\`\`\n\n`;
    text += `> 💡 Petunjuk: *${question.soal || 'Tidak ada'}*\n`;
    text += `> ⏱️ Waktu: *60 detik*\n`;
    text += `> 🎁 Hadiah: *+${GAME_REWARD.limit} Limit, +${GAME_REWARD.exp} EXP*\n\n`;
    text += `_Reply pesan ini dengan jawabanmu atau ketik "nyerah"_`;
    
    const sentMsg = await sock.sendMessage(chatId, { text, contextInfo: getGameContextInfo('🔀 SUSUN KATA', 'Susun huruf acak!') }, { quoted: m });
    
    createSession(chatId, 'susunkata', sessionData, sentMsg.key, 60000);
    
    setSessionTimer(chatId, async () => {
        let timeoutText = `⏱️ *ᴡᴀᴋᴛᴜ ʜᴀʙɪs!*\n\n`;
        timeoutText += `> Jawaban: *${question.jawaban}*\n\n`;
        timeoutText += `_Tidak ada yang berhasil menjawab_`;
        await sock.sendMessage(chatId, { text: timeoutText });
    });
}

async function answerHandler(m, sock) {
    const chatId = m.chat;
    const session = getSession(chatId);
    
    if (!session || session.gameType !== 'susunkata') return false;
    
    const userAnswer = m.text || m.body || '';
    if (!userAnswer || userAnswer.startsWith('.')) return false;
    
    if (isSurrender(userAnswer)) {
        endSession(chatId);
        let text = `🏳️ *ᴍᴇɴʏᴇʀᴀʜ!*\n\n`;
        text += `> Jawaban: *${session.question.jawaban}*\n\n`;
        text += `_@${m.sender.split('@')[0]} menyerah_`;
        await m.reply(text, { mentions: [m.sender] });
        return true;
    }
    
    if (!isReplyToGame(m, session)) {
        return false;
    }
    
    session.attempts++;
    
    const result = checkAnswerAdvanced(session.question.jawaban, userAnswer);
    
    if (result.status === 'correct') {
        endSession(chatId);
        
        const db = getDatabase();
        const user = db.getUser(m.sender);
        
        db.updateEnergi(m.sender, GAME_REWARD.limit);
        db.updateKoin(m.sender, GAME_REWARD.koin);
        
        if (!user.rpg) user.rpg = {};
        await addExpWithLevelCheck(sock, m, db, user, GAME_REWARD.exp);
        db.save();
        
        let text = `🎉 *ʙᴇɴᴀʀ!*\n\n`;
        text += `> Jawaban: *${session.question.jawaban}*\n`;
        text += `> Pemenang: *@${m.sender.split('@')[0]}*\n`;
        text += `> Percobaan: *${session.attempts}x*\n\n`;
        text += `╭┈┈⬡「 🎁 *ʜᴀᴅɪᴀʜ* 」\n`;
        text += `┃ 📊 +${GAME_REWARD.limit} Limit\n`;
        text += `┃ 💰 +${GAME_REWARD.koin} Balance\n`;
        text += `┃ ⭐ +${GAME_REWARD.exp} EXP\n`;
        text += `╰┈┈┈┈┈┈┈┈⬡`;
        
        await m.reply(text, { mentions: [m.sender] });
        return true;
    }
    
    if (result.status === 'close') {
        const remaining = getRemainingTime(chatId);
        const percent = Math.round(result.similarity * 100);
        await m.reply(`🔥 *ʜᴀᴍᴘɪʀ!* Jawabanmu *${percent}%* mirip!\n> _Sisa waktu: *${formatRemainingTime(remaining)}*_`);
        return false;
    }
    
    const remaining = getRemainingTime(chatId);
    if (remaining > 0 && session.attempts < 10) {
        await m.reply(`❌ *sᴀʟᴀʜ!* _Sisa waktu: *${formatRemainingTime(remaining)}*_`);
    }
    
    return false;
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
};
