const axios = require('axios');
const fs = require('fs');

const pluginConfig = {
    name: 'allquotes',
    alias: [
        'dilan', 'quotesdilan',
        'bucin', 'quotesbucin',
        'quotesanime',
        'quotesislamic',
        'faktaunik',
        'katasenja',
        'katailham',
        'quotes',
        'puisi',
        'pantun',
        'motivasi'
    ],
    category: 'quotes',
    description: 'Kumpulan fitur quotes random',
    usage: '.<command>',
    isGroup: false,
    isBotAdmin: false,
    isAdmin: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
};

async function fetchJson(url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e) {
        throw new Error(`Error fetching data: ${e.message}`);
    }
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

async function handler(m, { sock }) {
    const command = m.command.toLowerCase();
    const baseUrl = 'https://raw.githubusercontent.com/Leoo7z/quotes/main/quotes-source/';

    try {
        switch (command) {
            case 'dilan':
            case 'quotesdilan': {
                const data = await fetchJson(`${baseUrl}quotesdilan.json`);
                const item = pickRandom(data);
                m.reply(item.quotes);
            }
            break;

            case 'bucin':
            case 'quotesbucin': {
                const data = await fetchJson(`${baseUrl}bucin.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;

            case 'quotesanime': {
                const data = await fetchJson(`${baseUrl}quotesanime.json`);
                const item = pickRandom(data);
                const text = `*Quotes Anime*\n\n"${item.quotes}"\n\n*${item.char_name}*\n_${item.anime} (${item.episode})_\n_${item.date || ''}_`;
                m.reply(text);
            }
            break;

            case 'quotesislamic': {
                const data = await fetchJson(`${baseUrl}quotesislamic.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;

            case 'faktaunik': {
                const data = await fetchJson(`${baseUrl}faktaunik.json`);
                const item = pickRandom(data);
                m.reply(`*Taukah Kamu?*\n\n${item}`);
            }
            break;

            case 'katasenja': {
                const data = await fetchJson(`${baseUrl}katasenja.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;

            case 'katailham': {
                const data = await fetchJson(`${baseUrl}katailham.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;

            case 'quotes': {
                const data = await fetchJson(`${baseUrl}quotes.json`);
                const item = pickRandom(data);
                m.reply(`${item.quotes}\n\nBy ${item.author}`);
            }
            break;

            case 'puisi': {
                const data = await fetchJson(`${baseUrl}puisi.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;

            case 'pantun': {
                const data = await fetchJson(`${baseUrl}pantun.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;

            case 'motivasi': {
                const data = await fetchJson(`${baseUrl}motivasi.json`);
                const item = pickRandom(data);
                m.reply(item);
            }
            break;
        }
    } catch (e) {
        console.error('Quotes Error:', e);
        m.reply('❌ Gagal mengambil data. Coba lagi nanti.');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
