const axios = require('axios')

const BASE_URL = 'https://raw.githubusercontent.com/Leoo7z/Image-Source/main/image'

const SOURCES = {
    akiyama: 'akiyama', ana: 'ana', art: 'art', asuna: 'asuna', ayuzawa: 'ayuzawa',
    boneka: 'boneka', boruto: 'boruto', bts: 'bts', cecan: 'cecan', chiho: 'chiho',
    chitoge: 'chitoge', cogan: 'cogan', cosplay: 'cosplay', cosplayloli: 'cosplayloli',
    cosplaysagiri: 'cosplaysagiri', cyber: 'cyber', deidara: 'deidara', doraemon: 'doraemon',
    eba: 'eba', elaina: 'elaina', emilia: 'emilia', erza: 'erza', exo: 'exo',
    femdom: 'femdom', freefire: 'freefire', gamewallpaper: 'gamewallpaper', glasses: 'glasses',
    gremory: 'gremory', hacker: 'hekel', hestia: 'hestia', husbu: 'husbu', inori: 'inori',
    islamic: 'islamic', isuzu: 'isuzu', itachi: 'itachi', itori: 'itori', jennie: 'jeni',
    jiso: 'jiso', justina: 'justina',
    kaga: 'kaga', kagura: 'kagura', kakasih: 'kakasih', kaori: 'kaori', cartoon: 'kartun',
    shortquote: 'katakata', keneki: 'keneki', kotori: 'kotori', kpop: 'kpop', kucing: 'kucing',
    kurumi: 'kurumi', lisa: 'lisa', loli: 'loli', madara: 'madara', megumin: 'megumin',
    mikasa: 'mikasa', mikey: 'mikey', miku: 'miku', minato: 'minato', mobile: 'mobil',
    motor: 'motor', mountain: 'mountain', naruto: 'naruto', neko: 'neko', neko2: 'neko2',
    nekonime: 'nekonime', nezuko: 'nezuko', onepiece: 'onepiece',
    pentol: 'pentol', pokemon: 'pokemon', profil: 'profil', programming: 'programming',
    pubg: 'pubg', randblackpink: 'randblackpink', randomnime: 'randomnime',
    randomnime2: 'randomnime2', rize: 'rize', rose: 'rose', ryujin: 'ryujin',
    sagiri: 'sagiri', sakura: 'sakura', sasuke: 'sasuke', satanic: 'satanic',
    shina: 'shina', shinka: 'shinka', shinomiya: 'shinomiya', shizuka: 'shizuka',
    shota: 'shota', space: 'tatasurya', technology: 'technology', tejina: 'tejina',
    toukachan: 'toukachan', tsunade: 'tsunade',
    waifu: 'waifu', wallhp: 'wallhp', wallml: 'wallml', wallmlnime: 'wallnime',
    yotsuba: 'yotsuba', yuki: 'yuki', yulibocil: 'yulibocil', yumeko: 'yumeko',
    hinata: 'hinata'
}

const pluginConfig = {
    name: 'anime',
    alias: Object.keys(SOURCES),
    category: 'random',
    description: 'Random gambar anime/wallpaper (Leoo7z Source)',
    usage: '.<nama> (lihat daftar di bawah)',
    example: '.naruto',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 1,
    isEnabled: true
}

const imageCache = new Map()

async function getImages(source) {
    if (imageCache.has(source)) {
        return imageCache.get(source)
    }
    
    try {
        const response = await axios.get(`${BASE_URL}/${source}.json`, { timeout: 15000 })
        const data = response.data
        if (Array.isArray(data) && data.length > 0) {
            imageCache.set(source, data)
            return data
        }
        return null
    } catch {
        return null
    }
}

async function handler(m, { sock }) {
    const cmd = m.command.toLowerCase()
    const source = SOURCES[cmd]
    
    if (!source) {
        return m.reply(`❌ Source tidak ditemukan.`)
    }
    
    try {
        const images = await getImages(source)
        
        if (!images || images.length === 0) {
            return m.reply(`❌ Gagal mengambil data ${cmd}.`)
        }

        if(m.command === 'loli') {
            return await sock.sendMessage(m.chat , {
                image: { url: 'https://api.nexray.web.id/random/loli' },
                caption: `👧 *ʀᴀɴᴅᴏᴍ ʟᴏʟɪ*`
            }, { quoted: m })
        } 
        
        if(m.command === 'neko') {
            return await sock.sendMessage(m.chat , {
                image: { url: 'https://api.siputzx.my.id/api/r/neko' },
                caption: `🐱 *ʀᴀɴᴅᴏᴍ ɴᴇᴋᴏ*`
            }, { quoted: m })
        }
        
        const randomIndex = Math.floor(Math.random() * images.length)
        const imageUrl = images[randomIndex]
        if (cmd === 'shortquote') {
             await sock.sendMessage(m.chat, {
                text: imageUrl,
                contextInfo: {
                    externalAdReply: {
                        title: '💬 *Random Quote*',
                        body: 'Anime Quotes',
                        mediaType: 1,
                        thumbnailUrl: 'https://files.catbox.moe/k9233s.jpg',
                        sourceUrl: ''
                    }
                }
            }, { quoted: m })
        } else {
             await sock.sendMessage(m.chat, {
                image: { url: imageUrl },
                caption: `🖼️ *Random ${cmd.charAt(0).toUpperCase() + cmd.slice(1)}*\n> ${randomIndex + 1}/${images.length}`
            }, { quoted: m })
        }
        
        m.react('🖼️')
        
    } catch (err) {
        m.react('❌')
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${err.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
