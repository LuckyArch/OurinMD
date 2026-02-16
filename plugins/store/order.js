const { getDatabase } = require("../../src/lib/database");
const pakasir = require("../../src/lib/pakasir");
const orderPoller = require("../../src/lib/orderPoller");
const QRCode = require("qrcode");
const timeHelper = require("../../src/lib/timeHelper");

const pluginConfig = {
  name: "order",
  alias: ["beli", "pesan", "buy"],
  category: "store",
  description: "Buat order produk",
  usage: ".order <nomor_produk> [jumlah]",
  example: ".order 1 2",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 10,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();
  const groupData = db.getGroup(m.chat) || {};

  if (groupData.botMode !== "store") {
    return m.reply(`❌ Fitur ini hanya tersedia di mode *STORE*!`);
  }

  const products = groupData.storeConfig?.products || [];
  const isAutoorder = groupData.storeConfig?.autoorder || false;

  if (products.length === 0) {
    return m.reply(
      `❌ Belum ada produk!\n\n> Admin: \`${m.prefix}addproduct\``,
    );
  }

  const args = m.text?.trim().split(/\s+/) || [];
  const productIdx = parseInt(args[0]) - 1;
  const qty = parseInt(args[1]) || 1;

  if (isNaN(productIdx) || productIdx < 0 || productIdx >= products.length) {
    let txt = `⚠️ *ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ*\n\n`;
    products.forEach((p, i) => {
      txt += `*${i + 1}.* ${p.name} - Rp ${p.price.toLocaleString("id-ID")}\n`;
    });
    txt += `\n> Contoh: \`${m.prefix}order 1\``;
    return m.reply(txt);
  }

  const product = products[productIdx];

  if (product.stock !== -1 && product.stock < qty) {
    return m.reply(`❌ Stok tidak cukup!\n\n> Tersedia: ${product.stock}`);
  }

  const total = product.price * qty;
  const orderId = pakasir.generateOrderId();

  let previewTxt = `📦 *ᴍᴇᴍʙᴜᴀᴛ ᴘᴇsᴀɴᴀɴ...*\n\n`;
  previewTxt += `> *Produk:* ${product.name}\n`;
  previewTxt += `> *Harga:* Rp ${product.price.toLocaleString("id-ID")}\n`;
  previewTxt += `> *Jumlah:* ${qty}\n`;
  previewTxt += `> *Total:* Rp ${total.toLocaleString("id-ID")}\n`;
  if (product.description) {
    previewTxt += `\n📝 *Deskripsi:*\n${product.description}\n`;
  }

  if (product.image) {
    await sock.sendMessage(
      m.chat,
      {
        image: { url: product.image },
        caption: previewTxt,
      },
      { quoted: m },
    );
  } else if (product.video) {
    await sock.sendMessage(
      m.chat,
      {
        video: { url: product.video },
        caption: previewTxt,
      },
      { quoted: m },
    );
  } else {
    await m.reply(previewTxt);
  }

  await m.reply(`⏳ *ᴍᴇɴɢɢᴇɴᴇʀᴀᴛᴇ ᴘᴇᴍʙᴀʏᴀʀᴀɴ...*`);

  try {
    const orderData = {
      groupId: m.chat,
      buyerJid: m.sender,
      buyerName: m.pushName || m.sender.split("@")[0],
      items: [
        {
          id: product.id,
          name: product.name,
          qty,
          price: product.price,
        },
      ],
      total,
      status: "pending",
      paymentMethod: null,
      paymentNumber: null,
      expiredAt: null,
      productDetail: product.detail || null,
      productImage: product.image || null,
      productDescription: product.description || null,
    };

    console.log("[Order] Debug:", {
      isAutoorder,
      pakasirEnabled: pakasir.isEnabled(),
      storeConfig: groupData.storeConfig,
    });

    if (isAutoorder && pakasir.isEnabled()) {
      const method = pakasir.getConfig().defaultMethod || "qris";
      console.log("[Order] Creating Pakasir transaction:", {
        method,
        total,
        orderId,
      });
      const payment = await pakasir.createTransaction(method, total, orderId);
      console.log(
        "[Order] Pakasir response:",
        JSON.stringify(payment, null, 2),
      );

      orderData.paymentMethod = payment.payment_method;
      orderData.paymentNumber = payment.payment_number;
      orderData.expiredAt = payment.expired_at;
      orderData.fee = payment.fee || 0;
      orderData.totalPayment = payment.total_payment || total;

      orderPoller.createOrder(orderId, orderData);

      if (product.stock !== -1) {
        products[productIdx].stock -= qty;
        db.setGroup(m.chat, groupData);
      }

      let invoiceText = `🛒 *ɪɴᴠᴏɪᴄᴇ ᴏʀᴅᴇʀ*\n\n`;
      invoiceText += `> Order ID: \`${orderId}\`\n`;
      invoiceText += `> Pembeli: @${m.sender.split("@")[0]}\n`;
      invoiceText += `━━━━━━━━━━━━━━━\n\n`;
      invoiceText += `📦 *ɪᴛᴇᴍ:*\n`;
      invoiceText += `> ${product.name} x${qty}\n`;
      invoiceText += `> Rp ${product.price.toLocaleString("id-ID")} × ${qty}\n\n`;
      invoiceText += `💰 *ᴛᴏᴛᴀʟ:* Rp ${total.toLocaleString("id-ID")}\n`;
      if (orderData.fee) {
        invoiceText += `💳 *ꜰᴇᴇ:* Rp ${orderData.fee.toLocaleString("id-ID")}\n`;
        invoiceText += `💵 *ʙᴀʏᴀʀ:* Rp ${orderData.totalPayment.toLocaleString("id-ID")}\n`;
      }
      invoiceText += `\n━━━━━━━━━━━━━━━\n`;
      invoiceText += `📱 *ᴍᴇᴛᴏᴅᴇ:* ${payment.payment_method?.toUpperCase() || "QRIS"}\n`;

      if (payment.payment_method === "qris" && payment.payment_number) {
        invoiceText += `\n> Scan QR di bawah untuk bayar\n`;
        invoiceText += `> ⏰ Expired: ${timeHelper.fromTimestamp(payment.expired_at, "DD MMMM YYYY HH:mm:ss")}`;

        try {
          const qrBuffer = await QRCode.toBuffer(payment.payment_number, {
            type: "png",
            width: 300,
            margin: 2,
          });

          await sock.sendMessage(
            m.chat,
            {
              image: qrBuffer,
              caption: invoiceText,
              mentions: [m.sender],
            },
            { quoted: m },
          );
        } catch (qrErr) {
          invoiceText += `\n\n📝 *ᴋᴏᴅᴇ ǫʀ:*\n\`\`\`${payment.payment_number.substring(0, 100)}...\`\`\``;
          await m.reply(invoiceText, { mentions: [m.sender] });
        }
      } else {
        invoiceText += `\n📝 *ɴᴏᴍᴏʀ ᴠᴀ:* \`${payment.payment_number}\`\n`;
        invoiceText += `> ⏰ Expired: ${timeHelper.fromTimestamp(payment.expired_at, "DD MMMM YYYY HH:mm:ss")}`;
        await m.reply(invoiceText, { mentions: [m.sender] });
      }

      m.react("🛒");
    } else {
      orderData.status = "waiting_confirm";
      orderPoller.createOrder(orderId, orderData);

      if (product.stock !== -1) {
        products[productIdx].stock -= qty;
        db.setGroup(m.chat, groupData);
      }

      const config = require("../../config");
      let paymentInfo = "";
      if (config.store?.qris) {
        paymentInfo = `> QRIS: ${config.store.qris}\n`;
      }
      if (config.store?.payment?.length) {
        config.store.payment.forEach((p) => {
          paymentInfo += `> ${p.name}: ${p.number} (${p.holder})\n`;
        });
      }

      let txt = `🛒 *ᴏʀᴅᴇʀ ᴅɪʙᴜᴀᴛ*\n\n`;
      txt += `> Order ID: \`${orderId}\`\n`;
      txt += `> Pembeli: @${m.sender.split("@")[0]}\n`;
      txt += `━━━━━━━━━━━━━━━\n\n`;
      txt += `📦 *ɪᴛᴇᴍ:*\n`;
      txt += `> ${product.name} x${qty}\n\n`;
      txt += `💰 *ᴛᴏᴛᴀʟ:* Rp ${total.toLocaleString("id-ID")}\n\n`;
      txt += `━━━━━━━━━━━━━━━\n`;
      txt += `💳 *ᴘᴇᴍʙᴀʏᴀʀᴀɴ:*\n`;
      txt += paymentInfo || "> Hubungi admin untuk info pembayaran\n";
      txt += `\n> Setelah bayar, admin akan konfirmasi dengan:\n`;
      txt += `> \`${m.prefix}confirmorder ${orderId}\``;

      await m.reply(txt, { mentions: [m.sender] });
      m.react("🛒");
    }
  } catch (err) {
    console.error("[Order] Error:", err);
    return m.reply(`❌ *ɢᴀɢᴀʟ ʙᴜᴀᴛ ᴏʀᴅᴇʀ*\n\n> ${err.message}`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
