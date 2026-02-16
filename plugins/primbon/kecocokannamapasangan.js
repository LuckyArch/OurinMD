const axios = require('axios')

const pluginConfig = {
    name: 'kecocokannamapasangan',
    alias: ['cocoknama', 'matchname'],
    category: 'primbon',
    description: 'Cek kecocokan nama pasangan',
    usage: '.kecocokannamapasangan <nama1> <nama2>',
    example: '.kecocokannamapasangan putu keyla',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    if (m.args.length < 2) {
        return m.reply(`💕 *ᴋᴇᴄᴏᴄᴏᴋᴀɴ ɴᴀᴍᴀ*\n\n> Format: nama1 nama2\n\n\`Contoh: ${m.prefix}kecocokannamapasangan putu keyla\``)
    }
    
    const [nama1, nama2] = m.args
    
    m.react('💕')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/kecocokan_nama_pasangan?nama1=${encodeURIComponent(nama1)}&nama2=${encodeURIComponent(nama2)}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal menganalisa`)
        }
        
        const result = data.data
        const response = `💕 *ᴋᴇᴄᴏᴄᴏᴋᴀɴ ɴᴀᴍᴀ ᴘᴀsᴀɴɢᴀɴ*\n\n` +
            `> 👤 ${result.nama_anda}\n` +
            `> 💑 ${result.nama_pasangan}\n\n` +
            `✅ *ꜱɪꜱɪ ᴘᴏꜱɪᴛɪꜰ:*\n${result.sisi_positif}\n\n` +
            `❌ *ꜱɪꜱɪ ɴᴇɢᴀᴛɪꜰ:*\n${result.sisi_negatif}\n\n` +
            `> _${result.catatan}_`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
