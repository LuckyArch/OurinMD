const { getDatabase } = require("../../src/lib/database");
const timeHelper = require("../../src/lib/timeHelper");

const pluginConfig = {
  name: "listwarn",
  alias: ["warnings", "cekwarn", "warnlist"],
  category: "group",
  description: "Melihat daftar warning member",
  usage: ".listwarn atau .listwarn @user",
  example: ".listwarn @user",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  isAdmin: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  let groupData = db.getGroup(m.chat) || {};
  let warnings = groupData.warnings || {};

  let targetUser = null;
  if (m.quoted) {
    targetUser = m.quoted.sender;
  } else if (m.mentionedJid && m.mentionedJid.length > 0) {
    targetUser = m.mentionedJid[0];
  }

  if (targetUser) {
    // Show specific user warnings
    const userWarnings = warnings[targetUser] || [];
    const targetName = targetUser.split("@")[0];

    if (userWarnings.length === 0) {
      await m.reply(`✅ @${targetName} tidak memiliki warning.`, {
        mentions: [targetUser],
      });
      return;
    }

    let txt = `⚠️ *ᴡᴀʀɴɪɴɢ @${targetName}*\n\n`;
    txt += `> Total: *${userWarnings.length}/3*\n\n`;

    userWarnings.forEach((w, i) => {
      const date = timeHelper.fromTimestamp(w.time, "DD/MM/YYYY");
      txt += `*${i + 1}.* ${w.reason}\n`;
      txt += `   └ _${date}_\n`;
    });

    await m.reply(txt, { mentions: [targetUser] });
  } else {
    // Show all users with warnings
    const usersWithWarnings = Object.keys(warnings).filter(
      (u) => warnings[u].length > 0,
    );

    if (usersWithWarnings.length === 0) {
      await m.reply(`✅ Tidak ada member dengan warning di grup ini.`);
      return;
    }

    let txt = `⚠️ *ᴅᴀꜰᴛᴀʀ ᴡᴀʀɴɪɴɢ*\n\n`;

    usersWithWarnings.forEach((user, i) => {
      const count = warnings[user].length;
      const name = user.split("@")[0];
      txt += `*${i + 1}.* @${name} - *${count}/3* warning\n`;
    });

    txt += `\n> Ketik \`${m.prefix}listwarn @user\` untuk detail`;

    await m.reply(txt, { mentions: usersWithWarnings });
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
