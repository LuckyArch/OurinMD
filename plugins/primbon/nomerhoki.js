const axios = require('axios')

const pluginConfig = {
    name: 'nomerhoki',
    alias: ['nomorhoki', 'ceknomor'],
    category: 'primbon',
    description: 'Cek keberuntungan nomor HP',
    usage: '.nomerhoki <nomor>',
    example: '.nomerhoki 6285658939117',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let nomor = m.args.join('').replace(/[^0-9]/g, '')
    if (!nomor) {
        return m.reply(`🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*\n\n> Masukkan nomor HP\n\n\`Contoh: ${m.prefix}nomerhoki 6285658939117\``)
    }
    
    m.react('🍀')
    
    try {
        const url = `https://api.siputzx.my.id/api/primbon/nomorhoki?phoneNumber=${nomor}`
        const { data } = await axios.get(url, { timeout: 30000 })
        
        if (!data?.status || !data?.data) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gagal menganalisa nomor`)
        }
        
        const r = data.data
        const ep = r.energi_positif.details
        const en = r.energi_negatif.details
        
        const response = `🍀 *ɴᴏᴍᴏʀ ʜᴏᴋɪ*\n\n` +
            `> Nomor: *${r.nomor}*\n\n` +
            `📊 *ᴀɴɢᴋᴀ ʙᴀɢᴜᴀ:* ${r.angka_bagua_shuzi.value}%\n\n` +
            `✅ *ᴇɴᴇʀɢɪ ᴘᴏꜱɪᴛɪꜰ:* ${r.energi_positif.total}%\n` +
            `├ Kekayaan: ${ep.kekayaan}\n` +
            `├ Kesehatan: ${ep.kesehatan}\n` +
            `├ Cinta: ${ep.cinta}\n` +
            `└ Kestabilan: ${ep.kestabilan}\n\n` +
            `❌ *ᴇɴᴇʀɢɪ ɴᴇɢᴀᴛɪꜰ:* ${r.energi_negatif.total}%\n` +
            `├ Perselisihan: ${en.perselisihan}\n` +
            `├ Kehilangan: ${en.kehilangan}\n` +
            `├ Malapetaka: ${en.malapetaka}\n` +
            `└ Kehancuran: ${en.kehancuran}\n\n` +
            `> Status: ${r.analisis.status ? '✅ HOKI' : '❌ TIDAK HOKI'}`
        
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
