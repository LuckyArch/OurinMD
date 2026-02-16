/**
 * Untuk gambar/audio/video, ada di folder 'assets'
 * 
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Designer = Danzzz
 * Wileys = Penyedia baileys
 * Penyedia API
 * Penyedia Scraper
 * 
 * JANGAN HAPUS/GANTI CREDITS & THANKS TO
 * JANGAN DIJUAL YA MEK
 * 
 * Saluran Resmi Ourin:
 * https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t 
 */

const config = {

    info: {
        website: 'https://sc.ourin.my.id'
    },

    owner: {
        name: 'Zann',                    // Nama owner
        number: ['628xxxxxxxx']         // Format: 628xxx (tanpa + atau 0)
    },

    session: {
        pairingNumber: '63xxxxxxxxxxx',   // Nomor WA yang akan di-pair
        usePairingCode: true              // true = Pairing Code, false = QR Code
    },

    bot: {
        name: '𝗢𝗨𝗥𝗜𝗡 𝗔𝗜',                 // Nama bot
        version: '2.0.0',                 // Versi bot
        developer: 'Zann'          // Nama developer
    },

    mode: 'public',

    command: {
        prefix: '.'                       // Prefix utama (.menu, .help, dll)
    },

    vercel: {
        // ambil token vercel: https://vercel.com/account/tokens
        token: ''                        // Vercel Token untuk fitur deploy ( Kalau .deploy mau work, ini wajib di isi )
    },

    store: {
        payment: [
            { name: 'Dana', number: '62xxxxxxxxx', holder: 'Nama Pemilik' },
            { name: 'OVO', number: '62xxxxxxxxx', holder: 'Nama Pemilik' },
            { name: 'GoPay', number: '62xxxxxxxxx', holder: 'Nama Pemilik' },
            { name: 'ShopeePay', number: '62xxxxxxxxx', holder: 'Nama Pemilik' }
        ],
        qris: 'https://files.cloudkuimages.guru/images/51a2c5186302.jpg'
    },

    donasi: {
        payment: [
            { name: 'Dana', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
            { name: 'GoPay', number: '08xxxxxxxxxx', holder: 'Nama Owner' },
            { name: 'OVO', number: '08xxxxxxxxxx', holder: 'Nama Owner' }
        ],
        links: [
            { name: 'Saweria', url: 'saweria.co/username' },
            { name: 'Trakteer', url: 'trakteer.id/username' }
        ],
        benefits: [
            'Mendukung development',
            'Server lebih stabil',
            'Fitur baru lebih cepat',
            'Priority support'
        ],
        qris: 'https://files.cloudkuimages.guru/images/51a2c5186302.jpg'
    },

    limits: {
        default: 25,                      // User biasa
        premium: 100,                     // Premium user
        owner: -1                         // Owner (-1 = unlimited)
    },

    sticker: {
        packname: '𝗢𝗨𝗥𝗜𝗡 𝗠𝗗',             // Nama pack sticker
        author: 'Bot'                     // Author sticker
    },

    saluran: {
        id: '120363400911374213@newsletter',                           // ID saluran (contoh: 120363xxx@newsletter)
        name: '- Kunjungi saluran resmi Ourin',       // Nama saluran
        link: 'https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t'                          // Link saluran
    },

    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: false,
        autoTyping: true,
        autoRead: false,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },

    registration: {
        enabled: false,
        rewards: {
            koin: 30000,
            energi: 300,
            exp: 300000
        }
    },

    welcome: { defaultEnabled: false },
    goodbye: { defaultEnabled: false },

    premiumUsers: [],
    partnerUsers: [],
    bannedUsers: [],
    dynamicOwners: [],
    dynamicPremium: [],

    ui: {
        menuVariant: 3
    },

    messages: {
        wait: '⏳ *Proses...* Mohon tunggu sebentar ya.',
        success: '✅ *Berhasil!* Permintaan kamu sudah selesai.',
        error: '❌ *Error!* Ada masalah pada sistem, coba lagi nanti.',

        ownerOnly: '*Akses Ditolak!* Fitur ini khusus untuk Owner bot.',
        premiumOnly: '💎 *Premium Only!* Fitur ini khusus member Premium. Ketik *.benefitpremium* untuk info upgrade.',

        groupOnly: '👥 *Group Only!* Fitur ini hanya bisa digunakan di dalam grup.',
        privateOnly: '� *Private Only!* Fitur ini hanya bisa digunakan di chat pribadi bot.',

        adminOnly: '�️ *Admin Only!* Kamu harus jadi Admin grup untuk pakai fitur ini.',
        botAdminOnly: '🤖 *Bot Bukan Admin!* Jadikan bot sebagai Admin grup dulu biar bisa kerja.',

        cooldown: '⏳ *Tunggu Dulu!* Kamu masih dalam cooldown. Tunggu %time% detik lagi ya.',
        limitExceeded: '⚠️ *Limit Habis!* Limit harian kamu sudah habis. Tunggu reset besok atau beli Premium.',

        banned: '🚫 *Kamu Dibanned!* Kamu tidak bisa menggunakan bot ini karena telah melanggar aturan.'
    },

    database: { path: './database/main' },
    backup: { enabled: false, intervalHours: 24, retainDays: 7 },
    scheduler: { resetHour: 0, resetMinute: 0 },

    // Dev mode settings (auto-enabled jika NODE_ENV=development)
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,    // Hot reload plugins (SAFE)
        watchSrc: false,       // DISABLED - src reload causes connection conflict 440
        debugLog: false        // Show stack traces
    },

    // bisa dikosongin
    pterodactyl: {
        server1: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server2: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server3: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server4: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        },
        server5: {
            domain: '',
            apikey: '',
            capikey: '',
            egg: '15',
            nestid: '5',
            location: '1'
        }
    },

    digitalocean: {
        token: '',
        region: 'sgp1',
        sellers: [],
        ownerPanels: []
    },

    // NOTE: ini di versi free gak ada yak, adanya cuma di sc pt doang
    //  daftar di: https://pakasir.com/
    pakasir: {
        enabled: true,
        slug: '',
        apiKey: '',
        defaultMethod: 'qris',
        sandbox: false,
        pollingInterval: 5000
    },
    
    // NOTE: ini di versi free gak ada yak, adanya cuma di sc pt doang
    // Ambil apikey di: https://ditznesia.id -> Daftar -> Masuk ke Profile -> AMbile Apikey
    jasaotp: {
        apiKey: '',
        markup: 2000,
        timeout: 300
    },

    //  APIkey
    APIkey: {
        lolhuman: 'APIKey-Milik-Bot-OurinMD(Zann,HyuuSATANN,Keisya,Danzz)',
        neoxr: 'Milik-Bot-OurinMD',
        google: '',
        groq: ''
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - Jangan diubah tod, nanti elol!
// ═══════════════════════════════════════════════════════════════════════════

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    if (!cleanNumber) return false
    
    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        const cleanNumber = number?.replace(/[^0-9]/g, '') || ''
        
        if (!cleanNumber) return false
        if (config.owner && config.owner.number && config.owner.number.includes(cleanNumber)) {
            return true
        }
        
        if (db && db.data && Array.isArray(db.data.owner)) {
            if (db.data.owner.includes(cleanNumber)) return true
        }
        if (db) {
            const definedOwner = db.setting('ownerNumbers')
            if (Array.isArray(definedOwner) && definedOwner.includes(cleanNumber)) return true
        }
        
        return false
    } catch {
        return false
    }
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const premiumList = config.premiumUsers || []
    
    const inConfig = premiumList.some(premium => {
        if (!premium) return false
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
    })
    
    if (inConfig) return true
    
    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPremium(cleanNumber)) return true
    } catch {}
    
    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        if (db && db.data && Array.isArray(db.data.premium)) {
             const now = Date.now()
             const found = db.data.premium.find(p => {
                if (typeof p === 'string') return p === cleanNumber
                if (p.id) return p.id === cleanNumber
                return false
            })
            
            if (found) {
                if (typeof found === 'string') return true
                if (found.expired && found.expired < now) return false
                return true
            }
        }
        if (db) {
            const savedPremium = db.setting('premiumUsers') || []
            const inDb = savedPremium.some(premium => {
                if (!premium) return false
                const cleanPremium = premium.replace(/[^0-9]/g, '')
                return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
            })
            if (inDb) return true
        }
    } catch {}
    
    return false
}

function isPartner(number) {
    if (!number) return false
    if (isOwner(number)) return true

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const partnerList = config.partnerUsers || []

    const inConfig = partnerList.some(partner => {
        if (!partner) return false
        const cleanPartner = partner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPartner || cleanNumber.endsWith(cleanPartner) || cleanPartner.endsWith(cleanNumber)
    })

    if (inConfig) return true

    try {
        const ownerPremiumDb = require('./src/lib/ownerPremiumDb')
        if (ownerPremiumDb.isPartner(cleanNumber)) return true
    } catch {}

    return false
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false
    
    const cleanNumber = number.replace(/[^0-9]/g, '')
    return config.bannedUsers.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned || cleanNumber.endsWith(cleanBanned) || cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) config.bot.number = number.replace(/[^0-9]/g, '')
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() { return config }

function isPartner(number) {
    if (!number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const partnerList = config.partnerUsers || []
    if (partnerList.some(p => p.replace(/[^0-9]/g, '') === cleanNumber)) return true
    try {
        const { getDatabase } = require('./src/lib/database')
        const db = getDatabase()
        if (db && db.data && Array.isArray(db.data.partner)) {
            const now = Date.now()
            const found = db.data.partner.find(p => {
                if (typeof p === 'string') return p === cleanNumber
                if (p.id) return p.id === cleanNumber
                return false
            })
            
            if (found) {
                if (typeof found === 'string') return true
                if (found.expired && found.expired < now) return false
                return true
            }
        }
    } catch (e) {
        // console.error(e)
    }
    
    return false
}

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPartner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
