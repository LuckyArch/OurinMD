const { getDatabase } = require('../../src/lib/database');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const pluginConfig = {
    name: 'antispam',
    alias: ['setantispam'],
    category: 'group',
    description: 'Anti spam dengan sistem warning dan kick',
    usage: '.antispam <on/off> [max_pesan] [interval] [max_warn]',
    example: '.antispam on 5 10 3',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const limiters = new Map();
const warnTracker = new Map();

function getLimiter(chatId, maxMessages, interval) {
    const key = `${chatId}_${maxMessages}_${interval}`;
    let limiter = limiters.get(key);
    if (!limiter) {
        limiter = new RateLimiterMemory({
            points: maxMessages - 1,
            duration: interval,
            keyPrefix: chatId,
        });
        limiters.set(key, limiter);
    }
    return limiter;
}

async function handler(m, { sock }) {
    const db = getDatabase();
    const args = m.args || [];
    const subCmd = args[0]?.toLowerCase();

    let groupData = db.getGroup(m.chat) || {};

    if (!subCmd || subCmd === 'status') {
        const settings = groupData.antispam || {};
        const status = settings.enabled ? '✅ ON' : '❌ OFF';
        const maxMsg = settings.maxMessages || 5;
        const interval = settings.interval || 10;
        const maxWarn = settings.maxWarn || 3;
        const action = settings.action || 'kick';

        let txt = `🛡️ *ᴀɴᴛɪsᴘᴀᴍ*\n\n`;
        txt += `╭─────────────\n`;
        txt += `┃ 📊 Status: *${status}*\n`;
        txt += `┃ 📨 Max pesan: *${maxMsg}* / *${interval}s*\n`;
        txt += `┃ ⚠️ Max warn: *${maxWarn}x*\n`;
        txt += `┃ 🎯 Aksi: *${action === 'kick' ? 'Kick' : 'Mute'}*\n`;
        txt += `╰─────────────\n\n`;
        txt += `*ᴘᴀɴᴅᴜᴀɴ:*\n`;
        txt += `> \`${m.prefix}antispam on\`\n`;
        txt += `> \`${m.prefix}antispam off\`\n`;
        txt += `> \`${m.prefix}antispam on 5 10 3\`\n`;
        txt += `>   (5 pesan/10s, 3 warn)\n`;
        txt += `> \`${m.prefix}antispam warn 5\`\n`;
        txt += `>   Set max warning\n`;
        txt += `> \`${m.prefix}antispam action kick/mute\`\n`;
        txt += `>   Set aksi setelah max warn\n`;
        txt += `> \`${m.prefix}antispam reset @user\`\n`;
        txt += `>   Reset warning user`;

        await m.reply(txt);
        return;
    }

    if (subCmd === 'on') {
        const maxMessages = parseInt(args[1]) || groupData.antispam?.maxMessages || 5;
        const interval = parseInt(args[2]) || groupData.antispam?.interval || 10;
        const maxWarn = parseInt(args[3]) || groupData.antispam?.maxWarn || 3;

        if (maxMessages < 2 || maxMessages > 20) {
            return m.reply(`⚠️ Max pesan harus 2-20.`);
        }

        if (interval < 5 || interval > 60) {
            return m.reply(`⚠️ Interval harus 5-60 detik.`);
        }

        if (maxWarn < 1 || maxWarn > 10) {
            return m.reply(`⚠️ Max warning harus 1-10.`);
        }

        db.setGroup(m.chat, {
            ...groupData,
            antispam: {
                enabled: true,
                maxMessages,
                interval,
                maxWarn,
                action: groupData.antispam?.action || 'kick'
            }
        });

        limiters.delete(`${m.chat}_${maxMessages}_${interval}`);

        await m.reply(
            `✅ *ᴀɴᴛɪsᴘᴀᴍ ᴀᴋᴛɪꜰ*\n\n` +
            `> 📨 Max: *${maxMessages}* pesan/*${interval}s*\n` +
            `> ⚠️ Max warn: *${maxWarn}x*\n` +
            `> 🎯 Aksi: *${groupData.antispam?.action || 'Kick'}*`
        );
        return;
    }

    if (subCmd === 'off') {
        db.setGroup(m.chat, {
            ...groupData,
            antispam: { ...groupData.antispam, enabled: false }
        });
        await m.reply(`❌ Antispam *dinonaktifkan*!`);
        return;
    }

    if (subCmd === 'warn') {
        const newMaxWarn = parseInt(args[1]);
        if (!newMaxWarn || newMaxWarn < 1 || newMaxWarn > 10) {
            return m.reply(`⚠️ Max warning harus 1-10.\n> Contoh: \`${m.prefix}antispam warn 3\``);
        }

        db.setGroup(m.chat, {
            ...groupData,
            antispam: { ...groupData.antispam, maxWarn: newMaxWarn }
        });

        await m.reply(`✅ Max warning diset ke *${newMaxWarn}x*`);
        return;
    }

    if (subCmd === 'action') {
        const action = args[1]?.toLowerCase();
        if (!['kick', 'mute'].includes(action)) {
            return m.reply(`⚠️ Aksi harus \`kick\` atau \`mute\`.\n> Contoh: \`${m.prefix}antispam action kick\``);
        }

        db.setGroup(m.chat, {
            ...groupData,
            antispam: { ...groupData.antispam, action }
        });

        await m.reply(`✅ Aksi antispam diset ke *${action === 'kick' ? 'Kick' : 'Mute'}*`);
        return;
    }

    if (subCmd === 'reset') {
        const mentioned = m.mentionedJid?.[0] || m.quoted?.sender;
        if (!mentioned) {
            return m.reply(`⚠️ Tag atau reply user yang ingin direset warningnya.`);
        }

        const warnKey = `${m.chat}_${mentioned}`;
        warnTracker.delete(warnKey);

        await m.reply(`✅ Warning @${mentioned.split('@')[0]} direset!`, { mentions: [mentioned] });
        return;
    }

    await m.reply(`❌ Subcommand tidak valid.\n> Ketik \`${m.prefix}antispam\` untuk panduan.`);
}

async function checkSpam(m, sock, db) {
    if (!m.isGroup) return false;
    if (m.isAdmin || m.isOwner) return false;

    const groupData = db.getGroup(m.chat) || {};
    if (!groupData.antispam?.enabled) return false;

    const maxMessages = groupData.antispam?.maxMessages || 5;
    const interval = groupData.antispam?.interval || 10;

    const limiter = getLimiter(m.chat, maxMessages, interval);

    try {
        await limiter.consume(m.sender);
        return false;
    } catch {
        return true;
    }
}

async function handleSpamAction(m, sock, db) {
    if (!m.isGroup || !m.isBotAdmin) return;
    if (m.isAdmin || m.isOwner) return;

    const groupData = db.getGroup(m.chat) || {};
    const maxWarn = groupData.antispam?.maxWarn || 3;
    const action = groupData.antispam?.action || 'kick';

    const warnKey = `${m.chat}_${m.sender}`;
    let warnCount = warnTracker.get(warnKey) || 0;
    warnCount++;
    warnTracker.set(warnKey, warnCount);

    try {
        await sock.sendMessage(m.chat, { delete: m.key });
    } catch {}

    if (warnCount >= maxWarn) {
        warnTracker.delete(warnKey);

        if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                await sock.sendMessage(m.chat, {
                    text: `🚫 *ᴀɴᴛɪsᴘᴀᴍ*\n\n` +
                          `> @${m.sender.split('@')[0]} telah di-*kick*\n` +
                          `> Alasan: Spam (${maxWarn}/${maxWarn} warning)`,
                    mentions: [m.sender]
                });
            } catch {}
        } else {
            await sock.sendMessage(m.chat, {
                text: `🔇 *ᴀɴᴛɪsᴘᴀᴍ*\n\n` +
                      `> @${m.sender.split('@')[0]} mencapai limit warning\n` +
                      `> Status: *${maxWarn}/${maxWarn} warning*\n` +
                      `> Admin silakan take action.`,
                mentions: [m.sender]
            });
        }
    } else {
        await sock.sendMessage(m.chat, {
            text: `⚠️ *ᴡᴀʀɴɪɴɢ sᴘᴀᴍ*\n\n` +
                  `> @${m.sender.split('@')[0]} terdeteksi spam!\n` +
                  `> Warning: *${warnCount}/${maxWarn}*\n` +
                  `> ${warnCount >= maxWarn - 1 ? '⛔ Peringatan terakhir!' : 'Jangan spam lagi!'}`,
            mentions: [m.sender]
        });
    }
}

function getWarnCount(chatId, sender) {
    const key = `${chatId}_${sender}`;
    return warnTracker.get(key) || 0;
}

module.exports = {
    config: pluginConfig,
    handler,
    checkSpam,
    handleSpamAction,
    getWarnCount
};
