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

const originalConsoleLog = console.log;
console.log = (...args) => {
  const msg = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  if (
    msg.includes("Closing") &&
    (msg.includes("session") || msg.includes("SessionEntry"))
  ) {
    return;
  }
  if (
    msg.includes("prekey") ||
    msg.includes("_chains") ||
    msg.includes("registrationId")
  ) {
    return;
  }
  if (
    msg.includes("Buffer") ||
    msg.includes("chainKey") ||
    msg.includes("ephemeralKeyPair")
  ) {
    return;
  }
  if (
    msg.includes("rootKey") ||
    msg.includes("indexInfo") ||
    msg.includes("pendingPreKey")
  ) {
    return;
  }
  if (
    msg.includes("currentRatchet") ||
    msg.includes("baseKey") ||
    msg.includes("privKey")
  ) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

const path = require("path");
const fs = require("fs");
const config = require("./config");
const { startConnection } = require("./src/connection");
const {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
} = require("./src/handler");
const { loadPlugins, pluginStore } = require("./src/lib/plugins");
const { initDatabase, getDatabase } = require("./src/lib/database");
const {
  initScheduler,
  loadScheduledMessages,
  startGroupScheduleChecker,
  startSewaChecker,
} = require("./src/lib/scheduler");
const { startAutoBackup } = require("./src/lib/backup");
const { handleAntiTagSW } = require("./src/lib/groupProtection");
const { initSholatScheduler } = require("./src/lib/sholatScheduler");
const { initAutoJpmScheduler } = require("./src/lib/autojpmScheduler");
try {
  const { startOrderPoller } = require("./src/lib/orderPoller");
} catch {}
// otpPoller excluded
const {
  logger,
  c,
  printBanner,
  printStartup,
  logConnection,
  logErrorBox,
  logPlugin,
  divider,
} = require("./src/lib/colors");

/**
 * Waktu start untuk menghitung boot time
 */
const startTime = Date.now();

/**
 * Watcher untuk auto-reload plugins di dev mode
 */
let pluginWatcher = null;
const reloadDebounce = new Map();

/**
 * Memulai file watcher untuk dev mode
 */
function startDevWatcher(pluginsPath) {
  if (pluginWatcher) {
    pluginWatcher.close();
  }

  logger.system("Dev Mode", "Plugin hot reload enabled");

  pluginWatcher = fs.watch(
    pluginsPath,
    { recursive: true },
    (eventType, filename) => {
      if (!filename || !filename.endsWith(".js")) return;

      const existingTimeout = reloadDebounce.get(filename);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        reloadDebounce.delete(filename);

        const fullPath = path.join(pluginsPath, filename);

        if (!fs.existsSync(fullPath)) {
          const pluginName = path.basename(filename, ".js");
          const { unloadPlugin } = require("./src/lib/plugins");
          const result = unloadPlugin(pluginName);
          if (result.success) {
            logger.warn("Plugin removed", filename);
          }
          return;
        }

        try {
          const { hotReloadPlugin } = require("./src/lib/plugins");
          const result = hotReloadPlugin(fullPath);
          
          if (result.success) {
            // logger.success("Reloaded", result.name);
          } else {
             logger.error("Reload failed", `${filename}: ${result.error}`);
          }
        } catch (error) {
          logger.error("Reload failed", `${filename}: ${error.message}`);
        }
      }, 500);

      reloadDebounce.set(filename, timeout);
    },
  );

  logger.debug("Watching", pluginsPath);
}

/**
 * Watcher untuk src/lib dengan hot reload
 */
let srcWatcher = null;

function startSrcWatcher(srcPath) {
  if (srcWatcher) {
    srcWatcher.close();
  }

  logger.system("Dev Mode", "Src hot reload enabled");

  srcWatcher = fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const existingTimeout = reloadDebounce.get("src_" + filename);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      reloadDebounce.delete("src_" + filename);

      const fullPath = path.join(srcPath, filename);

      if (!fs.existsSync(fullPath)) {
        logger.warn("Src file removed", filename);
        return;
      }

      try {
        // Clear cache untuk file tersebut
        delete require.cache[require.resolve(fullPath)];
        logger.success("Src reloaded", filename);
      } catch (error) {
        logger.error("Src reload failed", `${filename}: ${error.message}`);
      }
    }, 500);

    reloadDebounce.set("src_" + filename, timeout);
  });

  logger.debug("Watching", srcPath);
}

/**
 * Setup anti-crash handlers
 */
function setupAntiCrash() {
  process.on("uncaughtException", (error, origin) => {
    const ignoredErrors = [
      'write EOF',
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'read ECONNRESET'
    ];
    
    const isIgnored = ignoredErrors.some(msg => 
      error.message?.includes(msg) || error.code === msg
    );
    
    if (isIgnored) {
      return;
    }
    
    logErrorBox("Uncaught Exception", error.message);
    if (config.dev?.debugLog) {
      console.error(c.gray(error.stack));
    }
    logger.info("SYSTEM", "Bot tetap berjalan...");
  });


  process.on("unhandledRejection", (reason, promise) => {
    logErrorBox("Unhandled Rejection", String(reason));
    if (config.dev?.debugLog) {
      console.error(c.gray("Promise:"), promise);
    }
    logger.info("SYSTEM", "Bot tetap berjalan...");
  });

  process.on("warning", (warning) => {
    logger.warn("SYSTEM", `${warning.name}: ${warning.message}`);
  });

  process.on("SIGINT", () => {
    console.log("");
    logger.system("SYSTEM", "SIGINT diterima");
    logger.info("DATABASE", "Menyimpan data...");

    try {
      const { getDatabase } = require("./src/lib/database");
      const db = getDatabase();
      db.save();
      logger.success("DATABASE", "Data tersimpan");
    } catch (error) {
      logger.warn("DATABASE", `Gagal menyimpan: ${error.message}`);
    }

    logger.info("SYSTEM", "Bot dihentikan");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("");
    logger.system("SYSTEM", "SIGTERM diterima");
    process.exit(0);
  });

  logger.success("SYSTEM", "Anti-crash aktif");
}

/**
 * Fungsi utama untuk memulai bot
 */
async function main() {
  printBanner();
  printStartup({
    name: config.bot?.name || "Ourin-AI",
    version: config.bot?.version || "1.0.0",
    developer: config.bot?.developer || "Developer",
    mode: config.mode || "public",
  });
  setupAntiCrash();
  divider();

  logger.info("DATABASE", "Memuat database...");
  const dbPath = path.join(
    process.cwd(),
    config.database?.path || "./database/main",
  );
  await initDatabase(dbPath);
  logger.success("DATABASE", "Database siap");

  const db = getDatabase();
  const savedMode = db.setting("botMode");
  if (savedMode && (savedMode === "self" || savedMode === "public")) {
    config.mode = savedMode;
    logger.info("MODE", `Mode bot: ${savedMode}`);
  }
  const savedPremium = db.setting("premiumUsers");
  if (Array.isArray(savedPremium)) {
    config.premiumUsers = savedPremium;
    logger.info("PREMIUM", `${savedPremium.length} user premium dimuat`);
  }
  const savedBanned = db.setting("bannedUsers");
  if (Array.isArray(savedBanned)) {
    config.bannedUsers = savedBanned;
    logger.info("BANNED", `${savedBanned.length} user banned dimuat`);
  }
  if (config.backup?.enabled !== false) {
    startAutoBackup(dbPath);
  }

  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = loadPlugins(pluginsPath);
  logger.success("PLUGINS", `${pluginCount} plugin dimuat`);
  logger.success("CASE", "Case handler aktif");
  
  if (config.dev?.enabled && config.dev?.watchPlugins) {
    startDevWatcher(pluginsPath);
  }
  if (config.dev?.enabled && config.dev?.watchSrc) {
    const srcPath = path.join(process.cwd(), "src");
    startSrcWatcher(srcPath);
  }

  initScheduler(config);
  logger.success("SCHEDULE", "Scheduler siap");

  const bootTime = Date.now() - startTime;
  logger.success("BOOT", `Selesai dalam ${bootTime}ms`);
  divider();
  logger.info("WA", "Menghubungkan ke WhatsApp...");
  console.log("");

  await startConnection({
    onRawMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiTagSW(msg, sock, db);
      } catch (error) {}
    },

    onMessage: async (msg, sock) => {
      try {
        const handlerPromise = messageHandler(msg, sock);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Handler timeout")), 60000),
        );
        await Promise.race([handlerPromise, timeoutPromise]);
      } catch (error) {
        if (error.message !== "Handler timeout") {
          logger.error("HANDLER", error.message);
          if (config.dev?.debugLog) {
            console.error(c.gray(error.stack));
          }
        }
      }
    },

    onGroupUpdate: async (update, sock) => {
      try {
        await groupHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onMessageUpdate: async (updates, sock) => {
      try {
        await messageUpdateHandler(updates, sock);
      } catch (error) {
        logger.error("MSG", error.message);
      }
    },

    onGroupSettingsUpdate: async (update, sock) => {
      try {
        await groupSettingsHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onConnectionUpdate: async (update, sock) => {
      if (update.connection === "open") {
        logConnection("connected", sock.user?.name || "Bot");
        logger.success("READY", "Bot siap menerima pesan!");
        loadScheduledMessages(sock);
        startGroupScheduleChecker(sock);
        startSewaChecker(sock);
        initScheduler(config, sock);
        initAutoJpmScheduler(sock);
        initSholatScheduler(sock);
        try {
          const { initSahurCron } = require('./plugins/religi/autosahur');
          initSahurCron(sock);
        } catch (e) {
          logger.error('AutoSahur', `Failed to init: ${e.message}`);
        }
        try {
          if (startOrderPoller) startOrderPoller(sock);
        } catch {}
        // otpPoller usage excluded
        
        try {
            const { getAllJadibotSessions, restartJadibotSession } = require('./src/lib/jadibotManager');
            const sessions = getAllJadibotSessions();
            if (sessions.length > 0) {
                logger.info('JADIBOT', `Memulihkan ${sessions.length} sesi...`);
                for (const session of sessions) {
                    await restartJadibotSession(sock, session.id);
                }
            }
        } catch (e) {
            logger.error('JADIBOT', `Gagal memulihkan sesi: ${e.message}`);
        }

        if (config.dev?.enabled) {
          logger.info("DEV", "Mode development aktif");
        }
        divider();
      }
    },
  });
}

main().catch((error) => {
  logErrorBox("Fatal Error", error.message);
  console.error(c.gray(error.stack));
  process.exit(1);
});
