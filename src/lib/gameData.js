/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Owner = Syura Salsabila
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 * 
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data');

const gameCache = new Map();
const gameSessions = new Map();

function loadData(filename) {
    if (gameCache.has(filename)) {
        return gameCache.get(filename);
    }
    
    const filePath = path.join(dataPath, filename);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        gameCache.set(filename, data);
        return data;
    } catch (error) {
        console.error(`Error loading ${filename}:`, error.message);
        return [];
    }
}

function getRandomItem(filename) {
    const data = loadData(filename);
    if (!data || data.length === 0) return null;
    return data[Math.floor(Math.random() * data.length)];
}

function getItemByIndex(filename, index) {
    const data = loadData(filename);
    if (!data || data.length === 0) return null;
    return data.find(item => item.index === index) || data[index] || null;
}

function searchItem(filename, query, field = 'latin') {
    const data = loadData(filename);
    if (!data || data.length === 0) return null;
    const queryLower = query.toLowerCase();
    return data.find(item => 
        item[field] && item[field].toLowerCase().includes(queryLower)
    );
}

function getAllData(filename) {
    return loadData(filename);
}

function normalizeAnswer(answer) {
    if (!answer) return '';
    return answer
        .toLowerCase()
        .replace(/[^a-z0-9\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[m][n];
}

function getSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const distance = levenshteinDistance(str1, str2);
    return (maxLen - distance) / maxLen;
}

function checkAnswerAdvanced(correctAnswer, userAnswer) {
    const normalized1 = normalizeAnswer(correctAnswer);
    const normalized2 = normalizeAnswer(userAnswer);
    
    if (normalized1 === normalized2) {
        return { status: 'correct', similarity: 1 };
    }
    
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        if (normalized2.length >= normalized1.length * 0.8) {
            return { status: 'correct', similarity: 0.95 };
        }
    }
    
    const similarity = getSimilarity(normalized1, normalized2);
    
    if (similarity >= 0.85) {
        return { status: 'correct', similarity };
    }
    
    if (similarity >= 0.6) {
        return { status: 'close', similarity };
    }
    
    return { status: 'wrong', similarity };
}

function checkAnswer(correctAnswer, userAnswer) {
    const result = checkAnswerAdvanced(correctAnswer, userAnswer);
    return result.status === 'correct';
}

function getHint(answer, revealCount = 2) {
    if (!answer) return '';
    const chars = answer.split('');
    const hintChars = chars.map((char, i) => {
        if (char === ' ') return ' ';
        if (i < revealCount) return char;
        return '_';
    });
    return hintChars.join('');
}

function isSurrender(text) {
    if (!text) return false;
    const surrenderWords = [
        'nyerah', 'aku nyerah', 'gw nyerah', 'gue nyerah', 'menyerah',
        'aku menyerah', 'gw menyerah', 'skip', 'lewat', 'ga tau',
        'gatau', 'gak tau', 'tidak tau', 'nggak tau', 'give up'
    ];
    const normalized = text.toLowerCase().trim();
    return surrenderWords.some(word => normalized === word || normalized.includes(word));
}

function createSession(chatId, gameType, questionData, messageKey, timeout = 60000) {
    if (gameSessions.has(chatId)) {
        const oldSession = gameSessions.get(chatId);
        if (oldSession.timer) {
            clearTimeout(oldSession.timer);
        }
    }
    
    const session = {
        chatId,
        gameType,
        question: questionData,
        messageKey,
        startTime: Date.now(),
        timeout,
        endTime: Date.now() + timeout,
        attempts: 0,
        timer: null,
        onTimeout: null
    };
    
    gameSessions.set(chatId, session);
    return session;
}

function setSessionTimer(chatId, callback) {
    const session = gameSessions.get(chatId);
    if (!session) return;
    
    const remaining = session.endTime - Date.now();
    if (remaining <= 0) {
        callback();
        return;
    }
    
    session.timer = setTimeout(() => {
        const currentSession = gameSessions.get(chatId);
        if (currentSession && currentSession.startTime === session.startTime) {
            callback();
            gameSessions.delete(chatId);
        }
    }, remaining);
    
    session.onTimeout = callback;
}

function getSession(chatId) {
    return gameSessions.get(chatId) || null;
}

function endSession(chatId) {
    const session = gameSessions.get(chatId);
    if (session && session.timer) {
        clearTimeout(session.timer);
    }
    gameSessions.delete(chatId);
    return session;
}

function hasActiveSession(chatId) {
    return gameSessions.has(chatId);
}

function getRemainingTime(chatId) {
    const session = gameSessions.get(chatId);
    if (!session) return 0;
    const remaining = Math.max(0, session.endTime - Date.now());
    return Math.ceil(remaining / 1000);
}

function formatRemainingTime(seconds) {
    if (seconds <= 0) return '0 detik';
    if (seconds < 60) return `${seconds} detik`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function isReplyToGame(m, session) {
    if (!m.quoted || !session || !session.messageKey) return false;
    return m.quoted.id === session.messageKey.id;
}

const GAME_REWARD = {
    limit: 5,
    balance: 1000,
    exp: 2000
};

module.exports = {
    loadData,
    getRandomItem,
    getItemByIndex,
    searchItem,
    getAllData,
    normalizeAnswer,
    checkAnswer,
    checkAnswerAdvanced,
    getSimilarity,
    getHint,
    isSurrender,
    createSession,
    setSessionTimer,
    getSession,
    endSession,
    hasActiveSession,
    getRemainingTime,
    formatRemainingTime,
    isReplyToGame,
    GAME_REWARD
};
