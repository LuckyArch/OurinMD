const removebg = require('../../src/scraper/removebackground');
const fs = require('fs');
const path = require('path');

const pluginConfig = {
    name: 'removebg',
    alias: ['rmbg', 'nobg', 'hapusbg'],
    category: 'tools',
    description: 'Menghapus background gambar',
    usage: '.removebg (reply gambar)',
    example: '.removebg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && m.quoted.isImage);
        if (!isImage) {
            return await m.reply('❌ *ɢᴀᴍʙᴀʀ ᴅɪʙᴜᴛᴜʜᴋᴀɴ*\n\n> Reply atau kirim gambar dengan caption .removebg');
        }
        
        await m.reply('⏳ *ᴍᴇɴɢʜᴀᴘᴜs ʙᴀᴄᴋɢʀᴏᴜɴᴅ...*\n\n> Memproses gambar');
        
        let mediaBuffer;
        if (m.isImage && m.download) {
            mediaBuffer = await m.download();
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            mediaBuffer = await m.quoted.download();
        } else {
            return await m.reply('❌ Gagal mengunduh gambar');
        }
        
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            return await m.reply('❌ Buffer gambar tidak valid');
        }
        
        const tmpDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const tmpFile = path.join(tmpDir, `rmbg_${Date.now()}.jpg`);
        fs.writeFileSync(tmpFile, mediaBuffer);
        
        const result = await removebg(tmpFile);
        
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {}
        
        if (result.status === 'eror' || typeof result !== 'string') {
            return await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.msg || 'Tidak dapat menghapus background'}`);
        }
        
        const axios = require('axios');
        const imgRes = await axios.get(result, { responseType: 'arraybuffer' });
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(imgRes.data),
            caption: `✅ *ʙᴀᴄᴋɢʀᴏᴜɴᴅ ᴅɪʜᴀᴘᴜs*\n\n> Background gambar berhasil dihapus`
        }, { quoted: m });
        
    } catch (error) {
        console.error('[RemoveBG Error]', error);
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
