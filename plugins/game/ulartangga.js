/**
 * 🐍🎲 ULAR TANGGA GAME
 * Classic snake and ladder game with visual board
 *
 * Based on reference: RTXZY-MD-pro/plugins/game-ulartangga.js
 * Enhanced for OurinAI with visual board and full contextInfo
 */

const { getDatabase } = require("../../src/lib/database");
const {
  drawBoard,
  getRandomMap,
  DICE_STICKERS,
} = require("../../src/lib/ulartangga");
const config = require("../../config");
const fs = require("fs");
const path = require("path");

const pluginConfig = {
  name: "ulartangga",
  alias: ["ut", "snakeladder", "sl"],
  category: "game",
  description: "Main ular tangga bersama player lain dengan visual board",
  usage: ".ulartangga <create|join|start|info|exit|delete>",
  example: ".ulartangga create",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

if (!global.ulartanggaGames) global.ulartanggaGames = {};

const PLAYER_COLORS = ["🔴", "🟡", "🟢", "🔵"];
const PLAYER_NAMES = ["Merah", "Kuning", "Hijau", "Biru"];

const WIN_REWARD = { koin: 2000, exp: 1000, energi: 5 };

function uniqueMentions(mentions = []) {
  return [...new Set((mentions || []).filter(Boolean))];
}

let thumbUT = null;
try {
  const thumbPath = path.join(
    process.cwd(),
    "assets",
    "images",
    "ourin-games.jpg",
  );
  if (fs.existsSync(thumbPath)) {
    thumbUT = fs.readFileSync(thumbPath);
  }
} catch (e) {}

function getUTContextInfo(
  title = "🐍🎲 ULAR TANGGA",
  body = "Permainan klasik!",
  mentions = [],
) {
  const saluranId = config.saluran?.id || "120363208449943317@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Ourin-AI";

  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };

  if (thumbUT) {
    contextInfo.externalAdReply = {
      title: title,
      body: body,
      thumbnail: thumbUT,
      mediaType: 1,
      renderLargerThumbnail: true,
      sourceUrl: config.saluran?.link || "",
    };
  }

  const normalizedMentions = uniqueMentions(mentions);
  if (normalizedMentions.length) {
    contextInfo.mentionedJid = normalizedMentions;
  }
  return contextInfo;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const ut = global.ulartanggaGames;
  const prefix = m.prefix || config.command?.prefix || ".";

  const commands = {
    create: async () => {
      if (ut[m.chat]) {
        return sock.sendMessage(
          m.chat,
          {
            text:
              `❌ *ROOM SUDAH ADA*\n\n` +
              `> Masih ada sesi permainan di chat ini!\n` +
              `> Host: @${ut[m.chat].host.split("@")[0]}\n` +
              `> Status: ${ut[m.chat].status}`,
            contextInfo: getUTContextInfo(
              "🐍🎲 ULAR TANGGA",
              "Permainan klasik!",
              [ut[m.chat].host],
            ),
          },
          { quoted: m },
        );
      }

      const mapConfig = getRandomMap();

      ut[m.chat] = {
        date: Date.now(),
        status: "WAITING",
        host: m.sender,
        players: {},
        turn: 0,
        map: mapConfig.map,
        mapName: mapConfig.name,
        snakesLadders: mapConfig.snakesLadders,
        stabil_x: mapConfig.stabil_x,
        stabil_y: mapConfig.stabil_y,
      };
      ut[m.chat].players[m.sender] = { rank: "HOST", position: 1 };

      await m.react("🎲");
      await sock.sendMessage(
        m.chat,
        {
          text:
            `🐍🎲 *ULAR TANGGA*\n\n` +
            `Room berhasil dibuat!\n\n` +
            `╭┈┈⬡「 📋 *INFO ROOM* 」\n` +
            `┃ 👑 Host: @${m.sender.split("@")[0]}\n` +
            `┃ 👥 Players: 1/4\n` +
            `┃ 🗺️ Map: ${mapConfig.name}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🎮 *COMMANDS* 」\n` +
            `┃ ➕ \`${prefix}ut join\` - Gabung\n` +
            `┃ ▶️ \`${prefix}ut start\` - Mulai\n` +
            `┃ ℹ️ \`${prefix}ut info\` - Info room\n` +
            `┃ 🚪 \`${prefix}ut exit\` - Keluar\n` +
            `╰┈┈┈┈┈┈┈┈⬡`,
          contextInfo: getUTContextInfo("🎲 ROOM CREATED", "Ayo bergabung!", [
            m.sender,
          ]),
        },
        { quoted: m },
      );
    },

    join: async () => {
      if (!ut[m.chat]) {
        return m.reply(
          `❌ Tidak ada sesi permainan!\n> Ketik \`${prefix}ut create\` untuk membuat room.`,
        );
      }

      if (ut[m.chat].players[m.sender]) {
        return m.reply(`❌ Kamu sudah bergabung di room ini!`);
      }

      const playerCount = Object.keys(ut[m.chat].players).length;
      if (playerCount >= 4) {
        return m.reply(`❌ Room sudah penuh! (Max 4 player)`);
      }

      if (ut[m.chat].status === "PLAYING") {
        return m.reply(`❌ Game sedang berjalan, tidak bisa join!`);
      }

      ut[m.chat].players[m.sender] = { rank: "MEMBER", position: 1 };

      const players = Object.keys(ut[m.chat].players);
      const playerList = players
        .map(
          (p, i) =>
            `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]}`,
        )
        .join("\n");

      await m.react("✅");
      await sock.sendMessage(
        m.chat,
        {
          text:
            `✅ *PLAYER BERGABUNG*\n\n` +
            `@${m.sender.split("@")[0]} masuk!\n\n` +
            `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
            `${playerList
              .split("\n")
              .map((l) => `┃ ${l}`)
              .join("\n")}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Total: ${players.length}/4\n` +
            `> ${players.length >= 2 ? `✅ Bisa mulai! \`${prefix}ut start\`` : "⏳ Butuh 1 player lagi"}`,
          contextInfo: getUTContextInfo(
            "👥 PLAYER JOINED",
            `${players.length}/4 players`,
            players,
          ),
        },
        { quoted: m },
      );
    },

    start: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ Tidak ada sesi permainan!`);
      }

      if (ut[m.chat].status === "PLAYING") {
        return m.reply(`❌ Permainan sudah berjalan!`);
      }

      if (ut[m.chat].host !== m.sender && !config.isOwner?.(m.sender)) {
        return m.reply(`❌ Hanya host yang dapat memulai permainan!`);
      }

      const players = Object.keys(ut[m.chat].players);
      if (players.length < 2) {
        return m.reply(`❌ Minimal 2 player untuk bermain!`);
      }

      ut[m.chat].status = "PLAYING";
      ut[m.chat].turn = 0;

      const playerList = players
        .map(
          (p, i) =>
            `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]}`,
        )
        .join("\n");

      // Draw initial board with all players at position 1
      const positions = players.map((p) => ut[m.chat].players[p].position);
      const boardImage = await drawBoard(
        ut[m.chat].map,
        positions[0] || null,
        positions[1] || null,
        positions[2] || null,
        positions[3] || null,
        ut[m.chat].stabil_x,
        ut[m.chat].stabil_y,
      );

      await m.react("🎮");

      if (boardImage) {
        await sock.sendMessage(
          m.chat,
          {
            image: boardImage,
            caption:
              `🐍🎲 *PERMAINAN DIMULAI!*\n\n` +
              `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
              `${playerList
                .split("\n")
                .map((l) => `┃ ${l}`)
                .join("\n")}\n` +
              `╰┈┈┈┈┈┈┈┈⬡\n\n` +
              `> 🎯 Giliran: @${players[0].split("@")[0]}\n` +
              `> Ketik *kocok* untuk lempar dadu!`,
            contextInfo: getUTContextInfo(
              "🎮 GAME STARTED",
              "Lempar dadu!",
              players,
            ),
          },
          { quoted: m },
        );
      } else {
        // Fallback tanpa gambar
        await sock.sendMessage(
          m.chat,
          {
            text:
              `🐍🎲 *PERMAINAN DIMULAI!*\n\n` +
              `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
              `${playerList
                .split("\n")
                .map((l) => `┃ ${l}`)
                .join("\n")}\n` +
              `╰┈┈┈┈┈┈┈┈⬡\n\n` +
              `> 🎯 Giliran: @${players[0].split("@")[0]}\n` +
              `> Ketik *kocok* untuk lempar dadu!`,
            contextInfo: getUTContextInfo(
              "🎮 GAME STARTED",
              "Lempar dadu!",
              players,
            ),
          },
          { quoted: m },
        );
      }
    },

    info: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ Tidak ada sesi permainan!`);
      }

      const players = Object.keys(ut[m.chat].players);
      const playerList = players
        .map((p, i) => {
          const pos = ut[m.chat].players[p].position;
          return `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]} - Pos: ${pos}`;
        })
        .join("\n");

      const currentTurn =
        ut[m.chat].status === "PLAYING"
          ? players[ut[m.chat].turn % players.length]
          : null;

      await sock.sendMessage(
        m.chat,
        {
          text:
            `🐍🎲 *INFO ROOM*\n\n` +
            `╭┈┈⬡「 📋 *ROOM* 」\n` +
            `┃ 👑 Host: @${ut[m.chat].host.split("@")[0]}\n` +
            `┃ 📍 Status: ${ut[m.chat].status}\n` +
            `┃ 🗺️ Map: ${ut[m.chat].mapName}\n` +
            `┃ 👥 Players: ${players.length}/4\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
            `${playerList
              .split("\n")
              .map((l) => `┃ ${l}`)
              .join("\n")}\n` +
            `╰┈┈┈┈┈┈┈┈⬡` +
            (currentTurn
              ? `\n\n> 🎯 Giliran: @${currentTurn.split("@")[0]}`
              : ""),
          contextInfo: getUTContextInfo(
            "📋 ROOM INFO",
            `${players.length} players`,
            players,
          ),
        },
        { quoted: m },
      );
    },

    exit: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ Tidak ada sesi permainan!`);
      }

      if (!ut[m.chat].players[m.sender]) {
        return m.reply(`❌ Kamu tidak ada di permainan ini!`);
      }

      delete ut[m.chat].players[m.sender];
      await sock.sendMessage(
        m.chat,
        {
          text: `👋 @${m.sender.split("@")[0]} keluar dari permainan.`,
          contextInfo: getUTContextInfo(
            "🐍🎲 ULAR TANGGA",
            "Permainan klasik!",
            [m.sender],
          ),
        },
        { quoted: m },
      );

      if (Object.keys(ut[m.chat].players).length === 0) {
        delete ut[m.chat];
        return m.reply(`🗑️ Room dihapus karena tidak ada player.`);
      }

      if (!ut[m.chat].players[ut[m.chat].host]) {
        const newHost = Object.keys(ut[m.chat].players)[0];
        ut[m.chat].host = newHost;
        ut[m.chat].players[newHost].rank = "HOST";
        await sock.sendMessage(
          m.chat,
          {
            text: `👑 Host dipindahkan ke @${newHost.split("@")[0]}`,
            contextInfo: getUTContextInfo(
              "🐍🎲 ULAR TANGGA",
              "Permainan klasik!",
              [newHost],
            ),
          },
          { quoted: m },
        );
      }

      // Fix turn if playing
      if (ut[m.chat].status === "PLAYING") {
        const players = Object.keys(ut[m.chat].players);
        ut[m.chat].turn = ut[m.chat].turn % players.length;
        await sock.sendMessage(m.chat, {
          text: `> Giliran: @${players[ut[m.chat].turn].split("@")[0]}\n> Ketik *kocok*`,
          contextInfo: getUTContextInfo(
            "🐍🎲 ULAR TANGGA",
            "Permainan klasik!",
            [players[ut[m.chat].turn]],
          ),
        });
      }
    },

    delete: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ Tidak ada sesi permainan!`);
      }

      if (ut[m.chat].host !== m.sender && !config.isOwner?.(m.sender)) {
        return m.reply(`❌ Hanya host yang dapat menghapus room!`);
      }

      delete ut[m.chat];
      await m.react("🗑️");
      await m.reply(`🗑️ Room berhasil dihapus!`);
    },
  };

  if (!action || !commands[action]) {
    return sock.sendMessage(
      m.chat,
      {
        text:
          `🐍🎲 *ULAR TANGGA*\n\n` +
          `Permainan klasik yang penuh petualangan!\n` +
          `Naiki tangga, hindari ular, sampai ke 100!\n\n` +
          `╭┈┈⬡「 🎮 *COMMANDS* 」\n` +
          `┃ 🎲 \`${prefix}ut create\` - Buat room\n` +
          `┃ ➕ \`${prefix}ut join\` - Gabung room\n` +
          `┃ ▶️ \`${prefix}ut start\` - Mulai game\n` +
          `┃ ℹ️ \`${prefix}ut info\` - Info room\n` +
          `┃ 🚪 \`${prefix}ut exit\` - Keluar\n` +
          `┃ 🗑️ \`${prefix}ut delete\` - Hapus room\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `╭┈┈⬡「 🏆 *HADIAH* 」\n` +
          `┃ 💰 +${WIN_REWARD.koin.toLocaleString()} Koin\n` +
          `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
          `┃ ⚡ +${WIN_REWARD.energi} Energi\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `> Min 2 player, Max 4 player`,
        contextInfo: getUTContextInfo("🐍🎲 ULAR TANGGA", "Ayo main!"),
      },
      { quoted: m },
    );
  }

  try {
    await commands[action]();
  } catch (error) {
    console.error("[ULARTANGGA ERROR]", error);
    await m.reply(`❌ Error: ${error.message}`);
  }
}

// ==================== Answer Handler (for "kocok") ====================
async function answerHandler(m, sock) {
  if (!m.body) return false;

  const text = m.body.trim().toLowerCase();
  if (text !== "kocok") return false;

  const ut = global.ulartanggaGames;
  if (!ut[m.chat]) return false;
  if (ut[m.chat].status !== "PLAYING") return false;

  const players = Object.keys(ut[m.chat].players);
  if (!players.includes(m.sender)) return false;

  const currentTurn = ut[m.chat].turn % players.length;
  if (players.indexOf(m.sender) !== currentTurn) {
    await m.reply(
      `❌ Bukan giliranmu!\n> Giliran: @${players[currentTurn].split("@")[0]}`,
      {
        mentions: [players[currentTurn]],
      },
    );
    return true;
  }

  const db = getDatabase();

  // Roll dice
  const dadu = Math.floor(Math.random() * 6) + 1;
  const DICE_EMOJI = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  // Send dice sticker
  try {
    const diceUrl = DICE_STICKERS[dadu - 1];
    await sock.sendMessage(
      m.chat,
      {
        sticker: { url: diceUrl },
        contextInfo: getUTContextInfo(
          `🎲 DADU: ${dadu}`,
          PLAYER_NAMES[players.indexOf(m.sender)],
        ),
      },
      { quoted: m },
    );
  } catch (e) {
    // Fallback: just react with dice emoji
    await m.react(DICE_EMOJI[dadu - 1]);
  }

  const oldPos = ut[m.chat].players[m.sender].position;
  let newPos = oldPos + dadu;

  // Bounce back if over 100
  if (newPos > 100) {
    newPos = 100 - (newPos - 100);
  }

  // Check snake/ladder
  let event = "";
  const snakesLadders = ut[m.chat].snakesLadders;
  if (snakesLadders[newPos]) {
    const destination = snakesLadders[newPos];
    if (destination > newPos) {
      event = `\n🪜 *Naik tangga!*`;
    } else {
      event = `\n🐍 *Kena ular!*`;
    }
    newPos = destination;
  }

  ut[m.chat].players[m.sender].position = newPos;

  const playerIdx = players.indexOf(m.sender);
  const color = PLAYER_COLORS[playerIdx];
  const name = PLAYER_NAMES[playerIdx];

  // Check win condition
  if (newPos === 100) {
    // Give rewards
    try {
      db.updateKoin(m.sender, WIN_REWARD.koin);
      db.updateEnergi(m.sender, WIN_REWARD.energi);
      const userData = db.getUser(m.sender) || {};
      userData.exp = (userData.exp || 0) + WIN_REWARD.exp;
      db.setUser(m.sender, userData);
    } catch (e) {
      console.log("[UT] Failed to give reward:", e.message);
    }

    // Draw final board
    const positions = players.map(
      (p) => ut[m.chat].players[p]?.position || null,
    );
    const boardImage = await drawBoard(
      ut[m.chat].map,
      positions[0] || null,
      positions[1] || null,
      positions[2] || null,
      positions[3] || null,
      ut[m.chat].stabil_x,
      ut[m.chat].stabil_y,
    );

    await m.react("🎉");

    if (boardImage) {
      await sock.sendMessage(m.chat, {
        image: boardImage,
        caption:
          `🎉 *PEMENANG!*\n\n` +
          `${color} @${m.sender.split("@")[0]} sampai ke 100!\n\n` +
          `╭┈┈⬡「 🎁 *HADIAH* 」\n` +
          `┃ 💰 +${WIN_REWARD.koin.toLocaleString()} Koin\n` +
          `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
          `┃ ⚡ +${WIN_REWARD.energi} Energi\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `> GG WP! Main lagi? \`.ut create\``,
        contextInfo: getUTContextInfo("🏆 WINNER!", `${name} menang!`, [
          m.sender,
        ]),
      });
    } else {
      await sock.sendMessage(m.chat, {
        text:
          `🎉 *PEMENANG!*\n\n` +
          `${color} @${m.sender.split("@")[0]} sampai ke 100!\n\n` +
          `╭┈┈⬡「 🎁 *HADIAH* 」\n` +
          `┃ 💰 +${WIN_REWARD.koin.toLocaleString()} Koin\n` +
          `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
          `┃ ⚡ +${WIN_REWARD.energi} Energi\n` +
          `╰┈┈┈┈┈┈┈┈⬡`,
        contextInfo: getUTContextInfo("🏆 WINNER!", `${name} menang!`, [
          m.sender,
        ]),
      });
    }

    delete ut[m.chat];
    return true;
  }

  // Continue game
  ut[m.chat].turn++;
  const nextTurn = ut[m.chat].turn % players.length;
  const nextPlayer = players[nextTurn];

  // Draw updated board
  const positions = players.map((p) => ut[m.chat].players[p]?.position || null);
  const boardImage = await drawBoard(
    ut[m.chat].map,
    positions[0] || null,
    positions[1] || null,
    positions[2] || null,
    positions[3] || null,
    ut[m.chat].stabil_x,
    ut[m.chat].stabil_y,
  );

  if (boardImage) {
    await sock.sendMessage(m.chat, {
      image: boardImage,
      caption:
        `🎲 *DADU: ${dadu}* ${DICE_EMOJI[dadu - 1]}\n\n` +
        `${color} ${name}: *${oldPos}* → *${newPos}*${event}\n\n` +
        `> 🎯 Giliran: @${nextPlayer.split("@")[0]}\n` +
        `> Ketik *kocok*`,
      contextInfo: getUTContextInfo("🎲 GILIRAN", PLAYER_NAMES[nextTurn], [
        nextPlayer,
      ]),
    });
  } else {
    await sock.sendMessage(m.chat, {
      text:
        `🎲 *DADU: ${dadu}* ${DICE_EMOJI[dadu - 1]}\n\n` +
        `${color} ${name}: *${oldPos}* → *${newPos}*${event}\n\n` +
        `> 🎯 Giliran: @${nextPlayer.split("@")[0]}\n` +
        `> Ketik *kocok*`,
      contextInfo: getUTContextInfo("🎲 GILIRAN", PLAYER_NAMES[nextTurn], [
        nextPlayer,
      ]),
    });
  }

  return true;
}

module.exports = {
  config: pluginConfig,
  handler,
  answerHandler,
};
