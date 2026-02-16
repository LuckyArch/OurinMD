const { getDatabase } = require("../../src/lib/database");
const timeHelper = require("../../src/lib/timeHelper");

const pluginConfig = {
  name: "addsewa",
  alias: ["sewaadd", "tambahsewa"],
  category: "owner",
  description: "Whitelist grup untuk sewa bot",
  usage: ".addsewa <link grup> <durasi>",
  example: ".addsewa https://chat.whatsapp.com/xxx 30d",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function parseDuration(str) {
  const match = str.match(/^(\d+)([dDmMyYhH])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const now = Date.now();
  let ms = 0;

  switch (unit) {
    case "h":
      ms = value * 60 * 60 * 1000;
      break;
    case "d":
      ms = value * 24 * 60 * 60 * 1000;
      break;
    case "m":
      ms = value * 30 * 24 * 60 * 60 * 1000;
      break;
    case "y":
      ms = value * 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  return now + ms;
}

function formatDuration(str) {
  const match = str.match(/^(\d+)([dDmMyYhH])$/);
  if (!match) return str;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const units = { h: "jam", d: "hari", m: "bulan", y: "tahun" };
  return `${value} ${units[unit] || unit}`;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args;

  if (!db.db.data.sewa) {
    db.db.data.sewa = { enabled: false, groups: {} };
    db.db.write();
  }

  if (args.length < 2) {
    return m.reply(
      `📝 *ᴀᴅᴅ sᴇᴡᴀ*\n\n` +
        `> Format: \`${m.prefix}addsewa <link> <durasi>\`\n\n` +
        `*ꜰᴏʀᴍᴀᴛ ᴅᴜʀᴀsɪ:*\n` +
        `> \`7d\` = 7 hari\n` +
        `> \`1m\` = 1 bulan\n` +
        `> \`1y\` = 1 tahun\n\n` +
        `*ᴄᴏɴᴛᴏʜ:*\n` +
        `> \`${m.prefix}addsewa https://chat.whatsapp.com/xxx 30d\``,
    );
  }

  const link = args[0];
  const durationStr = args[1];

  if (!link.includes("chat.whatsapp.com/")) {
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link grup tidak valid`);
  }

  const expiredAt = parseDuration(durationStr);
  if (!expiredAt) {
    return m.reply(
      `❌ *ɢᴀɢᴀʟ*\n\n> Format durasi tidak valid\n> Contoh: \`7d\`, \`1m\`, \`1y\``,
    );
  }

  m.react("⏳");

  try {
    const inviteCode = link.split("chat.whatsapp.com/")[1]?.split(/[\s?]/)[0];
    if (!inviteCode) {
      m.react("❌");
      return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat mengekstrak kode invite`);
    }

    const metadata = await sock.groupGetInviteInfo(inviteCode);
    if (!metadata?.id) {
      m.react("❌");
      return m.reply(
        `❌ *ɢᴀɢᴀʟ*\n\n> Grup tidak ditemukan atau link sudah tidak valid`,
      );
    }

    const groupId = metadata.id;
    const groupName = metadata.subject || "Unknown";

    db.db.data.sewa.groups[groupId] = {
      name: groupName,
      addedAt: Date.now(),
      expiredAt: expiredAt,
      addedBy: m.sender,
      inviteCode: inviteCode,
    };
    db.db.write();

    const expiredStr = timeHelper.fromTimestamp(expiredAt, "D MMMM YYYY HH:mm");

    m.react("✅");
    return m.reply(
      `✅ *sᴇᴡᴀ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 📝 ɴᴀᴍᴀ: \`${groupName}\`\n` +
        `┃ 🆔 ɪᴅ: \`${groupId.split("@")[0]}\`\n` +
        `┃ ⏱️ ᴅᴜʀᴀsɪ: \`${formatDuration(durationStr)}\`\n` +
        `┃ 📅 ᴇxᴘɪʀᴇᴅ: \`${expiredStr}\`\n` +
        `╰┈┈⬡`,
    );
  } catch (error) {
    m.react("❌");
    m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
