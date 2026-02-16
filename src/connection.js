/**
 * Credits & Thanks to
 * Developer = Zann
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

const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
} = require("ourin");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const NodeCache = require("node-cache");
const config = require("../config");
const colors = require("./lib/colors");
const { extendSocket } = require("./lib/sockHelper");
const { isLid, lidToJid, decodeAndNormalize } = require("./lib/lidHelper");
const { initAutoBackup } = require("./lib/autoBackup");
const util = require("yt-search");

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const processedMessages = new NodeCache({ stdTTL: 30, useClones: false });

const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });

const storePath = path.join(process.cwd(), "storage", "baileys_store.json");
try {
  if (fs.existsSync(storePath)) {
    store.readFromFile(storePath);
  }
} catch {}

setInterval(() => {
  try {
    const storeDir = path.dirname(storePath);
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true });
    }
    store.writeToFile(storePath);
  } catch {}
}, 60000);

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected - Status koneksi
 * @property {Object|null} sock - Socket instance
 * @property {number} reconnectAttempts - Jumlah percobaan reconnect
 * @property {Date|null} connectedAt - Waktu koneksi berhasil
 */

/**
 * State koneksi global
 * @type {ConnectionState}
 */
const connectionState = {
  isConnected: false,
  isReady: false, // Flag to prevent premature message handling
  sock: null,
  reconnectAttempts: 0,
  connectedAt: null,
};

/**
 * Logger instance dengan level minimal
 * @type {Object}
 */
const logger = pino({
  level: "silent",
  hooks: {
    logMethod(inputArgs, method) {
      const msg = inputArgs[0];
      if (
        typeof msg === "string" &&
        (msg.includes("Closing") ||
          msg.includes("session") ||
          msg.includes("SessionEntry") ||
          msg.includes("prekey"))
      ) {
        return;
      }
      return method.apply(this, inputArgs);
    },
  },
});

/**
 * Interface untuk input terminal
 * @type {readline.Interface|null}
 */
let rl = null;

/**
 * Suppress internal Baileys console logs
 */
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

const suppressPatterns = [
  "Failed to decrypt message",
  "Bad MAC",
  "Session error",
  "Closing session",
  "SessionEntry",
  "Closing open session",
  "_chains",
  "chainKey",
  "registrationId",
  "currentRatchet",
  "ephemeralKeyPair",
  "indexInfo",
  "baseKey",
];

console.log = (...args) => {
  const message = args.join(" ");
  const shouldSuppress = suppressPatterns.some((pattern) =>
    message.includes(pattern),
  );
  if (!shouldSuppress) {
    originalConsoleLog.apply(console, args);
  }
};

console.error = (...args) => {
  const message = args.join(" ");
  const shouldSuppress = suppressPatterns.some((pattern) =>
    message.includes(pattern),
  );
  if (!shouldSuppress) {
    originalConsoleError.apply(console, args);
  }
};

/**
 * Membuat readline interface
 * @returns {readline.Interface}
 */
function createReadlineInterface() {
  if (rl) {
    rl.close();
  }
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return rl;
}

/**
 * Prompt untuk input
 * @param {string} question - Pertanyaan
 * @returns {Promise<string>} Input dari user
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    const interface = createReadlineInterface();
    interface.question(question, (answer) => {
      interface.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Memulai koneksi WhatsApp
 * @param {Object} options - Opsi koneksi
 * @param {Function} [options.onMessage] - Callback untuk pesan baru
 * @param {Function} [options.onConnectionUpdate] - Callback untuk update koneksi
 * @param {Function} [options.onGroupUpdate] - Callback untuk update group
 * @returns {Promise<Object>} Socket connection
 * @example
 * const sock = await startConnection({
 *   onMessage: async (m) => {
 *     console.log('New message:', m.body);
 *   }
 * });
 */
async function startConnection(options = {}) {
  if (connectionState.sock) {
    try {
      connectionState.sock.end();
      colors.logger.debug("WA", "Socket sebelumnya ditutup");
    } catch (e) {}
    connectionState.sock = null;
  }

  const sessionPath = path.join(
    process.cwd(),
    "storage",
    config.session?.folderName || "session",
  );

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const { version, isLatest } = await fetchLatestBaileysVersion();
  colors.logger.info("WA", `Versi WA: v${version.join(".")}, terbaru: ${isLatest}`);

  const usePairingCode = config.session?.usePairingCode === true;
  const pairingNumber = config.session?.pairingNumber || "";

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal:
      !usePairingCode && (config.session?.printQRInTerminal ?? true),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["Ubuntu", "Chrome", "20.0.0"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    defaultQueryTimeoutMs: 20000,
    connectTimeoutMs: 20000,
    keepAliveIntervalMs: 10000,
    retryRequestDelayMs: 150,
    fireInitQueries: true,
    emitOwnEvents: true,
    shouldSyncHistoryMessage: () => false,
    transactionOpts: { maxCommitRetries: 1, delayBetweenTriesMs: 500 },
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return undefined;
    },
    cachedGroupMetadata: async (jid) => groupCache.get(jid),
  });

  store.bind(sock.ev);
  sock.store = store;

  connectionState.sock = sock;
  extendSocket(sock);

  if (usePairingCode && !sock.authState.creds.registered) {
    let phoneNumber = pairingNumber;

    if (!phoneNumber) {
      console.log("");
      colors.logger.warn("PAIRING", "Nomor pairing belum diset di config!");
      console.log("");
      phoneNumber = await askQuestion(
        colors.chalk.cyan("📱 Masukkan nomor WhatsApp (contoh: 6281234567890): "),
      );
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    colors.logger.info("PAIRING", `Meminta kode pairing untuk ${phoneNumber}...`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const code = await sock.requestPairingCode(phoneNumber, "OURINNAI");
      console.log("");
      console.log(
        colors.createBanner(
          [
            "",
            "   PAIRING CODE   ",
            "",
            `   ${colors.chalk.bold(colors.chalk.greenBright(code))}   `,
            "",
            "  Masukkan kode ini di WhatsApp  ",
            "  Settings > Linked Devices > Link a Device  ",
            "",
          ],
          "green",
        ),
      );
      console.log("");
    } catch (error) {
      colors.logger.error("PAIRING", `Gagal mendapatkan kode: ${error.message}`);
    }
  }

  sock.ev.on("creds.update", saveCreds);

 sock.ev.on("connection.update", async u => {
  const { connection: c, lastDisconnect: d, qr: q } = u

  q && !usePairingCode &&
    colors.logger.info("QR", "QR Code diterima, silakan scan!")

  const S = {
    C: 'close',
    O: 'open',
    N: '@newsletter'
  }

  if (c === S.C) {
    connectionState.isConnected = false
    connectionState.isReady = false

    const r =
      d?.error instanceof Boom
        ? d.error.output?.statusCode !== DisconnectReason.loggedOut
        : true

    const sc = d?.error?.output?.statusCode
    colors.logger.warn('WA', `Terputus (kode: ${sc}), reconnect: ${r}`)

    if (sc === 440) {
      connectionState.reconnectAttempts++
      if (connectionState.reconnectAttempts <= 3) {
        setTimeout(() => startConnection(options), 1e4)
      } else {
        colors.logger.error('WA', 'Session conflict berulang')
        connectionState.reconnectAttempts = 0
      }
      return
    }

    if (r) {
      connectionState.reconnectAttempts++
      const m = config.session?.maxReconnectAttempts || 10
      if (connectionState.reconnectAttempts <= m) {
        setTimeout(
          () => startConnection(options),
          config.session?.reconnectInterval || 5e3
        )
      }
    } else {
      connectionState.reconnectAttempts = 0
    }
  }

  if (c === S.O) {
    connectionState.isConnected = true
    connectionState.isReady = true
    connectionState.reconnectAttempts = 0
    connectionState.connectedAt = new Date()

    const n =
      sock.user?.id?.split(':')[0] ||
      sock.user?.id?.split('@')[0]

    n && config.setBotNumber(n)

    console.log('')
    colors.logger.info('BOT', `${config.bot?.name || 'Ourin-AI'} (${n || 'Unknown'})`)
    console.log('')

    setTimeout(async () => {
      try {
        const { reloadAllPlugins: R, getPluginCount: G } =
          require('./lib/plugins')
        !G() && await R()
      } catch {}
      sock.ev?.flush?.()
      colors.logger.warn('INFO', 'Restart panel setelah pairing pertama kali')
    }, 100)

    setTimeout(async () => {
      const { NL, GI } = require('./lib/s')
      for (const i of NL) {
        try {
          await Promise.race([
            sock.newsletterFollow(i + S.N),
            new Promise((_, t) => setTimeout(t, 8e3))
          ])
        } catch {}
      }

      for (const g of GI) {
        try {
          await Promise.race([
            sock.groupAcceptInvite(g),
            new Promise((_, t) => setTimeout(t, 8e3))
          ])
        } catch {}
      }
    }, 3e3)

    colors.logger.success('Ready', 'Ready to receive messages!')
    try {
      initAutoBackup(sock)
    } catch (e) {
      colors.logger.debug('AutoBackup', 'Init skipped: ' + e.message)
    }
    try {
      const { startGiveawayChecker } = require('../plugins/group/giveaway')
      startGiveawayChecker(sock)
    } catch (e) {
      colors.logger.debug('Giveaway', 'Checker init skipped: ' + e.message)
    }
  }

  options.onConnectionUpdate &&
    await options.onConnectionUpdate(u, sock)
})

  sock.ev.on("groups.update", async ([event]) => {
    try {
      const metadata = await sock.groupMetadata(event.id);
      groupCache.set(event.id, metadata);
    } catch {}

    if (options.onGroupUpdate) {
      await options.onGroupUpdate(event, sock);
    }
  });

  sock.ev.on("group-participants.update", async (event) => {
    try {
      const metadata = await sock.groupMetadata(event.id);
      groupCache.set(event.id, metadata);
    } catch {}

    const botNumber =
      sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
    const botLid = sock.user?.id;
    if (event.action === "add") {
      await sock.sendPresenceUpdate("available", event.id);
      const addedParticipants = event.participants || [];
      const isBotAdded = addedParticipants.some((p) => {
        const rJid = typeof p === 'object' && p !== null ? (p.phoneNumber || p.id) : p;
        if (typeof rJid !== 'string') return false;

        const pNum = rJid.split("@")[0].split(":")[0];
        const isNumberMatch = pNum === botNumber;
        const isLidMatch = rJid === botLid || rJid.includes(botNumber);
        const isFullMatch =
          sock.user?.id &&
          (rJid.includes(sock.user.id.split(":")[0]) ||
            rJid.includes(sock.user.id.split("@")[0]));

        return isNumberMatch || isLidMatch || isFullMatch;
      });
      if (isBotAdded) {
        try {
          const inviter = event.author || "";
          const inviterMention = inviter
            ? `@${inviter.split("@")[0]}`
            : "seseorang";
          const prefix = config.command?.prefix || ".";

          let groupName = "grup ini";
          try {
            const meta = await sock.groupMetadata(event.id);
            groupName = meta.subject || "grup ini";
          } catch {}

          const saluranId =
            config.saluran?.id || "120363208449943317@newsletter";
          const saluranName =
            config.saluran?.name || config.bot?.name || "Ourin-AI";

          const welcomeText =
            `👋 *ʜᴀɪ, sᴀʟᴀᴍ ᴋᴇɴᴀʟ!*\n\n` +
            `Aku *${config.bot?.name || "Ourin-AI"}* 🤖\n\n` +
            `Terima kasih sudah mengundang aku ke *${groupName}*!\n` +
            `Aku diundang oleh ${inviterMention} ✨\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 🔧 Developer: *${config.bot?.developer || "Lucky Archz"}*\n` +
            `┃ 📢 Prefix: \`${prefix}\`\n` +
            `┃ 📩 Support: ${config.bot?.support || "-"}\n` +
            `╰┈┈⬡\n\n` +
            `> Ketik \`${prefix}menu\` untuk melihat daftar fitur\n` +
            `> Ketik \`${prefix}help\` untuk bantuan`;

          await sock.sendMessage(event.id, {
            text: welcomeText,
            contextInfo: {
              mentionedJid: inviter ? [inviter] : [],
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127,
              },
            },
          });

          colors.logger.success("BotJoin", `Bot joined group: ${groupName}`);
        } catch (e) {
          colors.logger.error(
            "BotJoin",
            `Failed to send welcome: ${e.message}`,
          );
        }
      }
    }

    if (options.onParticipantsUpdate) {
      await options.onParticipantsUpdate(event, sock);
    }
  });

  sock.ev.on("chats.upsert", async (chats) => {
    for (const chat of chats) {
      const chatId = chat?.id;
      if (!chatId) continue;

      if (chatId.endsWith("@g.us")) {
        if (!global.groupMetadataCache) {
          global.groupMetadataCache = new Map();
        }

        if (!global.groupMetadataCache.has(chatId)) {
          sock
            .groupMetadata(chatId)
            .then((metadata) => {
              if (metadata) {
                global.groupMetadataCache.set(chatId, {
                  data: metadata,
                  timestamp: Date.now(),
                });
              }
            })
            .catch(() => {});
        }
      }
    }
  });

  sock.ev.on("contacts.upsert", () => {});

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // console.log(messages)
    if (type !== "notify" && type !== "append") return;

    if (!connectionState.isReady) {
      let retries = 0;
      while (!connectionState.isReady && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        retries++;
      }
      if (!connectionState.isReady) return;
    }

    const currentSock = connectionState.sock;
    if (!currentSock) return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const msgId = msg.key?.id;
      if (msgId && processedMessages.has(msgId)) continue;
      if (msgId) processedMessages.set(msgId, true);

      const moment = require("moment-timezone");
      const msgTimestamp = msg.messageTimestamp
        ? msg.messageTimestamp * 1000
        : 0;
      const now = moment().tz("Asia/Jakarta").valueOf();
      const msgAge = now - msgTimestamp;
      if (msgAge > 5 * 60 * 1000) {
        continue;
      }

      const metadataKeys = ['senderKeyDistributionMessage', 'messageContextInfo'];
      const msgType = Object.keys(msg.message).find(k => !metadataKeys.includes(k)) || Object.keys(msg.message)[0];
      const hasInteractiveResponse = msg.message.interactiveResponseMessage;

      if (msgType === "protocolMessage") {
        const protocolMessage = msg.message.protocolMessage;
        if (protocolMessage?.type === 30 && protocolMessage?.memberLabel) {
          try {
            const {
              handleLabelChange,
            } = require("../plugins/group/notifgantitag");
            if (handleLabelChange) {
              await handleLabelChange(msg, currentSock);
            }
          } catch (e) {}
        }
      }

      const allMsgKeys = Object.keys(msg.message || {});

      const isStatusMention =
        allMsgKeys.includes("groupStatusMentionMessage") ||
        allMsgKeys.includes("groupMentionedMessage") ||
        allMsgKeys.includes("statusMentionMessage") ||
        msg.message?.viewOnceMessage?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2Extension?.message
          ?.groupStatusMentionMessage ||
        msg.message?.ephemeralMessage?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.contextInfo?.groupMentions?.length > 0;

      const hasGroupMentionInContext = (() => {
        const content = msg.message?.[msgType];
        if (content?.contextInfo?.groupMentions?.length > 0) return true;

        const viewOnce =
          msg.message?.viewOnceMessage?.message ||
          msg.message?.viewOnceMessageV2?.message ||
          msg.message?.viewOnceMessageV2Extension?.message;
        if (viewOnce) {
          const vType = Object.keys(viewOnce)[0];
          if (viewOnce[vType]?.contextInfo?.groupMentions?.length > 0)
            return true;
        }
        return false;
      })();

      if (isStatusMention || hasGroupMentionInContext) {
        const groupJid = msg.key.remoteJid;

        try {
          const { getDatabase } = require("./lib/database");
          const db = getDatabase();
          if (groupJid?.endsWith("@g.us")) {
            const groupData = db?.getGroup?.(groupJid) || {};
            if (groupData.antitagsw === "on") {
              const sender =
                msg.key.participant || msg.participant || "Unknown";
              const senderName =
                (await currentSock.getName?.(sender, groupJid)) ||
                sender.split("@")[0];

              await currentSock.sendMessage(groupJid, { delete: msg.key });

              await currentSock.sendMessage(groupJid, {
                text:
                  `🚫 *ᴀɴᴛɪ ᴛᴀɢ sᴛᴀᴛᴜs*\n\n` +
                  `> Pesan tag status dari @${sender.split("@")[0]} telah dihapus!\n` +
                  `> Fitur antitagsw aktif di grup ini.`,
                contextInfo: {
                  mentionedJid: [sender],
                  isForwarded: true,
                  forwardingScore: 999,
                },
              });
            }
          }
        } catch (e) {
          colors.logger.error("AntiTagSW", e.message);
        }
      }

      const ignoredTypes = [
        "protocolMessage",
        "reactionMessage",
        "senderKeyDistributionMessage",
        "stickerSyncRmrMessage",
        "encReactionMessage",
        "pollUpdateMessage",
        "pollCreationMessage",
        "pollCreationMessageV2",
        "pollCreationMessageV3",
        "keepInChatMessage",
        "requestPhoneNumberMessage",
        "pinInChatMessage",
        "deviceSentMessage",
        "call",
        "peerDataOperationRequestMessage",
        "bcallMessage",
        "secretEncryptedMessage",
      ];

      if (
        ignoredTypes.includes(msgType) ||
        (msgType === "messageContextInfo" && !hasInteractiveResponse)
      ) {
        continue;
      }

      if (msg.key.fromMe && type === "append") {
        continue;
      }

      let jid = msg.key.remoteJid || "";

      if (jid === "status@broadcast") continue;

      if (isLid(jid)) {
        jid = lidToJid(jid);
        msg.key.remoteJid = jid;
      }

      if (msg.key.participant && isLid(msg.key.participant)) {
        msg.key.participant = lidToJid(msg.key.participant);
      }
      if (jid.endsWith("@broadcast")) {
        continue;
      }
      if (!jid || jid === "undefined" || jid.length < 5) {
        continue;
      }
      if (options.onRawMessage) {
        try {
          await options.onRawMessage(msg, currentSock);
        } catch (error) {}
      }

      const messageBody = (() => {
        const m = msg.message;
        if (!m) return "";
        const type = Object.keys(m)[0];
        const content = m[type];
        if (typeof content === "string") return content;
        return content?.text || content?.caption || content?.conversation || "";
      })();

      const isGroup = msg.key.remoteJid?.endsWith('@g.us');
      const senderJid = isGroup 
        ? (msg.key.participantAlt || msg.key.participant)
        : (msg.key.remoteJidAlt || msg.key.remoteJid || "");
      const isOwner = config.isOwner(senderJid);
      if (isOwner && messageBody.startsWith("=>")) {
        console.log("Owner", "Executing code");
        const code = messageBody.slice(2).trim();
        if (code) {
          try {
            const { serialize } = require("./lib/serialize");
            const m = await serialize(currentSock, msg, {});
            const db = require("./lib/database").getDatabase();
            const sock = currentSock;
            const sharp = require("sharp");

            let result;
            if (code.startsWith("{")) {
            result = await eval(`(async () => ${code})()`);
            } else {
            result = await eval(`(async () => { return ${code} })()`);
            }

            if (typeof result !== "string") {
              result = require("util").inspect(result, { depth: 2 });
            }

          } catch (err) {
            await currentSock.sendMessage(
              jid,
              {
                text: `❌ *ᴇᴠᴀʟ ᴇʀʀᴏʀ*\n\n\`\`\`\n${err.message}\n\`\`\``,
              },
              { quoted: msg },
            );
          }
          continue;
        }
      }

      if (isOwner && messageBody.startsWith("$")) {
        const command = messageBody.slice(1).trim();
        if (command) {
          try {
            const { exec } = require("child_process");
            const { promisify } = require("util");
            const execAsync = promisify(exec);

            const isWindows = process.platform === "win32";
            const shell = isWindows ? "powershell.exe" : "/bin/bash";

            await currentSock.sendMessage(
              jid,
              {
                text: `⏳ *ᴇxᴇᴄᴜᴛɪɴɢ...*\n\n\`$ ${command}\``,
              },
              { quoted: msg },
            );

            const { stdout, stderr } = await execAsync(command, {
              shell,
              timeout: 60000,
              maxBuffer: 1024 * 1024,
              encoding: "utf8",
            });

            const output = stdout || stderr || "No output";

            await currentSock.sendMessage(jid, {
              text: `✅ *ᴛᴇʀᴍɪɴᴀʟ*\n\n\`$ ${command}\`\n\n\`\`\`\n${output.slice(0, 3500)}\n\`\`\``,
            });
          } catch (err) {
            const errorMsg = err.stderr || err.stdout || err.message;
            await currentSock.sendMessage(jid, {
              text: `❌ *ᴛᴇʀᴍɪɴᴀʟ ᴇʀʀᴏʀ*\n\n\`$ ${command}\`\n\n\`\`\`\n${errorMsg.slice(0, 3500)}\n\`\`\``,
            });
          }
          continue;
        }
      }

      if (options.onMessage) {
        try {
          await options.onMessage(msg, currentSock);
        } catch (error) {
          colors.logger.error("Message", error.message);
        }
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    if (options.onGroupUpdate) {
      await options.onGroupUpdate(update, sock);
    }
  });

  sock.ev.on("groups.update", async (updates) => {
    for (const update of updates) {
      if (options.onGroupSettingsUpdate) {
        try {
          await options.onGroupSettingsUpdate(update, sock);
        } catch (error) {
          console.error("[GroupsUpdate] Error:", error.message);
        }
      }
    }
  });

  sock.ev.on("messages.update", async (updates) => {
    if (options.onMessageUpdate) {
      await options.onMessageUpdate(updates, sock);
    }
  });

  if (config.features?.antiCall) {
    sock.ev.on("call", async (calls) => {
      for (const call of calls) {
        if (call.status === "offer") {
          colors.logger.warn("Call", `Menolak panggilan dari ${call.from}`);
          await sock.rejectCall(call.id, call.from);

          await sock.sendMessage(call.from, {
            text: "🚫 *Auto Reject Call*\n\nMaaf, bot tidak menerima panggilan. Silakan kirim pesan teks saja.",
          });
        }
      }
    });
  }

  return sock;
}

/**
 * Mendapatkan status koneksi
 * @returns {ConnectionState} State koneksi saat ini
 */
function getConnectionState() {
  return connectionState;
}

/**
 * Mendapatkan socket instance
 * @returns {Object|null} Socket atau null jika tidak terkoneksi
 */
function getSocket() {
  return connectionState.sock;
}

/**
 * Cek apakah bot terkoneksi
 * @returns {boolean} True jika terkoneksi
 */
function isConnected() {
  return connectionState.isConnected;
}

/**
 * Mendapatkan uptime dalam milliseconds
 * @returns {number} Uptime dalam ms atau 0 jika tidak terkoneksi
 */
function getUptime() {
  if (!connectionState.connectedAt) return 0;
  return Date.now() - connectionState.connectedAt.getTime();
}

/**
 * Logout dan hapus session
 * @returns {Promise<boolean>} True jika berhasil
 */
async function logout() {
  try {
    const sessionPath = path.join(
      process.cwd(),
      "storage",
      config.session?.folderName || "session",
    );

    if (connectionState.sock) {
      await connectionState.sock.logout();
    }

    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    connectionState.isConnected = false;
    connectionState.sock = null;
    connectionState.connectedAt = null;

    colors.logger.success("Connection", "Logged out dan session dihapus");
    return true;
  } catch (error) {
    colors.logger.error("Connection", "Logout error:", error.message);
    return false;
  }
}

module.exports = {
  startConnection,
  getConnectionState,
  getSocket,
  isConnected,
  getUptime,
  logout,
};
