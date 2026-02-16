const { getRandomItem } = require('../../src/lib/gameData');
const { fetchBuffer } = require('../../src/lib/functions');

const pluginConfig = {
    name: 'renungan',
    alias: ['motivasi', 'mutiara'],
    category: 'fun',
    description: 'Random gambar renungan/motivasi',
    usage: '.renungan',
    example: '.renungan',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const imageUrl = getRandomItem('renungan.json');
    
    if (!imageUrl) {
        await m.reply('❌ Data tidak tersedia!');
        return;
    }
    
    try {
        const imageBuffer = await fetchBuffer(imageUrl);
        
        let caption = `🌸 *RENUNGAN*\n\n`;
        caption += `_Semoga bermanfaat_ 🙏`;
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: caption
        }, { quoted: m });
    } catch (error) {
        await m.reply('❌ Gagal mengambil gambar. Coba lagi!');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
