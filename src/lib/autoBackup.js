const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { getDatabase } = require("./database");
const timeHelper = require("./timeHelper");

const BACKUP_STATE_FILE = path.join(
  process.cwd(),
  "database",
  "autobackup.json",
);

const EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "storages",
  "sessions",
  "temp",
  "tmp",
  ".env",
  "*.log",
  "*.zip",
  "backup_*.zip",
  "package-lock.json",
  "yarn.lock",
  ".cache",
  "__pycache__",
  ".DS_Store",
  "Thumbs.db",
];

let backupInterval = null;
let sockInstance = null;

function loadBackupState() {
  try {
    if (fs.existsSync(BACKUP_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(BACKUP_STATE_FILE, "utf8"));
    }
  } catch {}
  return {
    enabled: false,
    intervalMs: 3600000,
    intervalStr: "1h",
    lastBackup: null,
    backupCount: 0,
  };
}

function saveBackupState(state) {
  try {
    const dir = path.dirname(BACKUP_STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BACKUP_STATE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (e) {
    console.error("[AutoBackup] Error saving state:", e.message);
  }
}

function parseInterval(str) {
  const match = str.match(/^(\d+)(m|h|d)$/i);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  let ms = 0;
  switch (unit) {
    case "m":
      ms = value * 60 * 1000;
      break;
    case "h":
      ms = value * 60 * 60 * 1000;
      break;
    case "d":
      ms = value * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  if (ms < 60000) return null;
  if (ms > 7 * 24 * 60 * 60 * 1000) return null;

  return { ms, str: `${value}${unit}` };
}

function formatInterval(ms) {
  if (ms >= 24 * 60 * 60 * 1000) {
    return `${Math.floor(ms / (24 * 60 * 60 * 1000))} hari`;
  } else if (ms >= 60 * 60 * 1000) {
    return `${Math.floor(ms / (60 * 60 * 1000))} jam`;
  } else {
    return `${Math.floor(ms / (60 * 1000))} menit`;
  }
}

function shouldExclude(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  const parts = relativePath.split(path.sep);

  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.startsWith("*")) {
      const ext = pattern.slice(1);
      if (relativePath.endsWith(ext)) return true;
    } else {
      if (parts.includes(pattern)) return true;
      if (relativePath === pattern) return true;
    }
  }

  return false;
}

async function createBackup() {
  return new Promise((resolve, reject) => {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const backupDir = path.join(process.cwd(), "temp");
    const backupPath = path.join(backupDir, `backup_${timestamp}.zip`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const output = fs.createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    let fileCount = 0;

    output.on("close", () => {
      resolve({
        path: backupPath,
        size: archive.pointer(),
        fileCount,
        timestamp,
      });
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.on("entry", () => {
      fileCount++;
    });

    archive.pipe(output);

    const rootDir = process.cwd();

    function addDirectory(dirPath, archivePath = "") {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = archivePath
          ? path.join(archivePath, entry.name)
          : entry.name;

        if (shouldExclude(fullPath)) continue;

        if (entry.isDirectory()) {
          addDirectory(fullPath, relativePath);
        } else if (entry.isFile()) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size < 50 * 1024 * 1024) {
              archive.file(fullPath, { name: relativePath });
            }
          } catch {}
        }
      }
    }

    addDirectory(rootDir);
    archive.finalize();
  });
}

async function sendBackupToOwner(backupInfo) {
  if (!sockInstance) {
    console.error("[AutoBackup] Socket not initialized");
    return false;
  }

  const config = require("../../config");
  const ownerNumbers = config.owner?.number || [];

  if (ownerNumbers.length === 0) {
    console.error("[AutoBackup] No owner number configured");
    return false;
  }

  const ownerNumber = String(ownerNumbers[0]).replace(/[^0-9]/g, "");
  if (!ownerNumber) {
    console.error("[AutoBackup] Invalid owner number");
    return false;
  }

  const ownerJid = `${ownerNumber}@s.whatsapp.net`;

  try {
    const sizeInMB = (backupInfo.size / (1024 * 1024)).toFixed(2);
    const state = loadBackupState();

    const caption =
      `🗂️ *ᴀᴜᴛᴏ ʙᴀᴄᴋᴜᴘ*\n\n` +
      `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
      `┃ 📅 Waktu: ${timeHelper.formatDateTime("DD MMMM YYYY HH:mm:ss")} WIB\n` +
      `┃ 📦 Size: ${sizeInMB} MB\n` +
      `┃ 📁 Files: ${backupInfo.fileCount}\n` +
      `┃ ⏱️ Interval: ${formatInterval(state.intervalMs)}\n` +
      `┃ #️⃣ Backup ke-${state.backupCount + 1}\n` +
      `╰┈┈┈┈┈┈┈┈⬡\n\n` +
      `> ${config.bot?.name || "Ourin-AI"} Auto Backup System`;

    await sockInstance.sendMessage(ownerJid, {
      document: fs.readFileSync(backupInfo.path),
      mimetype: "application/zip",
      fileName: path.basename(backupInfo.path),
      caption,
    });

    state.lastBackup = new Date().toISOString();
    state.backupCount++;
    saveBackupState(state);

    try {
      fs.unlinkSync(backupInfo.path);
    } catch {}

    console.log(
      `[AutoBackup] Backup sent successfully to owner (${sizeInMB} MB)`,
    );
    return true;
  } catch (error) {
    console.error("[AutoBackup] Error sending backup:", error.message);
    return false;
  }
}

async function doBackup() {
  try {
    console.log("[AutoBackup] Starting backup...");
    const backupInfo = await createBackup();
    await sendBackupToOwner(backupInfo);
  } catch (error) {
    console.error("[AutoBackup] Backup failed:", error.message);
  }
}

function startAutoBackup(sock) {
  sockInstance = sock;
  const state = loadBackupState();

  if (!state.enabled) {
    console.log("[AutoBackup] Auto backup is disabled");
    return;
  }

  if (backupInterval) {
    clearInterval(backupInterval);
  }

  console.log(
    `[AutoBackup] Started with interval: ${formatInterval(state.intervalMs)}`,
  );

  backupInterval = setInterval(() => {
    doBackup();
  }, state.intervalMs);
}

function stopAutoBackup() {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log("[AutoBackup] Stopped");
  }
}

function enableAutoBackup(intervalStr, sock) {
  const parsed = parseInterval(intervalStr);
  if (!parsed) {
    return {
      success: false,
      error: "Format interval tidak valid. Contoh: 5m, 1h, 2d",
    };
  }

  sockInstance = sock;

  const state = loadBackupState();
  state.enabled = true;
  state.intervalMs = parsed.ms;
  state.intervalStr = parsed.str;
  saveBackupState(state);

  stopAutoBackup();
  startAutoBackup(sock);

  return {
    success: true,
    interval: formatInterval(parsed.ms),
    intervalStr: parsed.str,
  };
}

function disableAutoBackup() {
  const state = loadBackupState();
  state.enabled = false;
  saveBackupState(state);

  stopAutoBackup();

  return { success: true };
}

function getBackupStatus() {
  const state = loadBackupState();
  return {
    enabled: state.enabled,
    interval: formatInterval(state.intervalMs),
    intervalStr: state.intervalStr,
    lastBackup: state.lastBackup,
    backupCount: state.backupCount,
    isRunning: backupInterval !== null,
  };
}

async function triggerManualBackup(sock) {
  sockInstance = sock;
  await doBackup();
}

function initAutoBackup(sock) {
  sockInstance = sock;
  startAutoBackup(sock);
}

module.exports = {
  initAutoBackup,
  startAutoBackup,
  stopAutoBackup,
  enableAutoBackup,
  disableAutoBackup,
  getBackupStatus,
  triggerManualBackup,
  createBackup,
  parseInterval,
  formatInterval,
};
