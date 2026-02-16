/**
 * Mimpi / Dream World - Fun dream interpretation generator
 * Ported from RTXZY-MD-pro
 */

const pluginConfig = {
    name: 'mimpi',
    alias: ['dream', 'dreamworld'],
    category: 'fun',
    description: 'Jelajahi dunia mimpimu berdasarkan nama',
    usage: '.mimpi <nama>',
    example: '.mimpi Keisya',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energi: 1,
    isEnabled: true
}

const DREAM_LEVELS = ['Lucid ✨', 'Mystic 🌟', 'Ethereal 💫', 'Divine 🌙', 'Legendary 🎇']
const DREAM_QUALITIES = ['Peaceful 😌', 'Adventure 🚀', 'Mystical 🔮', 'Prophecy 📖', 'Epic 🗺️']

const ELEMENTS = [
    '🌊 Lautan Kristal Bercahaya',
    '🌈 Pelangi Mengambang',
    '🌺 Taman Melayang',
    '⭐ Konstelasi Hidup',
    '🌙 Bulan Kembar',
    '🏰 Kastil Awan',
    '🌋 Gunung Prisma',
    '🎭 Theater Bayangan'
]

const EVENTS = [
    '🦋 Kupu-kupu membawa pesan rahasia',
    '🎭 Topeng menari sendiri',
    '🌊 Hujan bintang jatuh ke laut',
    '🎪 Parade makhluk ajaib',
    '🌺 Bunga bernyanyi lagu kuno',
    '🎨 Lukisan menjadi hidup',
    '🎵 Musik terlihat sebagai warna',
    '⚡ Petir membentuk tangga ke langit'
]

const ENCOUNTERS = [
    '🐉 Naga Pelangi Bijaksana',
    '🧙‍♂️ Penyihir Bintang',
    '🦊 Rubah Spirit Sembilan Ekor',
    '🧝‍♀️ Peri Pembawa Mimpi',
    '🦁 Singa Kristal',
    '🐋 Paus Terbang Mistis',
    '🦅 Burung Phoenix Waktu',
    '🐢 Kura-kura Pembawa Dunia',
    '🦄 Unicorn Dimensi'
]

const POWERS = [
    '✨ Mengendalikan Waktu',
    '🌊 Berbicara dengan Elemen',
    '🎭 Shapeshifting',
    '🌈 Manipulasi Realitas',
    '👁️ Penglihatan Masa Depan',
    '🎪 Teleportasi Dimensi',
    '🌙 Penyembuhan Spiritual',
    '⚡ Energi Kosmik'
]

const MESSAGES = [
    'Perjalananmu akan membawa perubahan besar',
    'Rahasia kuno akan terungkap dalam waktu dekat',
    'Kekuatan tersembunyi akan segera bangkit',
    'Takdir baru menanti di horizon',
    'Koneksi spiritual akan menguat',
    'Transformasi besar akan terjadi',
    'Pencerahan akan datang dari arah tak terduga',
    'Misi penting akan segera dimulai'
]

function generateDream(seed) {
    const seedNum = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    const pick = (arr) => arr[seedNum % arr.length]
    const pickMulti = (arr, count) => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, count)
    }
    
    return {
        level: pick(DREAM_LEVELS),
        quality: pick(DREAM_QUALITIES),
        elements: pickMulti(ELEMENTS, 3),
        events: pickMulti(EVENTS, 2),
        encounters: pickMulti(ENCOUNTERS, 2),
        powers: pickMulti(POWERS, 2),
        message: pick(MESSAGES)
    }
}

async function handler(m, { sock }) {
    const args = m.args || []
    let name = args.join(' ') || m.pushName || m.sender.split('@')[0]
    
    await m.react('🌙')
    await m.reply('🌙 *Memasuki alam mimpi...*')
    await new Promise(r => setTimeout(r, 1500))
    
    const dream = generateDream(name)
    
    let txt = `╭═══❯ *🌙 DREAM WORLD* ❮═══\n`
    txt += `│\n`
    txt += `│ 👤 *Explorer:* ${name}\n`
    txt += `│ ⭐ *Level:* ${dream.level}\n`
    txt += `│ 💫 *Quality:* ${dream.quality}\n`
    txt += `│\n`
    txt += `│ 🌈 *Elements:*\n`
    for (const el of dream.elements) {
        txt += `│ ├ ${el}\n`
    }
    txt += `│\n`
    txt += `│ 🎪 *Events:*\n`
    for (const ev of dream.events) {
        txt += `│ ├ ${ev}\n`
    }
    txt += `│\n`
    txt += `│ 🌟 *Encounters:*\n`
    for (const enc of dream.encounters) {
        txt += `│ ├ ${enc}\n`
    }
    txt += `│\n`
    txt += `│ 💫 *Powers:*\n`
    for (const pow of dream.powers) {
        txt += `│ ├ ${pow}\n`
    }
    txt += `│\n`
    txt += `│ 🔮 *Message:*\n`
    txt += `│ ${dream.message}\n`
    txt += `│\n`
    txt += `╰════════════════════`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
