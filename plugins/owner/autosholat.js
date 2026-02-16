const { getDatabase } = require('../../src/lib/database');
const config = require('../../config');
const { getTodaySchedule, extractPrayerTimes, searchKota } = require('../../src/lib/sholatAPI');

const pluginConfig = {
    name: 'autosholat',
    alias: ['sholat', 'autoadzan'],
    category: 'owner',
    description: 'Toggle pengingat waktu sholat otomatis dengan audio adzan dan tutup grup',
    usage: '.autosholat on/off/status/kota <nama>',
    example: '.autosholat on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
};

const AUDIO_ADZAN = 'https://media.vocaroo.com/mp3/1ofLT2YUJAjQ';

async function handler(m, { sock, db }) {
    const args = m.args[0]?.toLowerCase();
    const database = getDatabase();

    if (!args || args === 'status') {
        const status = database.setting('autoSholat') ? '✅ Aktif' : '❌ Nonaktif';
        const closeGroup = database.setting('autoSholatCloseGroup') ? '✅ Ya' : '❌ Tidak';
        const duration = database.setting('autoSholatDuration') || 5;
        const kotaSetting = database.setting('autoSholatKota') || { id: '1301', nama: 'KOTA JAKARTA' };

        let jadwalText = '';
        try {
            const jadwalData = await getTodaySchedule(kotaSetting.id);
            const times = extractPrayerTimes(jadwalData);
            for (const [nama, waktu] of Object.entries(times)) {
                jadwalText += `┃ ${nama.charAt(0).toUpperCase() + nama.slice(1)}: \`${waktu}\`\n`;
            }
        } catch {
            jadwalText = '┃ _Gagal memuat jadwal_\n';
        }

        return m.reply(
            `🕌 *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ*\n\n` +
            `╭┈┈⬡「 📋 *sᴛᴀᴛᴜs* 」\n` +
            `┃ 🔔 ᴀᴜᴛᴏ sʜᴏʟᴀᴛ: ${status}\n` +
            `┃ 🔒 ᴛᴜᴛᴜᴘ ɢʀᴜᴘ: ${closeGroup}\n` +
            `┃ ⏱️ ᴅᴜʀᴀsɪ: \`${duration}\` menit\n` +
            `┃ 📍 ᴋᴏᴛᴀ: \`${kotaSetting.nama}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🕐 *ᴊᴀᴅᴡᴀʟ ʜᴀʀɪ ɪɴɪ* 」\n` +
            jadwalText +
            `╰┈┈⬡\n\n` +
            `> *Penggunaan:*\n` +
            `> \`${m.prefix}autosholat on\` - Aktifkan\n` +
            `> \`${m.prefix}autosholat off\` - Nonaktifkan\n` +
            `> \`${m.prefix}autosholat close on/off\` - Toggle tutup grup\n` +
            `> \`${m.prefix}autosholat duration <menit>\` - Set durasi tutup\n` +
            `> \`${m.prefix}autosholat kota <nama>\` - Set lokasi\n\n` +
            `> _Sumber: myquran.com (real-time)_`
        );
    }

    if (args === 'on') {
        database.setting('autoSholat', true);
        m.react('✅');
        const kota = database.setting('autoSholatKota') || { nama: 'KOTA JAKARTA' };
        return m.reply(
            `✅ *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n` +
            `> Pengingat waktu sholat aktif\n` +
            `> Audio adzan akan dikirim ke semua grup\n` +
            `> Lokasi: ${kota.nama} (real-time)`
        );
    }

    if (args === 'off') {
        database.setting('autoSholat', false);
        m.react('❌');
        return m.reply(`❌ *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*`);
    }

    if (args === 'close') {
        const subArg = m.args[1]?.toLowerCase();
        if (subArg === 'on') {
            database.setting('autoSholatCloseGroup', true);
            m.react('🔒');
            return m.reply(`🔒 *ᴛᴜᴛᴜᴘ ɢʀᴜᴘ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Grup akan ditutup saat waktu sholat`);
        }
        if (subArg === 'off') {
            database.setting('autoSholatCloseGroup', false);
            m.react('🔓');
            return m.reply(`🔓 *ᴛᴜᴛᴜᴘ ɢʀᴜᴘ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Grup tidak akan ditutup saat waktu sholat`);
        }
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gunakan: \`${m.prefix}autosholat close on/off\``);
    }

    if (args === 'duration') {
        const duration = parseInt(m.args[1]);
        if (isNaN(duration) || duration < 1 || duration > 60) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Durasi harus antara 1-60 menit`);
        }
        database.setting('autoSholatDuration', duration);
        m.react('⏱️');
        return m.reply(`⏱️ *ᴅᴜʀᴀsɪ ᴅɪsᴇᴛ*\n\n> Grup akan ditutup \`${duration}\` menit saat waktu sholat`);
    }

    if (args === 'kota') {
        const kotaName = m.args.slice(1).join(' ').trim();
        if (!kotaName) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Gunakan: \`${m.prefix}autosholat kota Jakarta\``);
        }

        m.react('🔍');
        try {
            const result = await searchKota(kotaName);
            if (!result) {
                return m.reply(`❌ Kota "${kotaName}" tidak ditemukan`);
            }

            database.setting('autoSholatKota', {
                id: result.id,
                nama: result.lokasi
            });

            m.react('📍');
            return m.reply(
                `📍 *ʟᴏᴋᴀsɪ ᴅɪsᴇᴛ*\n\n` +
                `> Kota: *${result.lokasi}*\n\n` +
                `> Jadwal sholat akan mengikuti lokasi ini`
            );
        } catch (e) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${e.message}`);
        }
    }

    return m.reply(`❌ *ᴀᴄᴛɪᴏɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Gunakan: \`on\`, \`off\`, \`close on/off\`, \`duration <menit>\`, \`kota <nama>\``);
}

async function runAutoSholat(sock) {
    const db = getDatabase();

    if (!db.setting('autoSholat')) return;

    const kotaSetting = db.setting('autoSholatKota') || { id: '1301', nama: 'KOTA JAKARTA' };

    let times;
    try {
        const jadwalData = await getTodaySchedule(kotaSetting.id);
        times = extractPrayerTimes(jadwalData);
    } catch {
        return;
    }

    const JADWAL = {
        subuh: times.subuh,
        dzuhur: times.dzuhur,
        ashar: times.ashar,
        maghrib: times.maghrib,
        isya: times.isya
    };

    const timeHelper = require('../../src/lib/timeHelper');
    const timeNow = timeHelper.getCurrentTimeString();

    if (!global.autoSholatLock) global.autoSholatLock = {};

    for (const [sholat, waktu] of Object.entries(JADWAL)) {
        if (waktu === '-') continue;
        if (timeNow === waktu && !global.autoSholatLock[sholat]) {
            global.autoSholatLock[sholat] = true;
            try {
                global.isFetchingGroups = true;
                const groupsObj = await sock.groupFetchAllParticipating();
                global.isFetchingGroups = false;
                const groupList = Object.keys(groupsObj);

                const saluranId = config.saluran?.id || '120363208449943317@newsletter';
                const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI';

                const closeGroup = db.setting('autoSholatCloseGroup') || false;
                const duration = db.setting('autoSholatDuration') || 5;

                const GambarSuasana = {
                    subuh: 'https://files.cloudkuimages.guru/images/61c43a618c30.jpg',
                    dzuhur: 'https://files.cloudkuimages.guru/images/57b4f4639bc3.jpg',
                    ashar: 'https://files.cloudkuimages.guru/images/e6c4e032aa53.webp',
                    maghrib: 'https://files.cloudkuimages.guru/images/da65b383dea6.webp',
                    isya: 'https://files.cloudkuimages.guru/images/e35488beb40c.jpg'
                };

                const contextInfo = {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                };

                for (const jid of groupList) {
                    const groupData = db.data?.groups?.[jid] || {};
                    if (groupData.notifSholat === false) continue;

                    try {
                        const caption = `🕌 *ᴡᴀᴋᴛᴜ sʜᴏʟᴀᴛ ${sholat.toUpperCase()}*\n\n` +
                            `> Waktu: \`${waktu} WIB\`\n` +
                            `> Lokasi: \`${kotaSetting.nama}\`\n` +
                            `> Ayo tunaikan sholat! 🤲\n\n` +
                            (closeGroup ? `> _Grup ditutup ${duration} menit_` : '');

                        await sock.sendMessage(jid, {
                            audio: { url: AUDIO_ADZAN },
                            mimetype: 'audio/mpeg',
                            ptt: false,
                            contextInfo: {
                                externalAdReply: {
                                    title: `🕌 Waktu ${sholat.toUpperCase()}`,
                                    body: caption.replace(/[*_`]/g, '').substring(0, 100),
                                    thumbnailUrl: GambarSuasana[sholat],
                                    sourceUrl: config.saluran?.link || 'https://waktunya.ibadah',
                                    mediaType: 2,
                                    renderLargerThumbnail: true
                                },
                                ...contextInfo
                            }
                        });

                        if (closeGroup) {
                            await sock.groupSettingUpdate(jid, 'announcement');
                        }

                        await new Promise(res => setTimeout(res, 500));
                    } catch (e) {
                        console.log(`[AutoSholat] Gagal kirim ke ${jid}:`, e.message);
                    }
                }

                if (closeGroup) {
                    setTimeout(async () => {
                        for (const jid of groupList) {
                            try {
                                await sock.groupSettingUpdate(jid, 'not_announcement');
                                await sock.sendMessage(jid, {
                                    text: `✅ Grup dibuka kembali setelah sholat ${sholat}.`,
                                    contextInfo
                                });
                                await new Promise(res => setTimeout(res, 600));
                            } catch (e) {
                                console.log(`[AutoSholat] Gagal buka grup ${jid}:`, e.message);
                            }
                        }
                        console.log(`[AutoSholat] Semua grup dibuka kembali`);
                    }, duration * 60 * 1000);
                }

                console.log(`[AutoSholat] Pengingat ${sholat} terkirim ke ${groupList.length} grup`);

            } catch (error) {
                global.isFetchingGroups = false;
                console.error('[AutoSholat] Error:', error.message);
            }

            setTimeout(() => {
                delete global.autoSholatLock[sholat];
            }, 2 * 60 * 1000);
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    runAutoSholat,
    AUDIO_ADZAN
};
