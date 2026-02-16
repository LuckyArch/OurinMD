const axios = require('axios')
const config = require('../../config')
const fs = require('fs')
const sharp = require('sharp')

const pluginConfig = {
    name: 'stickerpack',
    alias: ['sp', 'stickersearch', 'searchsticker'],
    category: 'sticker',
    description: 'Cari dan kirim sticker pack',
    usage: '.stickerpack <query>',
    example: '.stickerpack anime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 20,
    energi: 2,
    isEnabled: true
}

async function toWaWebp(buffer, animated = false) {
  return sharp(buffer, { animated })
    .resize(512, 512, { fit: 'inside' })
    .webp({ quality: 100 })
    .toBuffer()
}

class Sticker {
  async search(query, page = 1) {
    try {
      if (!query) {
        throw new Error('"query" nya isi mas');
      }
      
      const res = await axios.post(`https://getstickerpack.com/api/v1/stickerdb/search`, { query, page }).then(result => result.data);
      
      const data = res.data.map(item => ({
        name: item.title,
        slug: item.slug,
        url: `https://getstickerpack.com/stickers/${item.slug}`,
        image: `https://s3.getstickerpack.com/${item.cover_image ? item.cover_image : item.tray_icon_large}`,
        download: item.download_counter,
      }));
      
      return { status: true, data, total: res.meta.total };
    } catch(e) {
      return { status: false, msg: `eror: ${e.message}` };
    }
  }

  async detail(slug) {
    try {
      const match = slug.match(/stickers\/([a-zA-Z0-9-]+)$/);
      const id = match ? match[1] : slug;
      
      const res = await axios.get(`https://getstickerpack.com/api/v1/stickerdb/stickers/${id}`).then(result => result.data.data);

      const sticker = res.images.map(item => ({
        index: item.sticker_index,
        image: `https://s3.getstickerpack.com/${item.url}`,
        animated: item.is_animated !== 0 ? true : false,
      }));
      
      return {
        status: true,
        title: res.title,
        sticker
      };
    } catch(e) {
      return { status: false, msg: `eror: ${e.message}` };
    }
  }
}

const MAX_STICKERS = 20
const DOWNLOAD_DELAY = 700

async function downloadBuffer(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    return Buffer.from(res.data)
}

async function handler(m, { sock }) {
    const query = m.args?.join(' ')?.trim()

    if (!query) {
        return m.reply(
            `🎨 *sᴛɪᴄᴋᴇʀ ᴘᴀᴄᴋ*\n\n` +
            `> Cari dan kirim sticker pack!\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ${m.prefix}stickerpack <query>\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> ${m.prefix}stickerpack anime\n` +
            `> ${m.prefix}stickerpack bear\n` +
            `> ${m.prefix}stickerpack cat`
        )
    }

    await m.react('⏳')

    try {
        const api = new Sticker()
        const search = await api.search(query)

        if (!search.status || !search.data?.length) {
            await m.react('❌')
            return m.reply(`❌ Tidak ada sticker pack ditemukan untuk: *${query}*`)
        }

        const randPick = search.data[Math.floor(Math.random() * search.data.length)]
        const detail = await api.detail(randPick.url)

        if (!detail.status || !detail.sticker?.length) {
            await m.react('❌')
            return m.reply(`❌ Gagal mengambil detail sticker pack`)
        }

        const limited = detail.sticker.slice(0, MAX_STICKERS)

        const stickerBuffers = []
        for (const s of limited) {
        try {
            const buf = await downloadBuffer(s.image)
            const webp = await toWaWebp(buf, s.animated)
            stickerBuffers.push({ buffer: webp, animated: s.animated })
            await new Promise(r => setTimeout(r, DOWNLOAD_DELAY))
        } catch {
            continue
        }
        }

        if (!stickerBuffers.length) {
            await m.react('❌')
            return m.reply(`❌ Gagal mendownload sticker`)
        }

        let coverBuf
        try {
            coverBuf = stickerBuffers[0].buffer
        } catch {
            coverBuf = stickerBuffers[0].buffer
        }

        try {
            await sock.sendMessage(m.chat, {
                stickerPack: {
                    name: randPick.name,
                    publisher: config.bot?.developer || 'Bot',
                    description: `Created by: ${config.bot?.name || 'Bot'}`,
                    cover: coverBuf,
                    stickers: stickerBuffers.map(s => ({
                        sticker: s.buffer,
                        emojis: ['❤'],
                        accessibilityLabel: '',
                        isLottie: false,
                        isAnimated: s.animated
                    }))
                }
            })
            await m.react('✅')
        } catch (packErr) {
            console.error('[StickerPack] Pack send failed:', packErr.message)
            await m.reply(`⚠️ Sticker pack gagal, mengirim satu per satu...`)

            const packname = randPick.name || config.sticker?.packname || 'Ourin-AI'
            const author = config.bot?.developer || config.sticker?.author || 'Bot'
            let sent = 0

            for (const s of stickerBuffers) {
                try {
                    await sock.sendImageAsSticker(m.chat, s.buffer, m, { packname, author })
                    sent++
                    await new Promise(r => setTimeout(r, 500))
                } catch {
                    continue
                }
            }

            if (sent > 0) {
                await m.react('✅')
                await m.reply(`✅ Berhasil kirim ${sent} sticker dari "${randPick.name}"`)
            } else {
                await m.react('❌')
                await m.reply(`❌ Gagal mengirim sticker`)
            }
        }
    } catch (error) {
        console.error('[StickerPack] Error:', error.message)
        await m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
