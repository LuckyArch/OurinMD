const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

const pluginConfig = {
  name: "fakeml",
  alias: ["mlbbfake", "mlcard", "mlfake"],
  category: "canvas",
  description: "Membuat fake ML profile card",
  usage: ".fakeml <nama> (reply/kirim foto)",
  example: ".fakeml Misaki",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

let fontRegistered = false;

async function handler(m, { sock }) {
  const name = m.text?.trim();

  if (!name) {
    return m.reply(
      `🎮 *ꜰᴀᴋᴇ ᴍʟ ᴘʀᴏꜰɪʟᴇ*\n\n` +
        `> Masukkan nama untuk profile\n\n` +
        `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
        `> 1. Kirim foto + caption \`${m.prefix}fakeml <nama>\`\n` +
        `> 2. Reply foto dengan \`${m.prefix}fakeml <nama>\``,
    );
  }

  let buffer = null;

  if (
    m.quoted &&
    (m.quoted.type === "imageMessage" || m.quoted.mtype === "imageMessage")
  ) {
    try {
      buffer = await m.quoted.download();
    } catch (e) {
      return m.reply(`❌ Gagal download gambar: ${e.message}`);
    }
  } else if (m.isMedia && m.type === "imageMessage") {
    try {
      buffer = await m.download();
    } catch (e) {
      return m.reply(`❌ Gagal download gambar: ${e.message}`);
    }
  }

  if (!buffer) {
    return m.reply(`❌ Kirim/reply gambar untuk dijadikan avatar!`);
  }

  m.react("🎮");
  await m.reply(`⏳ *ᴍᴇᴍᴘʀᴏsᴇs ꜰᴀᴋᴇ ᴍʟ...*`);

  try {
    const fontPath = path.join(process.cwd(), "assets/fonts/arialnarrow.ttf");

    if (!fontRegistered && fs.existsSync(fontPath)) {
      try {
        GlobalFonts.registerFromPath(fontPath, "CustomFont");
        fontRegistered = true;
      } catch (e) {
        console.log("[FakeML] Font registration failed:", e.message);
      }
    }

    const userImage = await loadImage(buffer);
    const bg = await loadImage(
      "https://cdn.gimita.id/download/liplnf_1769441635044_cf827938.jpg",
    );
    const frameOverlay = await loadImage(
      "https://cdn.gimita.id/download/2vm2lt_1769441592358_16db3286.png",
    );

    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    const avatarSize = 205;
    const frameSize = 293;
    const centerX = (canvas.width - frameSize) / 2;
    const centerY = (canvas.height - frameSize) / 2 - 282;
    const avatarX = centerX + (frameSize - avatarSize) / 2;
    const avatarY = centerY + (frameSize - avatarSize) / 2 - 3;

    const { width, height } = userImage;
    const minSide = Math.min(width, height);
    const cropX = (width - minSide) / 2;
    const cropY = (height - minSide) / 2;

    ctx.drawImage(
      userImage,
      cropX,
      cropY,
      minSide,
      minSide,
      avatarX,
      avatarY,
      avatarSize,
      avatarSize,
    );
    ctx.drawImage(frameOverlay, centerX, centerY, frameSize, frameSize);

    const maxFontSize = 36;
    const minFontSize = 24;
    const maxChar = 11;
    let fontSize = maxFontSize;
    if (name.length > maxChar) {
      const excess = name.length - maxChar;
      fontSize -= excess * 2;
      if (fontSize < minFontSize) fontSize = minFontSize;
    }

    const fontFamily = fontRegistered ? "CustomFont" : "Arial";
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(name, canvas.width / 2 + 13, centerY + frameSize + 15);

    const resultBuffer = canvas.toBuffer("image/png");

    await sock.sendMessage(
      m.chat,
      {
        image: resultBuffer,
        caption: `🎮 *ꜰᴀᴋᴇ ᴍʟ ᴘʀᴏꜰɪʟᴇ*\n\n> Nama: *${name}*`,
      },
      { quoted: m },
    );

    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
