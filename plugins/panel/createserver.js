const axios = require("axios");
const crypto = require("crypto");
const config = require("../../config");
const { isLid, lidToJid } = require("../../src/lib/lidHelper");
const { checkPanelJeda, setPanelLastUsed } = require("../../src/lib/panelJeda");
const {
  hasAccessToServer,
  getUserRole,
  VALID_SERVERS,
} = require("../../src/lib/cpanelRoles");
const timeHelper = require("../../src/lib/timeHelper");
const fs = require("fs");

const RAM_OPTIONS = [
  "1gb",
  "2gb",
  "3gb",
  "4gb",
  "5gb",
  "6gb",
  "7gb",
  "8gb",
  "9gb",
  "10gb",
  "unli",
];
const SERVER_VERSIONS = ["v1", "v2", "v3", "v4", "v5"];

const allCommands = [];
RAM_OPTIONS.forEach((ram) => {
  SERVER_VERSIONS.forEach((ver) => {
    allCommands.push(`${ram}${ver}`);
  });
});

const pluginConfig = {
  name: allCommands,
  alias: ["unlimited"],
  category: "panel",
  description: "Create server panel dengan spesifikasi RAM (v1-v5)",
  usage: ".1gbv1 username atau .1gbv2 username,628xxx",
  example: ".2gbv1 myserver,628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

const RAM_SPECS = {
  "1gb": { ram: 1024, cpu: 70, disk: 1024 },
  "2gb": { ram: 2048, cpu: 80, disk: 2048 },
  "3gb": { ram: 3072, cpu: 90, disk: 2048 },
  "4gb": { ram: 4096, cpu: 100, disk: 4096 },
  "5gb": { ram: 5120, cpu: 110, disk: 5120 },
  "6gb": { ram: 6144, cpu: 120, disk: 6144 },
  "7gb": { ram: 7168, cpu: 130, disk: 7168 },
  "8gb": { ram: 8192, cpu: 140, disk: 8192 },
  "9gb": { ram: 9216, cpu: 150, disk: 9216 },
  "10gb": { ram: 10240, cpu: 160, disk: 10240 },
  unli: { ram: 0, cpu: 0, disk: 0 },
  unlimited: { ram: 0, cpu: 0, disk: 0 },
};

function cleanJid(jid) {
  if (!jid) return null;
  if (isLid(jid)) jid = lidToJid(jid);
  return jid.includes("@") ? jid : jid + "@s.whatsapp.net";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate() {
  return timeHelper.formatDateTime("D MMMM YYYY HH:mm");
}

function parseCommand(cmd) {
  const match = cmd.match(/^(\d+gb|unli)(v[1-5])$/i);
  if (!match) return null;
  return {
    ram: match[1].toLowerCase(),
    server: match[2].toLowerCase(),
    serverKey: "s" + match[2].toLowerCase().replace("v", ""),
  };
}

function getServerConfig(pteroConfig, serverKey) {
  const serverConfigs = {
    s1: pteroConfig.server1,
    s2: pteroConfig.server2,
    s3: pteroConfig.server3,
    s4: pteroConfig.server4,
    s5: pteroConfig.server5,
  };
  return serverConfigs[serverKey] || null;
}

function validateServerConfig(serverConfig) {
  const missing = [];
  if (!serverConfig?.domain) missing.push("domain");
  if (!serverConfig?.apikey) missing.push("apikey (PTLA)");
  return missing;
}

function getAvailableServers(pteroConfig) {
  const available = [];
  if (pteroConfig.server1?.domain && pteroConfig.server1?.apikey)
    available.push("v1");
  if (pteroConfig.server2?.domain && pteroConfig.server2?.apikey)
    available.push("v2");
  if (pteroConfig.server3?.domain && pteroConfig.server3?.apikey)
    available.push("v3");
  if (pteroConfig.server4?.domain && pteroConfig.server4?.apikey)
    available.push("v4");
  if (pteroConfig.server5?.domain && pteroConfig.server5?.apikey)
    available.push("v5");
  return available;
}

async function handler(m, { sock }) {
  const pteroConfig = config.pterodactyl;

  const parsed = parseCommand(m.command);
  if (!parsed) {
    return m.reply(`❌ Format command tidak valid.`);
  }

  const { ram, server: serverVersion, serverKey } = parsed;

  if (!hasAccessToServer(m.sender, serverVersion, m.isOwner)) {
    const userRole = getUserRole(m.sender, serverVersion);
    return m.reply(
      `❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n` +
        `> Kamu tidak punya akses ke *${serverVersion.toUpperCase()}*\n` +
        `> Role kamu di ${serverVersion.toUpperCase()}: *${userRole || "Tidak ada"}*\n\n` +
        `> Hubungi admin untuk mendapat akses.`,
    );
  }

  const jedaCheck = checkPanelJeda(m);
  if (!jedaCheck.allowed) {
    return m.reply(jedaCheck.message);
  }

  const serverConfig = getServerConfig(pteroConfig, serverKey);
  const missingConfig = validateServerConfig(serverConfig);

  if (missingConfig.length > 0) {
    const available = getAvailableServers(pteroConfig);
    let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverVersion.toUpperCase()} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`;
    if (available.length > 0) {
      txt += `> Server tersedia: *${available.join(", ")}*\n`;
      txt += `> Contoh: \`${m.prefix}${ram}${available[0]} username\``;
    } else {
      txt += `> Isi config pterodactyl di \`config.js\``;
    }
    return m.reply(txt);
  }

  let targetUser = null;
  let username = null;
  const argStr = m.text?.trim() || "";

  if (argStr.includes(",")) {
    const parts = argStr.split(",");
    username = parts[0]?.trim().toLowerCase();
    let nomor = parts[1]?.trim().replace(/[^0-9]/g, "");
    if (nomor) targetUser = nomor + "@s.whatsapp.net";
  } else if (argStr) {
    username = argStr.trim().toLowerCase();
  }

  if (!username) {
    const available = getAvailableServers(pteroConfig);
    const userRole = getUserRole(m.sender, serverVersion) || "Guest";
    return m.reply(
      `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
        `> \`${m.prefix}${m.command} username\`\n` +
        `> \`${m.prefix}${m.command} username,628xxx\`\n` +
        `> Reply/tag pesan user\n\n` +
        `> Server: *${serverVersion.toUpperCase()}*\n` +
        `> Role kamu: *${capitalize(userRole)}*\n` +
        `> Server tersedia: *${available.join(", ") || "none"}*`,
    );
  }

  if (!/^[a-z0-9_]{3,16}$/.test(username)) {
    return m.reply(
      `❌ Username hanya boleh huruf kecil, angka, underscore (3-16 karakter).`,
    );
  }

  if (!targetUser) {
    if (m.quoted?.sender) {
      targetUser = cleanJid(m.quoted.sender);
    } else if (m.mentionedJid?.length > 0) {
      targetUser = cleanJid(m.mentionedJid[0]);
    } else {
      targetUser = cleanJid(m.sender);
    }
  }

  if (!targetUser) {
    return m.reply(`❌ Tidak dapat menentukan nomor target.`);
  }

  try {
    const [onWa] = await sock.onWhatsApp(targetUser.split("@")[0]);
    if (!onWa?.exists) {
      return m.reply(
        `❌ Nomor \`${targetUser.split("@")[0]}\` tidak terdaftar di WhatsApp!`,
      );
    }
  } catch (e) {
    return m.reply(`❌ Gagal validasi nomor WhatsApp.`);
  }

  const specs = RAM_SPECS[ram];
  if (!specs) {
    return m.reply(`❌ Paket tidak ditemukan.`);
  }

  const email = `${username}@ourin.md`;
  const name = capitalize(username) + " Server";
  const password = username + crypto.randomBytes(3).toString("hex");
  const serverLabel = serverVersion.toUpperCase();

  await m.reply(
    `🛠️ *ᴍᴇᴍʙᴜᴀᴛ ᴀᴋᴜɴ ᴘᴀɴᴇʟ...*\n\n> Server: *${serverLabel}*\n> Username: \`${username}\`\n> Target: \`${targetUser.split("@")[0]}\``,
  );

  try {
    const userRes = await axios.post(
      `${serverConfig.domain}/api/application/users`,
      {
        email,
        username,
        first_name: name,
        last_name: "Panel",
        language: "en",
        password,
      },
      {
        headers: {
          Authorization: `Bearer ${serverConfig.apikey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const user = userRes.data.attributes;

    const eggRes = await axios.get(
      `${serverConfig.domain}/api/application/nests/${serverConfig.nestid}/eggs/${serverConfig.egg}`,
      {
        headers: {
          Authorization: `Bearer ${serverConfig.apikey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const startupCmd = eggRes.data.attributes.startup;

    const serverRes = await axios.post(
      `${serverConfig.domain}/api/application/servers`,
      {
        name,
        description: `Created at ${formatDate()} [${serverLabel}]`,
        user: user.id,
        egg: parseInt(serverConfig.egg),
        docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: startupCmd,
        environment: {
          INST: "npm",
          USER_UPLOAD: "0",
          AUTO_UPDATE: "0",
          CMD_RUN: "npm start",
        },
        limits: {
          memory: specs.ram,
          swap: 0,
          disk: specs.disk,
          io: 500,
          cpu: specs.cpu,
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 5,
        },
        deploy: {
          locations: [parseInt(serverConfig.location)],
          dedicated_ip: false,
          port_range: [],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${serverConfig.apikey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const server = serverRes.data.attributes;

    const ramLabel = specs.ram === 0 ? "Unlimited" : `${specs.ram / 1000} GB`;
    const cpuLabel = specs.cpu === 0 ? "Unlimited" : `${specs.cpu}%`;
    const diskLabel =
      specs.disk === 0 ? "Unlimited" : `${specs.disk / 1000} GB`;

    let detailTxt = `✅ *ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n`;
    detailTxt += `╭─「 📋 *ᴅᴇᴛᴀɪʟ ᴀᴋᴜɴ* 」\n`;
    detailTxt += `┃ 🖥️ \`sᴇʀᴠᴇʀ\`: *${serverLabel}*\n`;
    detailTxt += `┃ 👤 \`ᴜsᴇʀɴᴀᴍᴇ\`: *${user.username}*\n`;
    detailTxt += `┃ 🔐 \`ᴘᴀssᴡᴏʀᴅ\`: *${password}*\n`;
    detailTxt += `┃ 🆔 \`sᴇʀᴠᴇʀ ɪᴅ\`: *${server.id}*\n`;
    detailTxt += `┃ 🗓️ \`ᴛᴀɴɢɢᴀʟ\`: *${formatDate()}*\n`;
    detailTxt += `╰───────────────\n\n`;
    detailTxt += `╭─「 🧠 *sᴘᴇsɪꜰɪᴋᴀsɪ* 」\n`;
    detailTxt += `┃ 💾 \`ʀᴀᴍ\`: *${ramLabel}*\n`;
    detailTxt += `┃ ⚡ \`ᴄᴘᴜ\`: *${cpuLabel}*\n`;
    detailTxt += `┃ 📦 \`ᴅɪsᴋ\`: *${diskLabel}*\n`;
    detailTxt += `╰───────────────\n\n`;
    detailTxt += `🌐 *ʟᴏɢɪɴ ᴘᴀɴᴇʟ:* ${serverConfig.domain}\n\n`;
    detailTxt += `⚠️ *Simpan data ini baik-baik!*\n`;
    detailTxt += `⚠️ *Jangan bagikan ke siapapun!*\n`;
    ((detailTxt += `⚠️ *Terima kasih udah order panel yak 👋*`),
      await sock.sendMessage(targetUser, {
        image: fs.readFileSync("./assets/images/ourin-v8.jpg"),
        caption: detailTxt,
        contextInfo: {
          mentionedJid: [targetUser],
          isForwarded: true,
          forwardingScore: 999,
        },
        interactiveButtons: [
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 Copy Username",
              copy_code: username,
            }),
          },
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "📋 Copy Password",
              copy_code: password,
            }),
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "🌐 Buka Panel",
              url: serverConfig.domain,
            }),
          },
        ],
        footer: `Panel Pterodactyl - ${serverConfig.domain}`,
      }));

    await setPanelLastUsed();

    await m.reply(
      `✅ *ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n> Server: *${serverLabel}*\n> Data telah dikirim ke \`${targetUser.split("@")[0]}\``,
    );
  } catch (err) {
    const errMsg = err?.response?.data?.errors?.[0]?.detail || err.message;
    return m.reply(`❌ *ɢᴀɢᴀʟ ᴍᴇᴍʙᴜᴀᴛ ᴘᴀɴᴇʟ*\n\n> ${errMsg}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
