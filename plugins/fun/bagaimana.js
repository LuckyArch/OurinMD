const pluginConfig = {
    name: 'bagaimana',
    alias: ['gimana', 'how'],
    category: 'fun',
    description: 'Tanya bot bagaimana sesuatu',
    usage: '.bagaimana <pertanyaan>',
    example: '.bagaimana cara jadi sukses?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const answers = [
    'Caranya gampang, ya tinggal dilakuin aja!',
    'Hmm, susah dijelasin sih. Coba aja dulu!',
    'Dengan usaha dan doa pastinya.',
    'Ya begitulah caranya.',
    'Aku kurang tau sih, coba cari referensi lain.',
    'Pelan-pelan aja, nanti juga bisa.',
    'Dengan kerja keras dan pantang menyerah!',
    'Pertama, percaya sama diri sendiri dulu.',
    'Hmm, tiap orang beda-beda sih caranya.',
    'Ikutin kata hatimu aja.',
    'Belajar dari yang sudah berpengalaman.',
    'Step by step, jangan terburu-buru.',
    'Dengan tekad yang kuat!',
    'Mulai dari yang kecil dulu.',
    'Konsisten aja, nanti juga bisa.',
    'Jangan overthinking, langsung action!',
    'Gampang! Tinggal mulai aja!',
    'Caranya? Ya dicoba dulu!',
    'Dengan strategi yang tepat.',
    'Hmm, aku juga masih belajar sih.'
];

async function handler(m) {
    const text = m.text?.trim();
    
    if (!text) {
        return m.reply(`📋 *ʙᴀɢᴀɪᴍᴀɴᴀ*\n\n> Masukkan pertanyaan!\n\n*Contoh:*\n> .bagaimana cara jadi sukses?`);
    }
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    
    await m.reply(`📋 *ᴘᴇʀᴛᴀɴʏᴀᴀɴ*\n> ${text}\n\n🎱 *ᴊᴀᴡᴀʙᴀɴ*\n> ${answer}`);
}

module.exports = {
    config: pluginConfig,
    handler
};
