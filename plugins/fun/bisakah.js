const pluginConfig = {
    name: 'bisakah',
    alias: ['bisa'],
    category: 'fun',
    description: 'Tanya bot bisakah sesuatu',
    usage: '.bisakah <pertanyaan>',
    example: '.bisakah aku lulus ujian?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'Bisa banget! Percaya diri aja!',
    'Hmm, kayaknya susah deh.',
    'Tentu bisa! Semangat!',
    'Nggak bisa, maaf.',
    'Mungkin bisa, kalau usaha keras.',
    'Pasti bisa! Jangan menyerah!',
    'Agak susah sih, tapi bisa dicoba.',
    'Bisa kok! Yakin deh!',
    'Kayaknya nggak deh.',
    'Bisa! Ayo buktikan!',
    'Hmm... aku ragu.',
    'Bisa banget! Gas terus!',
    'Nggak bisa, coba yang lain.',
    'Bisa! Percaya sama diri sendiri!',
    'Susah, tapi bukan berarti nggak mungkin.',
    'Absolutely! Kamu pasti bisa!',
    'Kayaknya perlu usaha ekstra nih.',
    'Bisa! Jangan ragukan dirimu!',
    'Hmm, coba lagi nanti deh.',
    'Bisa! Aku percaya kamu!'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`💪 *ʙɪsᴀᴋᴀʜ*\n\n> Masukkan pertanyaan!\n\n*Contoh:*\n> .bisakah aku lulus ujian?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`💪 *ᴘᴇʀᴛᴀɴʏᴀᴀɴ*\n> ${text}\n\n🎱 *ᴊᴀᴡᴀʙᴀɴ*\n> ${answer}`);
}

module.exports = {
    config: pluginConfig,
    handler
};
