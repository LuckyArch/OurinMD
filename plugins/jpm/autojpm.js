const { getDatabase } = require("../../src/lib/database");
const {
  getAutoJpmConfig,
  setAutoJpmConfig,
  startAutoJpmScheduler,
  stopAutoJpmScheduler,
  getAutoJpmStorageDir,
} = require("../../src/lib/autojpmScheduler");
const { getMimeType, getExtension } = require("../../src/lib/functions");
const timeHelper = require("../../src/lib/timeHelper");
const config = require("../../config");
const fs = require("fs");
const path = require("path");

const pluginConfig = {
  name: "autojpm",
  alias: ["autojasher", "autojaserm", "autojasabroadcast"],
  category: "jpm",
  description: "Jadwalkan JPM otomatis dengan interval dan media",
  usage: ".autojpm on <interval> <pesan>",
  example: ".autojpm on 1h Halo semuanya!",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

function parseInterval(raw) {
  if (!raw) return 0;
  const cleaned = raw.toLowerCase().replace(/\s+/g, "");
  const matches = [...cleaned.matchAll(/(\d+)([smhdw])/g)];
  if (!matches.length) return 0;
  const combined = matches.map((match) => match[0]).join("");
  if (combined !== cleaned) return 0;
  let total = 0;
  for (const match of matches) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "s") total += value * 1000;
    if (unit === "m") total += value * 60 * 1000;
    if (unit === "h") total += value * 60 * 60 * 1000;
    if (unit === "d") total += value * 24 * 60 * 60 * 1000;
    if (unit === "w") total += value * 7 * 24 * 60 * 60 * 1000;
  }
  return total;
}

function formatInterval(ms) {
  if (!ms || ms <= 0) return "0 detik";
  const units = [
    { label: "hari", value: 24 * 60 * 60 * 1000 },
    { label: "jam", value: 60 * 60 * 1000 },
    { label: "menit", value: 60 * 1000 },
    { label: "detik", value: 1000 },
  ];
  let remaining = ms;
  const parts = [];
  for (const unit of units) {
    const amount = Math.floor(remaining / unit.value);
    if (amount > 0) {
      parts.push(`${amount} ${unit.label}`);
      remaining -= amount * unit.value;
    }
  }
  return parts.length ? parts.join(" ") : "0 detik";
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  return `${timeHelper.fromTimestamp(timestamp)} WIB`;
}

function previewText(text) {
  if (!text) return "-";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 80) return cleaned;
  return `${cleaned.slice(0, 77)}...`;
}

function normalizeMessageText(text) {
  if (!text) return "";
  return text.replace(/\\n/g, "\n").trim();
}

function getMediaInfo(message) {
  if (!message) return null;
  if (message.isImage) return { type: "image", mimetype: message.mimetype };
  if (message.isVideo) return { type: "video", mimetype: message.mimetype };
  if (message.isAudio) return { type: "audio", mimetype: message.mimetype };
  if (message.isDocument)
    return {
      type: "document",
      mimetype: message.mimetype,
      fileName: message.fileName || message.message?.documentMessage?.fileName,
    };
  return null;
}

function cleanupStoredMedia(mediaPath, currentPath) {
  if (!mediaPath || mediaPath === currentPath) return;
  try {
    const baseDir = getAutoJpmStorageDir();
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(mediaPath);
    if (resolvedPath.startsWith(resolvedBase) && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  } catch (e) {}
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const prefix = m.prefix || config.command?.prefix || ".";
  const input = (m.fullArgs || m.text || "").trim();
  if (!input) {
    const helpText =
      `📢 *AUTO JPM*\n\n` +
      `╭┈┈⬡「 📋 *COMMANDS* 」\n` +
      `┃ ${prefix}autojpm on <interval> <pesan>\n` +
      `┃ ${prefix}autojpm off\n` +
      `┃ ${prefix}autojpm status\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `Interval: 10m, 1h, 2h30m, 1d\n` +
      `Reply media untuk menyimpan gambar/video/audio/dokumen.`;
    return m.reply(helpText);
  }

  const match = input.match(/^(\S+)(?:\s+(\S+))?(?:\s+([\s\S]*))?$/);
  const action = match?.[1]?.toLowerCase() || "";
  const intervalRaw = match?.[2];
  const messageRaw = match?.[3];

  if (["off", "stop", "disable"].includes(action)) {
    const current = getAutoJpmConfig();
    if (!current.enabled) {
      return m.reply(`ℹ️ AutoJPM sudah nonaktif.`);
    }
    setAutoJpmConfig({ ...current, enabled: false });
    stopAutoJpmScheduler();
    return m.reply(`✅ AutoJPM dinonaktifkan.`);
  }

  if (["status", "info"].includes(action)) {
    const current = getAutoJpmConfig();
    if (!current?.message) {
      return m.reply(`ℹ️ AutoJPM belum dikonfigurasi.`);
    }
    const statusText =
      `📢 *AUTO JPM STATUS*\n\n` +
      `╭┈┈⬡「 📋 *DETAIL* 」\n` +
      `┃ ✅ Aktif: ${current.enabled ? "Ya" : "Tidak"}\n` +
      `┃ ⏱️ Interval: ${formatInterval(current.intervalMs || 0)}\n` +
      `┃ 🕒 Next: ${formatTimestamp(current.nextRun)}\n` +
      `┃ 🕒 Last: ${formatTimestamp(current.lastRun)}\n` +
      `┃ 📷 Media: ${current.message?.media?.type || "Tidak"}\n` +
      `┃ 📝 Pesan: ${previewText(current.message?.text)}\n` +
      `╰┈┈┈┈┈┈┈┈⬡`;
    return m.reply(statusText);
  }

  if (!["on", "start", "enable"].includes(action)) {
    return m.reply(`❌ Format salah. Gunakan ${prefix}autojpm on/off/status.`);
  }

  if (!intervalRaw) {
    return m.reply(
      `❌ Interval wajib diisi. Contoh: ${prefix}autojpm on 1h Pesan.`,
    );
  }

  const intervalMs = parseInterval(intervalRaw);
  if (!intervalMs) {
    return m.reply(`❌ Interval tidak valid. Contoh: 10m, 1h, 2h30m, 1d.`);
  }

  if (intervalMs < 15 * 60 * 1000) {
    return m.reply(`❌ Interval minimal 15 menit untuk mencegah spam.`);
  }

  const existing = getAutoJpmConfig();
  const quoted = m.quoted || m;
  const mediaInfo = getMediaInfo(quoted);
  let messageText = normalizeMessageText(messageRaw);

  if (!messageText && mediaInfo) {
    messageText = normalizeMessageText(quoted.body || "");
  }

  let mediaData = existing?.message?.media || null;
  if (mediaInfo) {
    const buffer = await quoted.download();
    if (!buffer) {
      return m.reply(`❌ Gagal mengambil media.`);
    }
    const mimetype = mediaInfo.mimetype || getMimeType(buffer);
    const extension = getExtension(mimetype);
    const fileName = mediaInfo.fileName || `autojpm_${Date.now()}.${extension}`;
    const storageDir = getAutoJpmStorageDir();
    const filePath = path.join(storageDir, fileName);
    fs.writeFileSync(filePath, buffer);
    cleanupStoredMedia(existing?.message?.media?.path, filePath);
    mediaData = {
      type: mediaInfo.type,
      path: filePath,
      mimetype,
      fileName,
    };
  }

  if (
    !messageText &&
    !mediaData &&
    !existing?.message?.text &&
    !existing?.message?.media
  ) {
    return m.reply(`❌ Pesan atau media wajib diisi.`);
  }

  const updatedConfig = {
    enabled: true,
    intervalMs,
    message: {
      text: messageText || existing?.message?.text || "",
      media: mediaData,
    },
    lastRun: 0,
    nextRun: Date.now() + intervalMs,
  };

  setAutoJpmConfig(updatedConfig);
  startAutoJpmScheduler(sock);

  const detailText =
    `✅ *AUTO JPM AKTIF*\n\n` +
    `╭┈┈⬡「 📋 *DETAIL* 」\n` +
    `┃ ⏱️ Interval: ${formatInterval(intervalMs)}\n` +
    `┃ 🕒 Next: ${formatTimestamp(updatedConfig.nextRun)}\n` +
    `┃ 📷 Media: ${updatedConfig.message.media?.type || "Tidak"}\n` +
    `┃ 📝 Pesan: ${previewText(updatedConfig.message.text)}\n` +
    `╰┈┈┈┈┈┈┈┈⬡`;

  return m.reply(detailText);
}

module.exports = {
  config: pluginConfig,
  handler,
};
