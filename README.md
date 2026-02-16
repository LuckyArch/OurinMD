# 🤖 Ourin MD V2.0.0 — FREE Edition

![Ourin MD](https://files.cloudkuimages.guru/images/51a2c5186302.jpg)

WhatsApp Multi-Device Bot dengan sistem plugin modular, 700+ fitur, dan UI interaktif.

## ⚙️ **Fitur Utama**

### 🧩 Sistem Plugin Modular
- 📁 35+ kategori plugin yang terorganisir
- 🔌 Hot-reload plugin tanpa restart bot
- ⚡ Sistem cooldown, energi, dan limit per user

### 📨 Interaksi & UI
- 👉🏻 Button, List, Carousel, dan Native Flow message
- 🎨 11 varian tampilan menu (V1–V11)
- 📊 Leaderboard, profil user, dan sistem level/EXP

### 🔐 Manajemen & Keamanan
- 👤 Multi-owner, premium, dan partner system
- 🛡️ Anti-spam, anti-call, anti-link, anti-hidetag
- 🔒 Auto tutup grup saat waktu sholat

### 🎮 Game & RPG
- ⚔️ Sistem RPG lengkap (berburu, berladang, casino, dll)
- 🎯 20+ game tebak-tebakan interaktif
- 🏆 Sistem koin, stamina, dan daily/hourly rewards

### 🌙 Spesial Ramadhan
- 🥘 **Auto Sahur** — Pengingat waktu sahur otomatis ke grup
- 🕌 **Auto Sholat & Adzan** — Notifikasi waktu sholat dengan audio adzan
- 🔒 **Auto Close Group** — Otomatis tutup grup saat sholat & buka kembali setelah selesai
- 📅 **Jadwal Imsakiyah** — Cek jadwal imsak & berbuka real-time
- 📖 **Konten Islami** — Asmaul Husna, Doa harian, Ayat Kursi, dll

---

## 📥 **Instalasi**

### Prasyarat

| Kebutuhan | Versi |
|-----------|-------|
| Node.js | `>= 18.0.0` |
| Git | Terbaru |
| FFmpeg | Terbaru |

### ⌨️ Langkah Instalasi

```bash
# Clone repository
git clone https://github.com/LuckyArch/OurinMD.git

# Masuk ke folder
cd OurinMD

# Install dependencies
npm install

# Jalankan bot
npm start
```

---

## 🔧 **Konfigurasi**

Edit file `config.js` sesuai kebutuhan:

```javascript
const config = {
    owner: {
        name: 'Nama Kamu',
        number: ['628xxxxxxxxx']        // Format: 628xxx
    },

    session: {
        pairingNumber: '628xxxxxxxxx',  // Nomor WA bot
        usePairingCode: true            // true = Pairing Code
    },

    bot: {
        name: 'Ourin AI',
        version: '2.0.0',
        developer: 'Zann'
    },

    command: {
        prefix: '.'                     // Prefix command
    }
}
```

> [!TIP]
> Gunakan **Pairing Code** (`usePairingCode: true`) untuk koneksi yang lebih stabil.

---

## 📁 **Kategori Plugin**

<details open>
<summary><strong>📋 Daftar 35 Kategori (700+ Fitur)</strong></summary>

<br>

| Kategori | Jumlah | Deskripsi |
|----------|--------|-----------|
| 🤖 AI | 37 | ChatGPT, Gemini, image generation, dll |
| 🎞️ Asupan | 8 | Random video TikTok |
| 🎨 Canvas | 23 | Manipulasi gambar & text-to-image |
| ✅ Cek | 45 | Cek nomor, resi, khodam, dll |
| ⚔️ Clan | 9 | Sistem clan/guild |
| 🔄 Convert | 13 | Konversi format file |
| 📥 Download | 24 | YouTube, TikTok, Instagram, dll |
| 🖼️ Ephoto | 1 | Efek foto online |
| 😂 Fun | 42 | Command hiburan |
| 🎮 Game | 26 | Game tebak-tebakan interaktif |
| 👥 Group | 89 | Manajemen grup lengkap |
| ℹ️ Info | 8 | Info bot & sistem |
| 🕌 Islamic | 1 | Konten islami |
| 📢 JPM | 11 | Join, Promote, Message |
| 📋 Main | 19 | Menu, help, ping, dll |
| 📸 Media | 3 | Kirim media |
| 🔞 NSFW | 2 | Konten dewasa (toggle) |
| 👑 Owner | 102 | Command khusus owner |
| 🖥️ Panel | 20 | Pterodactyl & DigitalOcean |
| 💎 Premium | 2 | Fitur premium |
| 🔮 Primbon | 8 | Ramalan & primbon Jawa |
| 📲 Push Kontak | 6 | Broadcast kontak |
| 💬 Quotes | 1 | Kutipan motivasi |
| 🎲 Random | 13 | Random gambar/video |
| 🕌 Religi | 4 | Jadwal sholat, auto sahur, dll |
| ⚔️ RPG | 59 | Sistem RPG lengkap |
| 🔍 Search | 42 | Pencarian multi-platform |
| 👤 Stalker | 10 | Stalking sosial media |
| 🎭 Sticker | 15 | Sticker maker & converter |
| 🏪 Store | 21 | Sistem toko & order |
| 🛠️ Tools | 46 | Utilitas (OCR, TTS, QR, dll) |
| 🗣️ TTS | 6 | Text-to-Speech multi karakter |
| 👤 User | 19 | Profil, level, energi, dll |
| 🔧 Utility | 1 | Utilitas tambahan |
| ☁️ VPS | 6 | Manajemen VPS |

</details>

---

## 🚀 **Deployment**

<details>
<summary><strong>🖥️ VPS / Lokal</strong></summary>

<br>

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
sudo apt install -y ffmpeg

# Clone & jalankan
git clone https://github.com/LuckyArch/OurinMD.git
cd OurinMD
npm install
npm start
```

</details>

<details>
<summary><strong>🦅 Pterodactyl Panel</strong></summary>

<br>

1. Buat server dengan egg **Node.js**
2. Upload atau clone repository
3. Set startup command: `npm start`
4. Konfigurasi `config.js`
5. Start server

</details>

---

## 🔄 **Update Script**

Bot sudah dilengkapi fitur auto-update. Cukup ketik di chat:

```
.updatescript
```

> [!NOTE]
> Bot akan otomatis:
> 1. Backup `config.js`, `database/`, `sessions/`
> 2. Clone versi terbaru dari GitHub
> 3. Install dependencies
> 4. Restart bot

---

## 📋 **Command Dasar**

| Command | Fungsi |
|---------|--------|
| `.menu` | Tampilkan menu utama |
| `.help` | Bantuan penggunaan |
| `.ping` | Cek respon bot |
| `.owner` | Info owner |
| `.donasi` | Info donasi |
| `.daftar` | Registrasi user |
| `.profile` | Lihat profil |
| `.daily` | Klaim reward harian |

---

## ⚠️ **Catatan Penting**

> [!WARNING]
> - Jangan hapus atau ganti credits
> - Jangan dijual — script ini **GRATIS**
> - Jika ingin mengembangkan, tambahkan nama kamu di file `CREDITS`

> [!CAUTION]
> - Simpan `config.js` kamu sendiri, jangan share API key
> - Gunakan `.updatescript` untuk update aman tanpa kehilangan data

---

## 📣 **Credits**

> [!IMPORTANT]
> **Developer & Team:**
> - **Hyuu** — Lead Staff
> - **Lucky Archz ( Zann )** — Umm, Developer Pemula
> - **Keisya** — Owner
> - **Danzzz** — Designer
> - **Sanxz, Syura Salsabila, Tama, Rakaa, Dinzz, Forone** — Tangan Kanan
> - **Muzann** — Owner
> - **Fahmi, Baim** — Moderator
> - **Liaa** — Helper
>
> **Powered by:**
> - [Baileys](https://github.com/LuckyArch/OurinGlitch-Baileys) — WhatsApp Web API Original
> - [Node.js](https://nodejs.org) — Runtime
> - [FFmpeg](https://ffmpeg.org) — Media Processing

---

## 📎 **Links**

- 📢 Saluran WA: [Klik di sini](https://whatsapp.com/channel/0029VbB37bgBfxoAmAlsgE0t)
- 🌐 Website: [sc.ourin.my.id](https://sc.ourin.my.id)

---

<p align="center">
  <b>© 2026 Ourin MD — Made with ❤️</b><br>
</p>
