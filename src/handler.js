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

const config = require("../config");
const { isSelf } = require("../config");
const { serialize } = require("./lib/serialize");
const {
  getPlugin,
  getPluginCount,
  getAllPlugins,
  pluginStore,
} = require("./lib/plugins");
const {
  findSimilarCommands,
  formatSuggestionMessage,
} = require("./lib/similarity");
const { getDatabase } = require("./lib/database");
const {
  formatUptime,
  createWaitMessage,
  createErrorMessage,
} = require("./lib/formatter");
const { getUptime } = require("./connection");
const { logger, logMessage, logCommand, c } = require("./lib/colors");
const {
  isLid,
  isLidConverted,
  lidToJid,
  convertLidArray,
  resolveAnyLidToJid,
  cacheParticipantLids,
} = require("./lib/lidHelper");
const { hasActiveSession } = require("./lib/gameData");
const {
  handleAntilink,
  handleAntiRemove,
  cacheMessageForAntiRemove,
  handleAntilinkGc,
  handleAntilinkAll,
  handleAntiHidetag,
} = require("./lib/groupProtection");
const {
  debounceMessage,
  getCachedUser,
  getCachedGroup,
  getCachedSetting,
} = require("./lib/performanceOptimizer");
const {
  isJadibotOwner,
  isJadibotPremium,
  loadJadibotDb,
} = require("./lib/jadibotDatabase");
const { getActiveJadibots } = require("./lib/jadibotManager");
const { handleCommand: handleCaseCommand } = require("../case/ourin");
const fs = require("fs");

let checkAfk = null;
let isMuted = null;
let checkSpam = null;
let handleSpamAction = null;
let checkSlowmode = null;
let addXp = null;
let checkLevelUp = null;
let incrementChatCount = null;
let checkStickerCommand = null;

// Antispam delay tracker - users who were detected spamming get 3s delay
const spamDelayTracker = new Map();

try {
  checkAfk = require("../plugins/group/afk").checkAfk;
} catch (e) {}

try {
  isMuted = require("../plugins/group/mute").isMuted;
} catch (e) {}

try {
  const antispamModule = require("../plugins/group/antispam");
  checkSpam = antispamModule.checkSpam;
  handleSpamAction = antispamModule.handleSpamAction;
} catch (e) {}

try {
  checkSlowmode = require("../plugins/group/slowmode").checkSlowmode;
} catch (e) {}

let isToxic = null;
let handleToxicMessage = null;
try {
  const toxicModule = require("../plugins/group/antitoxic");
  isToxic = toxicModule.isToxic;
  handleToxicMessage = toxicModule.handleToxicMessage;
} catch (e) {}

let handleAutoAI = null;
try {
  handleAutoAI = require("./lib/autoaiHandler").handleAutoAI;
} catch (e) {}

let handleAutoDownload = null;
try {
  handleAutoDownload = require("./lib/autoDownload").handleAutoDownload;
} catch (e) {}

try {
  const levelModule = require("../plugins/user/level");
  addXp = levelModule.addXp;
  checkLevelUp = levelModule.checkLevelUp;
} catch (e) {}

try {
  incrementChatCount = require("../plugins/group/totalchat").incrementChatCount;
} catch (e) {}

try {
  checkStickerCommand = require("./lib/stickerCommand").checkStickerCommand;
} catch (e) {}

let detectBot = null;
try {
  detectBot = require("../plugins/group/antibot").detectBot;
} catch (e) {}

let autoStickerHandler = null;
try {
  autoStickerHandler =
    require("../plugins/group/autosticker").autoStickerHandler;
} catch (e) {}

let autoMediaHandler = null;
try {
  autoMediaHandler = require("../plugins/group/automedia").autoMediaHandler;
} catch (e) {}

let checkAntidocument = null;
try {
  checkAntidocument = require("../plugins/group/antidocument").checkAntidocument;
} catch (e) {}

let checkAntisticker = null;
try {
  checkAntisticker = require("../plugins/group/antisticker").checkAntisticker;
} catch (e) {}

let checkAntimedia = null;
try {
  checkAntimedia = require("../plugins/group/antimedia").checkAntimedia;
} catch (e) {}

/**
 * @typedef {Object} HandlerContext
 * @property {Object} sock - Socket connection
 * @property {Object} m - Serialized message
 * @property {Object} config - Bot configuration
 * @property {Object} db - Database instance
 * @property {number} uptime - Bot uptime
 */

/**
 * Anti-spam map untuk tracking pesan per user
 * @type {Map<string, number>}
 */
const { RateLimiterMemory } = require('rate-limiter-flexible');
const globalRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 3,
  blockDuration: 5,
});

const gamePlugins = [
  "asahotak",
  "tebakkata",
  "tebakgambar",
  "siapakahaku",
  "tekateki",
  "susunkata",
  "caklontong",
  "family100",
  "tebakbendera",
  "tebakkalimat",
  "tebaklirik",
  "tebaktebakan",
  "tebakkimia",
  "tebakdrakor",
  "tebakepep",
  "tebakjkt48",
  "tebakmakanan",
  "quizbattle",
];

// Pre-cache game plugins at startup for performance
const cachedGamePlugins = new Map();
for (const gameName of gamePlugins) {
  try {
    const plugin = require(`../plugins/game/${gameName}`);
    if (plugin.answerHandler) cachedGamePlugins.set(gameName, plugin);
  } catch (e) {}
}

let sulapPlugin = null;
try {
  sulapPlugin = require("../plugins/fun/sulap");
} catch (e) {}

async function handleGameAnswer(m, sock) {
  try {
    try {
      const sulapPlugin = require("../plugins/fun/sulap");
      if (sulapPlugin?.answerHandler) {
        const handled = await sulapPlugin.answerHandler(m, sock);
        if (handled) return true;
      }
    } catch (e) {}

    for (const [, gamePlugin] of cachedGamePlugins) {
      const handled = await gamePlugin.answerHandler(m, sock);
      if (handled) return true;
    }
  } catch (error) {}
  return false;
}

async function handleSmartTriggers(m, sock, db) {
  if (m.isCommand) return false;
  if (!m.body) return false;

  const text = m.body.trim().toLowerCase();

  if (text === "done") {
    const sessions = db.setting("transactionSessions") || {};
    if (sessions[m.sender]) {
      try {
        const { handleBuyerDone } = require("../plugins/store/done");
        const session = sessions[m.sender];
        await handleBuyerDone(m, sock, session);
        delete sessions[m.sender];
        db.setting("transactionSessions", sessions);
        await db.save();
        return true;
      } catch (e) {
        console.error("[Handler] Done trigger error:", e.message);
      }
    }
  }

  if (global.registrationSessions?.[m.sender]) {
    try {
      const { registrationAnswerHandler } = require("../plugins/user/daftar");
      const handled = await registrationAnswerHandler(m, sock);
      if (handled) return true;
    } catch (e) {
      console.error("[Handler] Registration answer error:", e.message);
    }
  }

  const globalSmartTriggers =
    db.setting("smartTriggers") ?? config.features?.smartTriggers ?? false;

  try {
    const saluranId = config.saluran?.id || "120363208449943317@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Ourin-AI";
    const botName = config.bot?.name || "Ourin-AI";

    let isAutoreplyEnabled = globalSmartTriggers;
    const timeHelper = require("./lib/timeHelper");

    const processCustomReply = async (replyItem) => {
      let replyText = (replyItem.reply || '')
        .replace(/{name}/g, m.pushName || "User")
        .replace(/{tag}/g, `@${m.sender.split("@")[0]}`)
        .replace(/{sender}/g, m.sender.split("@")[0])
        .replace(/{botname}/g, config.bot?.name || "Bot")
        .replace(/{time}/g, timeHelper.formatTime("HH:mm:ss"))
        .replace(/{date}/g, timeHelper.formatDate("DD MMMM YYYY"));

      const mentions = replyText.includes(`@${m.sender.split("@")[0]}`)
        ? [m.sender]
        : [];

      if (replyItem.image && fs.existsSync(replyItem.image)) {
        const imageBuffer = fs.readFileSync(replyItem.image);
        await sock.sendMessage(
          m.chat,
          {
            image: imageBuffer,
            caption: replyText || undefined,
            mentions: mentions,
          },
          { quoted: m },
        );
      } else {
        await sock.sendMessage(
          m.chat,
          {
            text: replyText,
            mentions: mentions,
          },
          { quoted: m },
        );
      }
      return true;
    };

    if (m.isGroup) {
      const groupData = db.getGroup(m.chat) || {};
      isAutoreplyEnabled = groupData.autoreply ?? globalSmartTriggers;

      if (!isAutoreplyEnabled) return false;

      const customReplies = groupData.customReplies || [];
      for (const replyItem of customReplies) {
        if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
          return await processCustomReply(replyItem);
        }
      }
    } else {
      const privateAutoreply = db.setting("autoreplyPrivate") ?? false;
      if (!privateAutoreply && !globalSmartTriggers) return false;
      isAutoreplyEnabled = privateAutoreply || globalSmartTriggers;

      if (isAutoreplyEnabled) {
        const globalCustomReplies = db.setting("globalCustomReplies") || [];
        for (const replyItem of globalCustomReplies) {
          if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
            return await processCustomReply(replyItem);
          }
        }
      }
    }

    if (!isAutoreplyEnabled) return false;

    const botJid = sock.user?.id;
    const isMentioned = m.mentionedJid?.some(
      (jid) => jid === botJid || jid?.includes(sock.user?.id?.split(":")[0]),
    );

    let thumbBuffer = null;
    const thumbPath = "./assets/images/ourin2.jpg";
    try {
      if (fs.existsSync(thumbPath)) {
        thumbBuffer = fs.readFileSync(thumbPath);
      }
    } catch (e) {}

    const contextInfos = {
      forwardingScore: 9999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: saluranId,
        newsletterName: saluranName,
        serverMessageId: 127,
      },
    };

    if (thumbBuffer) {
      contextInfos.externalAdReply = {
        title: botName,
        body: config.bot?.version ? `v${config.bot.version}` : null,
        thumbnail: thumbBuffer,
        mediaType: 1,
        sourceUrl: config.saluran?.link || "https://wa.me/6281277777777",
        renderLargerThumbnail: false,
      };
    }

    if (isMentioned) {
      await sock.sendMessage(
        m.chat,
        {
          text:
            `👋 *ʜᴀɪ!*\n\n` +
            `> Ada yang manggil ${botName}?\n` +
            `> Ketik \`.menu\` untuk melihat fitur!\n\n` +
            `> _${botName} siap membantu! ✨_`,
          contextInfo: contextInfos,
        },
        { quoted: m },
      );
      return true;
    }

    if (text?.toLowerCase() === "p") {
      await sock.sendMessage(
        m.chat,
        {
          text:
            `💬 *ʜᴀɪ @${m.sender.split("@")[0]}!*\n\n` +
            `> Budayakan salam sebelum\n` +
            `> memulai percakapan! 🙏\n\n` +
            `> _Contoh: Assalamualaikum, Halo, dll_`,
          mentions: [m.sender],
          contextInfo: contextInfos,
        },
        { quoted: m },
      );
      return true;
    }

    if (
      text?.toLowerCase() === "bot" ||
      text?.toLowerCase().includes("ourin")
    ) {
      await sock.sendMessage(
        m.chat,
        {
          text:
            `🤖 *ʙᴏᴛ ᴀᴋᴛɪꜰ*\n\n` +
            `> ${botName} online dan siap!\n` +
            `> Ketik \`.menu\` untuk melihat fitur\n\n` +
            `> _Response time: < 1s ⚡_`,
          contextInfo: contextInfos,
        },
        { quoted: m },
      );
      return true;
    }

    if (text?.toLowerCase()?.includes("assalamualaikum")) {
      await sock.sendMessage(
        m.chat,
        {
          text: `Waaalaikumssalam saudaraku`,
          contextInfo: contextInfos,
        },
        { quoted: m },
      );
      return true;
    }
  } catch (error) {
    console.error("[SmartTriggers] Error:", error.message);
  }

  return false;
}

/**
 * Cek apakah user sedang spam
 * @param {string} jid - JID user
 * @returns {boolean} True jika sedang spam
 */
async function isSpamming(jid) {
  if (!config.features?.antiSpam) return false;

  try {
    await globalRateLimiter.consume(jid);
    return false;
  } catch {
    return true;
  }
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Cek permission untuk menjalankan command
 * @param {Object} m - Serialized message
 * @param {Object} pluginConfig - Konfigurasi plugin
 * @returns {{allowed: boolean, reason: string}} Object dengan status dan alasan
 */
function checkPermission(m, pluginConfig) {
  const db = getDatabase();
  const user = db.getUser(m.sender) || {};
  let hasAccess = false;
  if (user.access && m.command) {
    const accessFound = user.access.find(
      (a) => a.cmd === m.command.toLowerCase(),
    );
    if (accessFound) {
      if (accessFound.expired === null || accessFound.expired > Date.now()) {
        hasAccess = true;
        console.log("[DEBUG Access] Access Granted!");
      } else {
        user.access = user.access.filter(
          (a) => a.cmd !== m.command.toLowerCase(),
        );
        db.setUser(m.sender, user);
      }
    }
  }

  if (pluginConfig.isOwner && !m.isOwner && !hasAccess) {
    return {
      allowed: false,
      reason: config.messages?.ownerOnly || "🚫 Owner only!",
    };
  }

  if (pluginConfig.isPartner && !m.isPartner && !m.isOwner && !hasAccess) {
    return {
      allowed: false,
      reason: "🤝 Partner only!",
    };
  }

  if (pluginConfig.isPremium && !m.isPremium && !m.isOwner && !m.isPartner && !hasAccess) {
    return {
      allowed: false,
      reason: config.messages?.premiumOnly || "💎 Premium only!",
    };
  }

  if (pluginConfig.isGroup && !m.isGroup) {
    return {
      allowed: false,
      reason: config.messages?.groupOnly || "👥 Group only!",
    };
  }

  if (pluginConfig.isPrivate && m.isGroup) {
    return {
      allowed: false,
      reason: config.messages?.privateOnly || "📱 Private chat only!",
    };
  }

  if (
    pluginConfig.isAdmin &&
    m.isGroup &&
    !m.isAdmin &&
    !m.isOwner &&
    !hasAccess
  ) {
    return {
      allowed: false,
      reason: config.messages?.adminOnly || "👮 Admin grup only!",
    };
  }

  if (pluginConfig.isBotAdmin && m.isGroup && !m.isBotAdmin) {
    return {
      allowed: false,
      reason:
        config.messages?.botAdminOnly || "🤖 Bot harus menjadi admin grup!",
    };
  }

  return { allowed: true, reason: "" };
}

/**
 * Cek mode bot dengan validasi kuat
 * @param {Object} m - Serialized message
 * @returns {boolean} True jika boleh diproses
 */
function checkMode(m) {
  const db = getDatabase();
  const realConfig = require("../config");
  const dbMode = db.setting("botMode");
  const mode = dbMode || realConfig.config.mode || "public";

  const onlyGc = db.setting("onlyGc");
  const onlyPc = db.setting("onlyPc");
  const selfAdmin = db.setting("selfAdmin");
  const publicAdmin = db.setting("publicAdmin");
  const botAfk = db.setting("botAfk");

  if (botAfk && botAfk.active) {
    if (m.fromMe || m.isOwner) {
      return { allowed: true };
    }
    const duration = formatAfkDuration(Date.now() - botAfk.since);
    return {
      allowed: false,
      isAfk: true,
      afkMessage:
        `💤 *ʙᴏᴛ sᴇᴅᴀɴɢ ᴀꜰᴋ*\n\n` +
        `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
        `┃ 📝 ᴀʟᴀsᴀɴ: \`${botAfk.reason || "AFK"}\`\n` +
        `┃ ⏱️ sᴇᴊᴀᴋ: \`${duration}\` yang lalu\n` +
        `╰┈┈⬡\n\n` +
        `> Bot tidak bisa menerima perintah saat ini\n` +
        `> Mohon tunggu sampai owner mengaktifkan kembali`,
    };
  }

  if (onlyGc && !m.isGroup && !m.isOwner) {
    return { allowed: false };
  }

  if (onlyPc && m.isGroup && !m.isOwner) {
    return { allowed: false };
  }

  if (mode === "self") {
    if (m.fromMe) return { allowed: true };
    if (m.isOwner) return { allowed: true };

    const activeJadibots = getActiveJadibots();
    if (activeJadibots.length > 0) {
      let jadibotList = "";
      activeJadibots.forEach((jb, i) => {
        jadibotList += `┃ ${i + 1}. @${jb.id}\n`;
      });

      const mentions = activeJadibots.map((jb) => jb.id + "@s.whatsapp.net");

      return {
        allowed: false,
        hasJadibots: true,
        jadibotMessage:
          `🤖 *ᴍᴏᴅᴇ ᴘʀɪᴠᴀᴛᴇ*\n\n` +
          `Bot utama sedang dalam mode private.\n` +
          `Kamu bisa menggunakan bot turunan kami:\n\n` +
          `╭┈┈⬡「 📱 *ʙᴏᴛ ᴛᴇʀsᴇᴅɪᴀ* 」\n` +
          `${jadibotList}` +
          `╰┈┈⬡\n\n` +
          `> Pilih salah satu bot di atas untuk akses fitur.`,
        jadibotMentions: mentions,
      };
    }

    return { allowed: false };
  }

  if (mode === "public") {
    if (selfAdmin) {
      if (m.fromMe || m.isOwner) return { allowed: true };
      if (m.isGroup && m.isAdmin) return { allowed: true };
      return { allowed: false };
    }

    if (publicAdmin) {
      if (m.fromMe || m.isOwner) return { allowed: true };
      if (!m.isGroup) return { allowed: true };
      if (m.isGroup && m.isAdmin) return { allowed: true };
      return { allowed: false };
    }

    return { allowed: true };
  }

  return { allowed: true };
}

function formatAfkDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari ${hours % 24} jam`;
  if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
  if (minutes > 0) return `${minutes} menit`;
  return `${seconds} detik`;
}

/**
 * Handler utama untuk memproses pesan
 * @param {Object} msg - Raw message dari Baileys
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 * @example
 * sock.ev.on('messages.upsert', async ({ messages }) => {
 *   await messageHandler(messages[0], sock);
 * });
 */
async function messageHandler(msg, sock, options = {}) {
  const isJadibot = options.isJadibot || false;
  try {
    const m = await serialize(sock, msg);

    if (!m) return;
    if (!m.message) return;

    if (m.message?.stickerPackMessage && sock.saveStickerPack) {
      try {
        const packMsg = m.message.stickerPackMessage;
        const packId = packMsg.stickerPackId || m.id;
        const packName = packMsg.name || "Unknown Pack";
        sock.saveStickerPack(packId, { stickerPackMessage: packMsg }, packName);
      } catch (e) {}
    }

    const db = getDatabase();
    if (!db?.ready) {
      return;
    }

    const jadibotId = options.jadibotId || null;
    if (isJadibot && jadibotId) {
      m.isOwner =
        isJadibotOwner(jadibotId, m.sender) ||
        m.sender === sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
      m.isPremium = isJadibotPremium(jadibotId, m.sender) || m.isOwner;
    }

    if (m.isGroup && m.isBotAdmin && !m.isAdmin && !m.isOwner && !m.isPartner && isMuted) {
      try {
        const isMutedResult = isMuted(m.chat, m.sender, db);
        if (isMutedResult) {
          await sock.sendMessage(m.chat, { delete: m.key });
          return;
        }
      } catch (e) {}
    }

    if (config.features?.logMessage) {
      let groupName = "PRIVATE";
      if (m.isGroup) {
        const groupData = db.getGroup(m.chat);
        groupName = groupData?.name || "Unknown Group";
        if (groupName === "Unknown Group" || groupName === "Unknown") {
          sock
            .groupMetadata(m.chat)
            .then((meta) => {
              if (meta?.subject) db.setGroup(m.chat, { name: meta.subject });
            })
            .catch(() => {});
        }
      }

      if (!isJadibot) {
        logMessage({
          chatType: m.isGroup ? "group" : "private",
          groupName: groupName,
          pushName: m.pushName,
          sender: m.sender,
          message: m.body,
        });
      }
    }

    const modeCheck = checkMode(m);
    if (!modeCheck.allowed) {
      if (modeCheck.isAfk && m.isCommand) {
        await m.reply(modeCheck.afkMessage);
      } else if (modeCheck.hasJadibots && m.isCommand && !isJadibot) {
        await sock.sendMessage(
          m.chat,
          {
            text: modeCheck.jadibotMessage,
            contextInfo: {
              mentionedJid: modeCheck.jadibotMentions,
              externalAdReply: {
                title: `A C C E S  D E N I E D`,
                body: null,
                thumbnailUrl:
                  "https://cdn.gimita.id/download/unnamed%20(8)_1769331052275_d19c28da.jpg",
                sourceUrl: null,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          },
          { quoted: m },
        );
      }
      return;
    }

    if (m.isBanned) {
      logger.warn("Banned user", m.sender);
      return;
    }

    if (m.isGroup && m.isCommand && !m.isOwner) {
      const groupData = db.getGroup(m.chat) || {};
      if (groupData.isBanned) {
        // kalau mau nambih text juga boleh bang, pake m.reply atau sendMessage
        return null;
      }
    }

    const botId = sock.user?.id?.split(":")[0] || "unknown";
    const msgKey = `${botId}_${m.chat}_${m.sender}_${m.id}`;
    if (debounceMessage(msgKey)) {
      return;
    }

    if (config.features?.autoRead) {
      sock.readMessages([m.key]).catch(() => {});
    }
    if (!m.pushName || m.pushName === "Unknown" || m.pushName.trim() === "") {
      if (!m.isCommand && !m.isBot && !m.fromMe) {
        return;
      }
      m.pushName = m.sender?.split("@")[0] || "User";
    }

    db.setUser(m.sender, {
      name: m.pushName,
      lastSeen: new Date().toISOString(),
    });

    if (m.isGroup && incrementChatCount) {
      try {
        incrementChatCount(m.chat, m.sender, db);
      } catch (e) {}
    }

    const cmdVnEnabled = db.setting('cmdVn') || false;
    if (
      cmdVnEnabled &&
      m.type === 'audioMessage' &&
      !m.isCommand &&
      config.APIkey?.groq
    ) {
      try {
        const audioMsg = m.message?.audioMessage;
        const maxSize = 500 * 1024;
        if (audioMsg && (!audioMsg.fileLength || audioMsg.fileLength <= maxSize)) {
          const fs = require('fs');
          const path = require('path');
          const { exec } = require('child_process');
          const axios = require('axios');
          const FormData = require('form-data');

          const buffer = await m.download();
          if (buffer && buffer.length > 1000) {
            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const inputFile = path.join(tmpDir, `vncmd_${Date.now()}.ogg`);
            const wavFile = path.join(tmpDir, `vncmd_${Date.now()}.wav`);

            fs.writeFileSync(inputFile, buffer);

            await new Promise((resolve, reject) => {
              exec(
                `ffmpeg -y -i "${inputFile}" -ar 16000 -ac 1 -f wav "${wavFile}"`,
                { timeout: 15000 },
                (err) => err ? reject(err) : resolve()
              );
            });

            const wavBuffer = fs.readFileSync(wavFile);
            const form = new FormData();
            form.append('file', wavBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
            form.append('model', 'whisper-large-v3');
            form.append('language', 'id');
            form.append('response_format', 'json');

            const { data } = await axios.post(
              'https://api.groq.com/openai/v1/audio/transcriptions',
              form,
              {
                headers: {
                  ...form.getHeaders(),
                  'Authorization': `Bearer ${config.APIkey.groq}`
                },
                timeout: 30000,
                maxContentLength: Infinity
              }
            );

            [inputFile, wavFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });

            const transcript = (data.text || '').trim().toLowerCase()
              .replace(/[.,!?;:'"]/g, '').trim();

            if (transcript) {
              const words = transcript.split(/\s+/);
              const rawWord = words[0];
              const prefix = config.command?.prefix || '.';

              const allPlugins = getAllPlugins();
              const allNames = [];
              for (const p of allPlugins) {
                if (p.config?.name && typeof p.config.name === 'string') allNames.push(p.config.name.toLowerCase());
                if (Array.isArray(p.config?.alias)) {
                  for (const a of p.config.alias) {
                    if (a && typeof a === 'string') allNames.push(a.toLowerCase());
                  }
                }
              }

              let bestMatch = null;
              let bestScore = Infinity;

              for (const cmd of allNames) {
                if (cmd === rawWord) { bestMatch = cmd; bestScore = 0; break; }
                if (rawWord.startsWith(cmd) && cmd.length >= 3) {
                  const score = rawWord.length - cmd.length;
                  if (score < bestScore) { bestScore = score; bestMatch = cmd; }
                }
                const dist = levenshtein(rawWord, cmd);
                if (dist <= 3 && dist < bestScore) {
                  bestScore = dist;
                  bestMatch = cmd;
                }
              }

              if (bestMatch) {
                const commandArgs = words.slice(1).join(' ');
                m.body = `${prefix}${bestMatch}${commandArgs ? ' ' + commandArgs : ''}`;
                const { parseCommand } = require('./lib/serialize');
                const parsed = parseCommand(m.body, prefix);
                m.isCommand = parsed.isCommand;
                m.command = parsed.command;
                m.args = parsed.args;
                m.prefix = parsed.prefix;
                m.isVnCommand = true;
              }
            }
          }
        }
      } catch (e) {
        console.error('[CMD VN] Error:', e.message);
      }
    }

    if (checkAfk) {
      checkAfk(m, sock).catch(() => {});
    }

    if (m.isGroup) {
      cacheMessageForAntiRemove(m, sock, db);

      const antilinkTriggered = await handleAntilink(m, sock, db);
      if (antilinkTriggered) return;

      const antilinkGcTriggered = await handleAntilinkGc(m, sock, db);
      if (antilinkGcTriggered) return;

      const antilinkAllTriggered = await handleAntilinkAll(m, sock, db);
      if (antilinkAllTriggered) return;

      const antiHidetagTriggered = await handleAntiHidetag(m, sock, db);
      if (antiHidetagTriggered) return;

      const groupData = db.getGroup(m.chat) || {};
      if (
        groupData.autoforward &&
        !m.isCommand &&
        !m.fromMe &&
        !m.key?.fromMe &&
        m.message
      ) {
        try {
          const mtype = Object.keys(m.message || {})[0];
          if (
            mtype &&
            !mtype.includes("protocolMessage") &&
            !mtype.includes("senderKeyDistribution")
          ) {
            await sock
              .sendMessage(
                m.chat,
                {
                  forward: m,
                  contextInfo: {
                    isForwarded: true,
                    forwardingScore: 1,
                  },
                },
                { quoted: m },
              )
              .catch(() => {});
          }
        } catch (e) {}
      }
      
      if (checkAntidocument) {
          const isAntidocument = await checkAntidocument(m, sock, db);
          if (isAntidocument) return;
      }
      
      if (detectBot && !m.isOwner && !m.isAdmin) {
        try {
          const botDetected = await detectBot(m, sock);
          if (botDetected) {
            if (config.dev?.debugLog)
              logger.info("AntiBot", `Bot detected and kicked: ${m.sender}`);
            return;
          }
        } catch (e) {
          if (config.dev?.debugLog) logger.error("AntiBot", e.message);
        }
      }

      if (handleAutoDownload && m.body) {
        handleAutoDownload(m, sock, m.body).catch((e) => {
          if (config.dev?.debugLog) logger.error("AutoDL", e.message);
        });
      }
      if (isMuted && m.isBotAdmin && !m.isAdmin && !m.isOwner) {
        try {
          const isMutedResult = isMuted(m.chat, m.sender, db);
          if (isMutedResult) {
            await sock.sendMessage(m.chat, { delete: m.key });
            return;
          }
        } catch (e) {}
      }

      if (checkSpam && handleSpamAction && !m.isAdmin) {
        try {
          const isSpam = await checkSpam(m, sock, db);
          if (isSpam) {
            const delayKey = `${m.chat}_${m.sender}`;
            spamDelayTracker.set(delayKey, Date.now());

            await handleSpamAction(m, sock, db);
          }
        } catch (e) {
          console.error("[AntiSpam] Error:", e.message);
        }
      }

      if (checkSlowmode && !m.isAdmin && !m.isCommand) {
        try {
          const remaining = checkSlowmode(m, sock, db);
          if (remaining) {
            await sock.sendMessage(m.chat, { delete: m.key });
            return;
          }
        } catch (e) {}
      }
    }

    if (addXp && m.body) {
      try {
        const oldXp = db.getUser(m.sender)?.xp || 0;
        const newXp = addXp(m.sender, db, 5);
        if (checkLevelUp) {
          const result = checkLevelUp(oldXp, newXp);
          if (result.leveled) {
            await sock.sendMessage(m.chat, {
              text:
                `🎉 *ʟᴇᴠᴇʟ ᴜᴘ!*\n\n` +
                `> @${m.sender.split("@")[0]} naik ke level *${result.newLevel}*!\n` +
                `> Title: *${result.title}*`,
              mentions: [m.sender],
            });
          }
        }
      } catch (e) {}
    }

    if (m.isGroup && isToxic && handleToxicMessage) {
      try {
        const groupData = db.getGroup(m.chat) || {};
        if (groupData.antitoxic && !m.isAdmin && !m.isOwner) {
          const toxicWords = groupData.toxicWords || [];
          const result = isToxic(m.body, toxicWords);
          if (result.toxic) {
            await handleToxicMessage(m, sock, db, result.word);
            return;
          }
        }
      } catch (e) {}
    }

    if (handleAutoAI && m.isGroup) {
      try {
        const aiHandled = await handleAutoAI(m, sock);
        if (aiHandled) return;
      } catch (e) {}
    }

    if (m.body?.startsWith(">>") && m.isOwner) {
      const code = m.body.slice(2).trim();
      if (!code) return;
      
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        
        const execCode = new AsyncFunction(
          "m", "sock", "db", "config", "require", "console",
          `
          const axios = require('axios');
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          const { promisify } = require('util');
          const exec = promisify(require('child_process').exec);
          
          ${code}
          `
        );
        
        const result = await execCode(m, sock, db, config, require, console);
        
        if (result !== undefined && result !== null) {
          const output = typeof result === 'object' 
            ? JSON.stringify(result, null, 2) 
            : String(result);
          
          if (output.length > 0) {
            await m.reply(`✅ *ᴇxᴇᴄ ʀᴇsᴜʟᴛ*\n\n\`\`\`\n${output.substring(0, 4000)}\n\`\`\``);
          }
        }
      } catch (execError) {
        await m.reply(`❌ *ᴇxᴇᴄ ᴇʀʀᴏʀ*\n\n\`\`\`\n${execError.message}\n\nStack:\n${execError.stack?.substring(0, 1000) || 'N/A'}\n\`\`\``);
      }
      return;
    }

    if (!m.isCommand) {
      if (checkStickerCommand && m.message?.stickerMessage) {
        try {
          const stickerCmd = checkStickerCommand(m);
          if (stickerCmd) {
            m.isCommand = true;
            m.command = stickerCmd;
            m.prefix = ".";
            m.text = stickerCmd;
            m.args = [];
          }
        } catch (e) {}
      }

      if (!m.isCommand) {
        const gameHandled = await handleGameAnswer(m, sock);
        if (gameHandled) return;

        const smartHandled = await handleSmartTriggers(m, sock, db);
        if (smartHandled) return;

        if (m.quoted?.id && global.ytdlSessions?.has(m.quoted.id)) {
          try {
            const ytmp4Plugin = require("../plugins/download/ytmp4");
            if (ytmp4Plugin.handleReply) {
              const handled = await ytmp4Plugin.handleReply(m, { sock });
              if (handled) return;
            }
          } catch (e) {}
        }

        if (m.quoted?.id && global.confessData?.has(m.quoted.id)) {
          try {
            const confessPlugin = require("../plugins/fun/confess");
            if (confessPlugin.replyHandler) {
              const handled = await confessPlugin.replyHandler(m, { sock });
              if (handled) return;
            }
          } catch (e) {}
        }

        try {
          const tttPlugin = require("../plugins/game/tictactoe");
          if (tttPlugin.answerHandler) {
            const handled = await tttPlugin.answerHandler(m, sock);
            if (handled) return;
          }
        } catch (e) {}

        try {
          const suitPlugin = require("../plugins/game/suitpvp");
          if (suitPlugin.answerHandler) {
            const handled = await suitPlugin.answerHandler(m, sock);
            if (handled) return;
          }
        } catch (e) {}

        try {
          const utPlugin = require("../plugins/game/ulartangga");
          if (utPlugin.answerHandler) {
            const handled = await utPlugin.answerHandler(m, sock);
            if (handled) return;
          }
        } catch (e) {}

        if (hasActiveSession(m.chat)) {
          await handleGameAnswer(m, sock);
        }

        if (autoStickerHandler && m.isGroup) {
          autoStickerHandler(m, sock).catch(() => {});
        }

        if (autoMediaHandler && m.isGroup) {
          autoMediaHandler(m, sock).catch(() => {});
        }

        if (checkAntisticker && m.isGroup) {
          const stickerHandled = await checkAntisticker(m, sock, db);
          if (stickerHandled) return;
        }

        if (checkAntimedia && m.isGroup) {
          const mediaHandled = await checkAntimedia(m, sock, db);
          if (mediaHandled) return;
        }

        return;
      }
    }

    const delayKey = `${m.chat}_${m.sender}`;
    const lastSpamDetect = spamDelayTracker.get(delayKey);
    if (lastSpamDetect) {
      const elapsed = Date.now() - lastSpamDetect;
      if (elapsed < 60000) {
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        spamDelayTracker.delete(delayKey);
      }
    }

    const spamKey = `${botId}_${m.sender}`;
    if (await isSpamming(spamKey)) {
      return;
    }

    const storeData = db.setting("storeList") || {};
    const storeCommand = storeData[m.command.toLowerCase()];

    if (m.isGroup) {
      const groupData = db.getGroup(m.chat) || {};
      const botMode = groupData.botMode || "md";

      if (botMode === "store" && storeCommand) {
        storeData[m.command.toLowerCase()].views =
          (storeCommand.views || 0) + 1;
        db.setting("storeList", storeData);

        const caption =
          `📦 *${m.command.toUpperCase()}*\n\n` +
          `${storeCommand.content}\n\n` +
          `───────────────\n` +
          `> 👁️ Views: ${storeData[m.command.toLowerCase()].views}\n` +
          `> 💳 Ketik \`${m.prefix}payment\` untuk bayar`;

        if (storeCommand.hasImage && storeCommand.imagePath) {
          const fs = require("fs");
          if (fs.existsSync(storeCommand.imagePath)) {
            const imageBuffer = fs.readFileSync(storeCommand.imagePath);
            await sock.sendMessage(
              m.chat,
              {
                image: imageBuffer,
                caption: caption,
              },
              { quoted: m },
            );
            return;
          }
        }

        await m.reply(caption);
        return;
      }
    }

    try {
      const caseResult = await handleCaseCommand(m, sock);
      if (caseResult && caseResult.handled) {
        if (config.dev?.debugLog) {
          logger.success('Case', `Handled: ${m.command}`);
        }
        return;
      }
    } catch (caseError) {
      logger.error('Case System', caseError.message);
      if (config.dev?.debugLog) {
        console.error('[CaseSystem] Stack:', caseError.stack);
      }
    }

    let plugin = getPlugin(m.command);

    if (!plugin) {
      if (storeCommand) {
        storeData[m.command.toLowerCase()].views =
          (storeCommand.views || 0) + 1;
        db.setting("storeList", storeData);

        const caption =
          `📦 *${m.command.toUpperCase()}*\n\n` +
          `${storeCommand.content}\n\n` +
          `───────────────\n` +
          `> 👁️ Views: ${storeData[m.command.toLowerCase()].views}\n` +
          `> 💳 Ketik \`${m.prefix}payment\` untuk bayar`;

        if (storeCommand.hasImage && storeCommand.imagePath) {
          const fs = require("fs");
          if (fs.existsSync(storeCommand.imagePath)) {
            const imageBuffer = fs.readFileSync(storeCommand.imagePath);
            await sock.sendMessage(
              m.chat,
              {
                image: imageBuffer,
                caption: caption,
              },
              { quoted: m },
            );
            return;
          }
        }

        await m.reply(caption);
        return;
      }

      const allCommands = [];
      const plugins = getAllPlugins();

      for (const p of plugins) {
        if (p.config.isEnabled) {
          const names = Array.isArray(p.config.name)
            ? p.config.name
            : [p.config.name];
          allCommands.push(...names);

          if (p.config.alias) {
            const aliases = Array.isArray(p.config.alias)
              ? p.config.alias
              : [p.config.alias];
            allCommands.push(...aliases);
          }
        }
      }

      const storeCommands = Object.keys(storeData);
      allCommands.push(...storeCommands);
      
      const similarityEnabled = db.setting('similarity') !== false
      
      if (similarityEnabled) {
          const suggestions = findSimilarCommands(m.command, allCommands, {
            maxResults: 1,
            minSimilarity: 0.6,
            maxDistance: 3,
          });
    
          if (suggestions.length > 0) {
            const message = formatSuggestionMessage(
              m.command,
              suggestions,
              m.prefix,
              m
            );
            await sock.sendMessage(
              m.chat,
              {
                interactiveMessage: { 
                  title: message.message,
                  footer: `Mungkin maksud kamu adalah command ini`,
                  document: fs.readFileSync('./assets/images/ourin.jpg'),
                  mimetype: 'application/pdf',
                  fileName: 'Did you mean',
                  fileLength: 999999999999,
                  contextInfo: {
                    isForwarded: true,
                    forwardingScore: 777,
                    forwardedNewsletterMessageInfo: {
                      newsletterJid: config.saluran?.id,
                      newsletterName: config.saluran?.name,
                    },
                  },
                  externalAdReply: {
                    title: "Command " + m.command ? m.command + " Tidak Ditemukan" : "Tidak Ditemukan",
                    body: 'Need Help? type: ' + m.prefix + 'menu',
                    thumbnailUrl: 'https://cdn.gimita.id/download/3a48a5a23251c8849f9a38a861392849_1771038665065_a85b23f6.jpg',
                    sourceUrl: null,
                    mediaType: 1,
                    renderLargerThumbnail: false
                  },
                  buttons: message.interactiveButtons
                }
              },
              { quoted: m },
            );
          }
      }

      return;
    }

    if (!plugin.config.isEnabled) {
      return;
    }

    if (m.isGroup) {
      const groupData = db.getGroup(m.chat) || {};
      let botMode = groupData.botMode || "md";
      const pluginCategory = plugin.config.category?.toLowerCase();
      const baseAllowed = ["main", "group", "sticker", "owner"];

      if (isJadibot) {
        botMode = "md";

        const jadibotBlockedCategories = [
          "owner",
          "sewa",
          "panel",
          "store",
          "pushkontak",
        ];
        const jadibotBlockedCommands = [
          "sewa",
          "sewabot",
          "sewalist",
          "listsewa",
          "addsewa",
          "delsewa",
          "extendsewa",
          "checksewa",
          "sewainfo",
          "sewagroup",
          "stopsewa",
          "jadibot",
          "stopjadibot",
          "listjadibot",
          "addowner",
          "delowner",
          "ownerlist",
          "listowner",
          "self",
          "public",
          "botmode",
          "restart",
          "shutdown",
        ];

        if (
          jadibotBlockedCategories.includes(pluginCategory) ||
          jadibotBlockedCommands.includes(m.command.toLowerCase())
        ) {
          return m.reply(
            `⚠️ *ᴀᴋsᴇs ᴛᴇʀʙᴀᴛᴀs*\n\n` +
              `Fitur ini hanya tersedia di bot utama.\n` +
              `Jadibot tidak dapat mengakses fitur ini.\n\n` +
              `> Hubungi owner bot utama untuk informasi lebih lanjut.`,
          );
        }
      }

      const modeConfig = {
        md: {
          allowed: null,
          excluded: ["pushkontak", "store", "panel", "otp"],
          name: "Multi Device",
        },
        cpanel: { allowed: [...baseAllowed, "tools", "panel"], name: "CPanel" },
        pushkontak: {
          allowed: [...baseAllowed, "pushkontak"],
          name: "Push Kontak",
        },
        store: { allowed: [...baseAllowed, "store"], name: "Store" },
        otp: { allowed: [...baseAllowed, "otp"], name: "OTP" },
      };

      const categoryModeMap = {
        download: "md",
        search: "md",
        ai: "md",
        fun: "md",
        game: "md",
        media: "md",
        utility: "md",
        tools: "md",
        ephoto: "md",
        religi: "md",
        info: "md",
        panel: "cpanel",
        pushkontak: "pushkontak",
        store: "store",
        otp: "otp",
        jpm: "md",
      };

      const currentConfig = modeConfig[botMode] || modeConfig.md;

      if (
        m.command !== "botmode" &&
        m.command !== "menu" &&
        m.command !== "menucat"
      ) {
        let isBlocked = false;

        if (
          currentConfig.allowed &&
          !currentConfig.allowed.includes(pluginCategory)
        ) {
          isBlocked = true;
        }
        if (
          currentConfig.excluded &&
          currentConfig.excluded.includes(pluginCategory)
        ) {
          isBlocked = true;
        }

        if (isBlocked) {
          const suggestedMode = categoryModeMap[pluginCategory] || "md";
          const suggestedModeName =
            modeConfig[suggestedMode]?.name || "Multi Device";

          await m.reply(
            `🔒 *ᴄᴏᴍᴍᴀɴᴅ ᴛɪᴅᴀᴋ ᴛᴇʀsᴇᴅɪᴀ*\n\n` +
              `> Bot sedang dalam mode *${currentConfig.name}*\n` +
              `> Command \`${m.prefix}${m.command}\` tersedia di mode *${suggestedModeName}*\n\n` +
              `💡 Hubungi admin grup untuk mengganti mode:\n` +
              `\`${m.prefix}botmode ${suggestedMode}\``,
          );
          return;
        }
      }
    }

    const permission = checkPermission(m, plugin.config);
    if (!permission.allowed) {
      await m.reply(permission.reason);
      return;
    }

    const registrationRequired =
      db.setting("registrationRequired") ??
      config.registration?.enabled ??
      false;
    if (registrationRequired && !plugin.config.skipRegistration) {
      const user = db.getUser(m.sender);
      if (!m.isOwner && !m.isPartner && !m.isPremium && !user?.isRegistered) {
        await m.reply(
          `📝 *ᴡᴀᴊɪʙ ᴅᴀꜰᴛᴀʀ*\n\n` +
            `Kamu harus daftar terlebih dahulu!\n\n` +
            `> Ketik: \`${m.prefix}daftar <nama>\`\n\n` +
            `*Contoh:* \`${m.prefix}daftar ${m.pushName || "NamaKamu"}\``,
        );
        return;
      }
    }

    const user = db.getUser(m.sender);

    if (!m.isOwner && !m.isPartner && plugin.config.cooldown > 0) {
      const cooldownRemaining = db.checkCooldown(
        m.sender,
        m.command,
        plugin.config.cooldown,
      );
      if (cooldownRemaining) {
        const cooldownMsg = (
          config.messages?.cooldown || "⏱️ Tunggu %time% detik"
        ).replace("%time%", cooldownRemaining);
        await m.reply(cooldownMsg);
        return;
      }
    }

    if (plugin.config.energi > 0) {
      const ownerEnergi = config.energi?.owner ?? -1;
      const premiumEnergi = config.energi?.premium ?? 100;

      if ((m.isOwner || m.isPartner) && ownerEnergi === -1) {
      } else if (m.isOwner || m.isPartner) {
        const currentEnergi = user?.energi || ownerEnergi;
        if (currentEnergi < plugin.config.energi) {
          await m.reply(config.messages?.energiExceeded || "⚡ Energi habis!");
          return;
        }
        db.updateEnergi(m.sender, -plugin.config.energi);
      } else if (m.isPremium) {
        const currentEnergi = user?.energi || premiumEnergi;
        if (currentEnergi < plugin.config.energi) {
          await m.reply(config.messages?.energiExceeded || "⚡ Energi habis!");
          return;
        }
        db.updateEnergi(m.sender, -plugin.config.energi);
      } else {
        const currentEnergi = user?.energi || 0;
        if (currentEnergi < plugin.config.energi) {
          await m.reply(config.messages?.energiExceeded || "⚡ Energi habis!");
          return;
        }
        db.updateEnergi(m.sender, -plugin.config.energi);
      }
    }

    if (config.features?.autoTyping) {
      await sock.sendPresenceUpdate("composing", m.chat);
    }

    const context = {
      sock,
      m,
      config,
      db,
      uptime: getUptime(),
      plugins: {
        count: getPluginCount(),
      },
      jadibotId: jadibotId,
      isJadibot: isJadibot,
    };

    // Log command execution with box style
    const chatType = m.isGroup ? "group" : "private";
    if (!isJadibot) {
      logCommand(`${m.prefix}${m.command}`, m.pushName, chatType);
    }

    await plugin.handler(m, context);

    if (!m.isOwner && !m.isPartner && plugin.config.cooldown > 0) {
      db.setCooldown(m.sender, m.command, plugin.config.cooldown);
    }

    db.incrementStat("commandsExecuted");
    db.incrementStat(`command_${m.command}`);

    if (config.features?.autoTyping) {
      await sock.sendPresenceUpdate("paused", m.chat);
    }
  } catch (error) {
    logger.error("Handler", error.message);

    try {
      const m = await serialize(sock, msg);
      if (m) {
        await m.reply(
          createErrorMessage("Terjadi kesalahan saat memproses command!"),
        );
      }
    } catch {
      logger.error("Failed to send error message");
    }
  }
}

/**
 * Handler untuk update group participants
 * @param {Object} update - Update data
 * @param {Object} sock - Socket connection
 * @returns {Promise<void>}
 */
async function groupHandler(update, sock) {
  try {
    if (global.sewaLeaving) return;

    const { id: groupJid, participants, action } = update;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return;
    }

    const db = getDatabase();

    let groupData = db.getGroup(groupJid);
    if (!groupData) {
      db.setGroup(groupJid, {
        welcome: config.welcome?.defaultEnabled ?? true,
        goodbye: config.goodbye?.defaultEnabled ?? true,
        leave: config.goodbye?.defaultEnabled ?? true,
      });
      groupData = db.getGroup(groupJid);
    }

    let groupMeta;
    try {
      groupMeta = await sock.groupMetadata(groupJid);

      if (groupMeta?.participants) {
        cacheParticipantLids(groupMeta.participants);
      }
    } catch (e) {
      if (
        e.message?.includes("forbidden") ||
        e.message?.includes("401") ||
        e.message?.includes("403")
      ) {
        return;
      }
      throw e;
    }

    let sendWelcomeMessage, sendGoodbyeMessage;
    try {
      sendWelcomeMessage =
        require("../plugins/group/welcome").sendWelcomeMessage;
      sendGoodbyeMessage =
        require("../plugins/group/goodbye").sendGoodbyeMessage;
    } catch (e) {}

    for (let participant of participants) {
      let participantJid;
      
      if (typeof participant === 'object' && participant !== null) {
        participantJid = participant.jid || participant.id || participant.lid || '';
      } else {
        participantJid = participant;
      }
      
      if (!participantJid || typeof participantJid !== 'string') continue;
      
      if (isLid(participantJid) || isLidConverted(participantJid)) {
        const found = groupMeta.participants?.find(
          (p) =>
            p.id === participantJid ||
            p.lid === participantJid ||
            p.lid === participantJid.replace("@s.whatsapp.net", "@lid"),
        );
        if (found) {
          participantJid =
            found.jid &&
            !found.jid.endsWith("@lid") &&
            !isLidConverted(found.jid)
              ? found.jid
              : found.id &&
                  !found.id.endsWith("@lid") &&
                  !isLidConverted(found.id)
                ? found.id
                : lidToJid(participantJid);
        } else {
          participantJid = lidToJid(participantJid);
        }
      }
      
      participant = participantJid;

      if (action === "add" && sendWelcomeMessage) {
        await sendWelcomeMessage(sock, groupJid, participant, groupMeta);
      }

      if (action === "remove" && sendGoodbyeMessage) {
        await sendGoodbyeMessage(sock, groupJid, participant, groupMeta);
      }

      const saluranId = config.saluran?.id || "120363208449943317@newsletter";
      const saluranName =
        config.saluran?.name || config.bot?.name || "Ourin-AI";

      let groupPpUrl = "https://files.catbox.moe/w4e75f.jpg";
      try {
        groupPpUrl =
          (await sock.profilePictureUrl(groupJid, "image")) || groupPpUrl;
      } catch (e) {}

      if (action === "promote" && groupData.notifPromote === true) {
        const author = update.author || null;
        let promotedBy = "";
        if (author) {
          try {
            const authorName = await sock.getName(author);
            promotedBy = authorName || author.split("@")[0];
          } catch {
            promotedBy = author.split("@")[0];
          }
        }

        await sock.sendMessage(groupJid, {
          image: fs.readFileSync('./assets/images/ourin-promote.jpg'),
          caption:
            `╭━━━━━━━━━━━━━━━━━╮\n` +
            `┃  👑 *ᴘʀᴏᴍᴏᴛᴇ*\n` +
            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
            `┃ 👤 User: @${participant.split("@")[0]}\n` +
            `┃ ⚡ Status: *Admin Baru*\n` +
            (author ? `┃ 🔧 Oleh: @${author.split("@")[0]}\n\n` : "\n") +
            `> 🎉 _Selamat atas jabatan barunya!_`,
          mentions: author ? [participant, author] : [participant],
          contextInfo: {
            mentionedJid: author ? [participant, author] : [participant],
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: saluranId,
              newsletterName: saluranName,
              serverMessageId: 127,
            },
            externalAdReply: {
              showAdAttribution: false,
              title: "👑 PROMOTE",
              body: `${participant.split("@")[0]} menjadi Admin`,
              thumbnailUrl: groupPpUrl,
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "",
            },
          },
        });
      }

      if (action === "demote" && groupData.notifDemote === true) {
        const author = update.author || null;

        await sock.sendMessage(groupJid, {
          image: fs.readFileSync('./assets/images/ourin-demote.jpg'),
          caption:
            `╭━━━━━━━━━━━━━━━━━╮\n` +
            `┃  📉 *ᴅᴇᴍᴏᴛᴇ*\n` +
            `╰━━━━━━━━━━━━━━━━━╯\n\n` +
            `┃ 👤 User: @${participant.split("@")[0]}\n` +
            `┃ ⚡ Status: *Bukan Admin*\n` +
            (author ? `┃ 🔧 Oleh: @${author.split("@")[0]}\n\n` : "\n") +
            `> 🙏 _Terima kasih atas kontribusinya!_`,
          mentions: author ? [participant, author] : [participant],
          contextInfo: {
            mentionedJid: author ? [participant, author] : [participant],
            forwardingScore: 777,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: saluranId,
              newsletterName: saluranName,
              serverMessageId: 127,
            },
            externalAdReply: {
              showAdAttribution: false,
              title: "📉 DEMOTE",
              body: `${participant.split("@")[0]} bukan Admin lagi`,
              thumbnailUrl: groupPpUrl,
              mediaType: 1,
              renderLargerThumbnail: false,
              sourceUrl: "",
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("[GroupHandler] Error:", error.message);
  }
}

async function messageUpdateHandler(updates, sock) {
  const db = getDatabase();

  for (const update of updates) {
    try {
      await handleAntiRemove(update, sock, db);
    } catch (error) {
      continue;
    }
    try {
        if (update.update?.message) {
            const msg = update.update.message
            if (msg.protocolMessage) continue
            const newMsg = {
                key: update.key,
                message: msg,
                messageTimestamp: update.messageTimestamp || Math.floor(Date.now() / 1000),
                pushName: update.pushName || 'User' 
            }
            await messageHandler(newMsg, sock)
        }
    } catch (error) {
        console.error('[MsgUpdate] Error:', error.message)
    }
  }
}

/**
 * Cache untuk menyimpan state terakhir grup
 * Format: { groupId: { announce: boolean, restrict: boolean, lastUpdate: timestamp } }
 */
const groupSettingsCache = new Map();

/**
 * Debounce cooldown untuk mencegah spam (dalam ms)
 */
const GROUP_SETTINGS_COOLDOWN = 1000;

async function groupSettingsHandler(update, sock) {
  try {
    if (global.sewaLeaving) return;
    if (global.isFetchingGroups) return;

    const groupId = update.id;
    if (!groupId || !groupId.endsWith("@g.us")) return;

    if (update.announce === undefined && update.restrict === undefined) {
      return;
    }

    const cached = groupSettingsCache.get(groupId) || {};
    const now = Date.now();

    if (
      cached.lastUpdate &&
      now - cached.lastUpdate < GROUP_SETTINGS_COOLDOWN
    ) {
      return;
    }

    let hasRealChange = false;
    if (update.announce !== undefined) {
      if (cached.announce === undefined) {
        cached.announce = update.announce;
      } else if (cached.announce !== update.announce) {
        hasRealChange = true;

        const db = getDatabase();
        const groupData = db.getGroup(groupId) || {};

        const saluranId = config.saluran?.id || "120363208449943317@newsletter";
        const saluranName =
          config.saluran?.name || config.bot?.name || "Ourin-AI";

        if (update.announce === true && groupData.notifCloseGroup === true) {
          await sock.sendMessage(groupId, {
            text:
              `╭━━━━━━━━━━━━━━━━━╮\n` +
              `┃  🔒 *ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ*\n` +
              `╰━━━━━━━━━━━━━━━━━╯\n\n` +
              `> Grup sekarang *ditutup*.\n` +
              `> Hanya admin yang bisa\n` +
              `> mengirim pesan.\n\n` +
              `> _Admin dapat membuka dengan_\n` +
              `> _\`.group open\`_`,
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127,
              },
            },
          });
        }

        if (update.announce === false && groupData.notifOpenGroup === true) {
          await sock.sendMessage(groupId, {
            text:
              `╭━━━━━━━━━━━━━━━━━╮\n` +
              `┃  🔓 *ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ*\n` +
              `╰━━━━━━━━━━━━━━━━━╯\n\n` +
              `> Grup sekarang *dibuka*.\n` +
              `> Semua member bisa\n` +
              `> mengirim pesan.\n\n` +
              `> _Selamat berkirim pesan! 💬_`,
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127,
              },
            },
          });
        }

        cached.announce = update.announce;
      }
    }

    if (update.restrict !== undefined) {
      if (cached.restrict === undefined) {
        cached.restrict = update.restrict;
      } else if (cached.restrict !== update.restrict) {
        hasRealChange = true;
        const saluranIdR =
          config.saluran?.id || "120363208449943317@newsletter";
        const saluranNameR =
          config.saluran?.name || config.bot?.name || "Ourin-AI";

        if (update.restrict === true) {
          await sock.sendMessage(groupId, {
            text:
              `╭━━━━━━━━━━━━━━━━━╮\n` +
              `┃  ⚙️ *ɪɴꜰᴏ ɢʀᴜᴘ*\n` +
              `╰━━━━━━━━━━━━━━━━━╯\n\n` +
              `> Info grup sekarang *terbatas*.\n` +
              `> Hanya admin yang bisa\n` +
              `> edit info grup.`,
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranIdR,
                newsletterName: saluranNameR,
                serverMessageId: 127,
              },
            },
          });
        } else {
          await sock.sendMessage(groupId, {
            text:
              `╭━━━━━━━━━━━━━━━━━╮\n` +
              `┃  ⚙️ *ɪɴꜰᴏ ɢʀᴜᴘ*\n` +
              `╰━━━━━━━━━━━━━━━━━╯\n\n` +
              `> Info grup sekarang *terbuka*.\n` +
              `> Semua member bisa\n` +
              `> edit info grup.`,
            contextInfo: {
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranIdR,
                newsletterName: saluranNameR,
                serverMessageId: 127,
              },
            },
          });
        }
        cached.restrict = update.restrict;
      }
    }
    if (hasRealChange) {
      cached.lastUpdate = now;
    }
    if (cached.announce !== undefined || cached.restrict !== undefined) {
      groupSettingsCache.set(groupId, cached);
    }
  } catch (error) {
    console.error("[GroupSettings] Error:", error.message);
  }
}

module.exports = {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
  checkPermission,
  checkMode,
  isSpamming,
};
