const axios = require('axios')

const pluginConfig = {
    name: 'ektp',
    alias: ['ktp', 'fakektp'],
    category: 'canvas',
    description: 'Membuat e-KTP palsu',
    usage: '.ektp <data>',
    example: '.ektp nik:1234|nama:John|ttl:20-12-2000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const DEFAULT_PP = 'https://i.ibb.co/6bWvFpg/avatar.jpg'

async function getProfilePicture(sock, jid) {
    try {
        const pp = await sock.profilePictureUrl(jid, 'image')
        return pp || DEFAULT_PP
    } catch {
        return DEFAULT_PP
    }
}

async function handler(m, { sock }) {
    const input = m.args.join(' ')
    if (!input) {
        return m.reply(
            `🪪 *ᴇ-ᴋᴛᴘ ᴍᴀᴋᴇʀ*\n\n` +
            `> Format: key:value|key:value\n\n` +
            `*ᴋᴇʏs:*\n` +
            `> \`provinsi, kota, nik, nama, ttl, jk, gol, alamat, rtrw, desa, kecamatan, agama, status, kerja, warga, berlaku\`\n\n` +
            `\`Contoh: ${m.prefix}ektp nik:1234567890|nama:John Doe|ttl:20-12-2000\`\n\n` +
            `> Reply gambar atau otomatis pakai PP sender`
        )
    }
    
    m.react('🪪')
    
    try {
        let photoUrl = DEFAULT_PP
        
        const isImage = m.isImage || (m.quoted && m.quoted.isImage)
        
        if (isImage) {
            let mediaBuffer
            if (m.isImage && m.download) {
                mediaBuffer = await m.download()
            } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
                mediaBuffer = await m.quoted.download()
            }
            
            if (mediaBuffer) {
                const FormData = require('form-data')
                const form = new FormData()
                form.append('file', mediaBuffer, { filename: 'image.jpg' })
                
                const uploadRes = await axios.post('https://uguu.se/upload', form, {
                    headers: form.getHeaders(),
                    timeout: 30000
                })
                
                if (uploadRes.data?.files?.[0]?.url) {
                    photoUrl = uploadRes.data.files[0].url
                }
            }
        } else {
            photoUrl = await getProfilePicture(sock, m.sender)
        }
        
        const defaults = {
            provinsi: 'JAWA TENGAH',
            kota: 'KEBUMEN',
            nik: '3305123456789012',
            nama: (m.pushName || 'JOHN DOE').toUpperCase(),
            ttl: 'KEBUMEN, 01-01-2000',
            jk: 'LAKI-LAKI',
            gol: 'O',
            alamat: 'JL. MERDEKA NO. 1',
            rtrw: '001/002',
            desa: 'DESA MAJU',
            kecamatan: 'KEC. JAYA',
            agama: 'ISLAM',
            status: 'BELUM KAWIN',
            kerja: 'PELAJAR/MAHASISWA',
            warga: 'WNI',
            berlaku: 'SEUMUR HIDUP'
        }
        
        const pairs = input.split('|')
        pairs.forEach(pair => {
            const [key, value] = pair.split(':').map(s => s.trim())
            if (key && value) {
                const keyMap = {
                    'provinsi': 'provinsi', 'kota': 'kota', 'nik': 'nik', 'nama': 'nama',
                    'ttl': 'ttl', 'jk': 'jk', 'gol': 'gol', 'alamat': 'alamat',
                    'rtrw': 'rtrw', 'desa': 'desa', 'kecamatan': 'kecamatan',
                    'agama': 'agama', 'status': 'status', 'kerja': 'kerja',
                    'warga': 'warga', 'berlaku': 'berlaku'
                }
                if (keyMap[key.toLowerCase()]) {
                    defaults[keyMap[key.toLowerCase()]] = value.toUpperCase()
                }
            }
        })
        
        const url = `https://zelapioffciall.koyeb.app/canvas/ektp?` +
            `provinsi=${encodeURIComponent(defaults.provinsi)}` +
            `&kota=${encodeURIComponent(defaults.kota)}` +
            `&nik=${encodeURIComponent(defaults.nik)}` +
            `&nama=${encodeURIComponent(defaults.nama)}` +
            `&ttl=${encodeURIComponent(defaults.ttl)}` +
            `&jenis_kelamin=${encodeURIComponent(defaults.jk)}` +
            `&golongan_darah=${encodeURIComponent(defaults.gol)}` +
            `&alamat=${encodeURIComponent(defaults.alamat)}` +
            `&rt_rw=${encodeURIComponent(defaults.rtrw)}` +
            `&kel_desa=${encodeURIComponent(defaults.desa)}` +
            `&kecamatan=${encodeURIComponent(defaults.kecamatan)}` +
            `&agama=${encodeURIComponent(defaults.agama)}` +
            `&status=${encodeURIComponent(defaults.status)}` +
            `&pekerjaan=${encodeURIComponent(defaults.kerja)}` +
            `&kewarganegaraan=${encodeURIComponent(defaults.warga)}` +
            `&masa_berlaku=${encodeURIComponent(defaults.berlaku)}` +
            `&terbuat=${encodeURIComponent(defaults.kota)}` +
            `&pas_photo=${encodeURIComponent(photoUrl)}`
        
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        if (!response.data || response.data.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> API tidak merespon`)
        }
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(response.data),
            caption: `🪪 *ᴇ-ᴋᴛᴘ*\n\n> ɴᴀᴍᴀ: \`${defaults.nama}\`\n> ɴɪᴋ: \`${defaults.nik}\``
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
