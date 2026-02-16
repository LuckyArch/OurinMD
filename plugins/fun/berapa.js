const pluginConfig = {
    name: 'berapa',
    alias: ['howmuch', 'howmany'],
    category: 'fun',
    description: 'Tanya bot berapa sesuatu',
    usage: '.berapa <pertanyaan>',
    example: '.berapa umur jodohku?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    '1',
    '7',
    '12',
    '21',
    '99',
    '69',
    '100',
    '50',
    '25',
    '1000',
    '5',
    '17',
    '88',
    '33',
    '42 (jawabannya selalu 42)',
    'Banyak banget!',
    'Cuma sedikit.',
    'Tak terhitung!',
    'Hmm, sekitar 10-an.',
    'Lebih dari yang kamu kira!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`🔢 *ʙᴇʀᴀᴘᴀ*\n\n> Masukkan pertanyaan!\n\n*Contoh:*\n> .berapa umur jodohku?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`🔢 *ᴘᴇʀᴛᴀɴʏᴀᴀɴ*\n> ${text}\n\n🎱 *ᴊᴀᴡᴀʙᴀɴ*\n> ${answer}`);
}

module.exports = {
    config: pluginConfig,
    handler
};
