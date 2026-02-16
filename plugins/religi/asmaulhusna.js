const { getRandomItem, getItemByIndex, searchItem, getAllData } = require('../../src/lib/gameData');

const pluginConfig = {
    name: 'asmaulhusna',
    alias: ['asmaul', 'husna', '99names'],
    category: 'religi',
    description: '99 Nama Allah (Asmaul Husna)',
    usage: '.asmaulhusna [nomor/nama]',
    example: '.asmaulhusna 1\n.asmaulhusna ar rahman',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

async function handler(m) {
    const query = m.args.join(' ').trim();
    
    let name;
    
    if (!query) {
        name = getRandomItem('asmaulhusna.json');
    } else if (/^\d+$/.test(query)) {
        const index = parseInt(query);
        if (index < 1 || index > 99) {
            await m.reply('❌ Nomor harus antara 1-99!');
            return;
        }
        name = getItemByIndex('asmaulhusna.json', index);
    } else if (query.toLowerCase() === 'all' || query.toLowerCase() === 'semua') {
        const allNames = getAllData('asmaulhusna.json');
        let text = `☪️ *ASMAUL HUSNA*\n`;
        text += `> 99 Nama Allah SWT\n\n`;
        text += `\`\`\``;
        
        for (const n of allNames.slice(0, 33)) {
            text += `${n.index}. ${n.latin}\n`;
        }
        
        text += `\`\`\`\n`;
        text += `> Halaman 1/3\n\n`;
        text += `_Gunakan .asmaulhusna [nomor] untuk detail_`;
        
        await m.reply(text);
        return;
    } else {
        name = searchItem('asmaulhusna.json', query, 'latin');
    }
    
    if (!name) {
        await m.reply('❌ Nama tidak ditemukan!\n_Coba nomor 1-99 atau nama latin_');
        return;
    }
    
    let text = `☪️ *ASMAUL HUSNA*\n\n`;
    text += `\`\`\``;
    text += `📍 Nomor : ${name.index}\n`;
    text += `🔤 Latin : ${name.latin}\n`;
    text += `📜 Arab  : ${name.arabic}`;
    text += `\`\`\`\n\n`;
    text += `> 🇮🇩 Arti (ID): ${name.translation_id}\n`;
    text += `> 🇬🇧 Arti (EN): ${name.translation_en}`;
    
    await m.reply(text);
}

module.exports = {
    config: pluginConfig,
    handler
};
