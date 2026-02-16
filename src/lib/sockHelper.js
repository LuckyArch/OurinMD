/**
 * Credits & Thanks to
 * Developer = Lucky Archz ( Zann )
 * Lead owner = HyuuSATAN
 * Owner = Keisya
 * Owner = Syura Salsabila
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
 * 
 */

const fs = require('fs');
const path = require('path');
const { downloadMediaMessage, getContentType } = require('ourin');
const { addExifToWebp, DEFAULT_METADATA } = require('./exif');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const { config } = require('./../../config');

/**
 * Get temp directory
 */
function getTempDir() {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
}

/**
 * Download buffer from URL
 */
async function downloadBuffer(url) {
    const axios = require('axios');
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    return Buffer.from(response.data);
}

/**
 * Convert image buffer to WebP sticker using sharp
 */
async function imageToWebp(buffer) {
    try {
        const sharp = require('sharp');
        return await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (error) {
        throw new Error('Failed to convert image to webp: ' + error.message);
    }
}

/**
 * Convert video to WebP sticker using fluent-ffmpeg
 */
function videoToWebp(buffer) {
    return new Promise((resolve, reject) => {
        const tmpDir = getTempDir();
        const inputPath = path.join(tmpDir, `input_${Date.now()}.mp4`);
        const outputPath = path.join(tmpDir, `output_${Date.now()}.webp`);
        
        if (!buffer || buffer.length < 1000) {
            return reject(new Error('Invalid video buffer'));
        }
        
        fs.writeFileSync(inputPath, buffer);
        
        const cleanup = () => {
            try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
        };
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Video conversion timeout'));
        }, 60000);
        
        ffmpeg(inputPath)
            .inputOptions(['-y', '-t', '6'])
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', "fps=12,scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-q:v', '50'
            ])
            .toFormat('webp')
            .on('end', () => {
                clearTimeout(timeout);
                try {
                    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
                        cleanup();
                        return reject(new Error('Output file is empty or invalid'));
                    }
                    const webpBuffer = fs.readFileSync(outputPath);
                    cleanup();
                    resolve(webpBuffer);
                } catch (err) {
                    cleanup();
                    reject(err);
                }
            })
            .on('error', (err) => {
                clearTimeout(timeout);
                cleanup();
                reject(new Error('FFmpeg error: ' + err.message));
            })
            .save(outputPath);
    });
}

/**
 * Simple image to webp without sharp (using raw webp)
 */
async function simpleImageToWebp(buffer) {
    const tmpDir = getTempDir();
    const inputPath = path.join(tmpDir, `img_${Date.now()}.png`);
    const outputPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);
    
    fs.writeFileSync(inputPath, buffer);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', () => {
                try {
                    const webpBuffer = fs.readFileSync(outputPath);
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(webpBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            })
            .save(outputPath);
    });
}

/**
 * Extend socket with helper methods
 */
function extendSocket(sock) {
    /**
     * Send image as sticker
     */
    sock.sendImageAsSticker = async (jid, input, m, options = {}) => {
        let buffer;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        
        let webpBuffer;
        try {
            const sharp = require('sharp');
            webpBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 80 })
                .toBuffer();
        } catch (err) {
            throw new Error('Failed to convert image: ' + err.message);
        }
        try {
            webpBuffer = await addExifToWebp(webpBuffer, {
                packname: options.packname ?? DEFAULT_METADATA.packname,
                author: options.author ?? DEFAULT_METADATA.author,
                emojis: options.emojis || DEFAULT_METADATA.emojis
            });
        } catch (e) {
            console.log('[Sticker] EXIF error:', e.message);
        }
        
        return sock.sendMessage(jid, {
            sticker: webpBuffer,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
            }
        }, {
            quoted: m
        });
    };
    
    /**
     * Send video as sticker (animated)
     */
    sock.sendVideoAsSticker = async (jid, input, m, options = {}) => {
        let buffer;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        let webpBuffer = await videoToWebp(buffer);
        try {
            webpBuffer = await addExifToWebp(webpBuffer, {
                packname: options.packname ?? DEFAULT_METADATA.packname,
                author: options.author ?? DEFAULT_METADATA.author,
                emojis: options.emojis || DEFAULT_METADATA.emojis
            });
        } catch (e) {
            console.log('[Sticker] EXIF error:', e.message);
        }
        
        return sock.sendMessage(jid, {
            sticker: webpBuffer,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
            }
        }, {
            quoted: m
        });
    };
    
    /**
     * Send sticker pack using native StickerPackMessage
     * Creates bundle and uploads to sticker CDN
     */
    sock.sendStickerPack = async (jid, stickers, m, options = {}) => {
        const { prepareWAMessageMedia } = require('ourin');
        const crypto = require('crypto');
        const archiver = require('archiver');
        
        if (!stickers || !stickers.length) {
            throw new Error('No stickers provided');
        }
        
        const packname = options.name || options.packname || 'Sticker Pack';
        const publisher = options.publisher || options.author || 'Ourin-AI';
        const packDescription = options.description || '';
        const stickerPackId = options.id || crypto.randomUUID();
        
        console.log(`[StickerPack] Creating pack: ${packname} with ${stickers.length} stickers`);
        
        const tempDir = getTempDir();
        const packDir = path.join(tempDir, `pack_${Date.now()}`);
        if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true });
        
        const stickerMeta = [];
        let trayBuffer = null;
        
        for (let i = 0; i < stickers.length; i++) {
            try {
                let stickerBuffer = stickers[i];
                
                if (typeof stickerBuffer === 'string') {
                    if (stickerBuffer.startsWith('http')) {
                        stickerBuffer = await downloadBuffer(stickerBuffer);
                    } else if (fs.existsSync(stickerBuffer)) {
                        stickerBuffer = fs.readFileSync(stickerBuffer);
                    }
                }
                
                if (!Buffer.isBuffer(stickerBuffer) || stickerBuffer.length < 100) continue;
                
                const isGif = stickerBuffer.slice(0, 4).toString('hex') === '47494638';
                const isWebp = stickerBuffer.slice(0, 4).toString('hex') === '52494646';
                const isPng = stickerBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
                const isJpeg = stickerBuffer.slice(0, 2).toString('hex') === 'ffd8';
                
                let webpBuffer;
                if (isGif) {
                    webpBuffer = await videoToWebp(stickerBuffer);
                } else if (isWebp) {
                    webpBuffer = stickerBuffer;
                } else if (isPng || isJpeg) {
                    webpBuffer = await imageToWebp(stickerBuffer);
                } else {
                    try { webpBuffer = await imageToWebp(stickerBuffer); }
                    catch { webpBuffer = await videoToWebp(stickerBuffer); }
                }
                
                const fileSha = crypto.createHash('sha256').update(webpBuffer).digest('base64')
                    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                const fileName = `${fileSha}.webp`;
                fs.writeFileSync(path.join(packDir, fileName), webpBuffer);
                
                if (!trayBuffer) trayBuffer = webpBuffer;
                
                stickerMeta.push({
                    fileName,
                    isAnimated: isGif,
                    emojis: options.emojis || ['🎨'],
                    accessibilityLabel: '',
                    isLottie: false,
                    mimetype: 'image/webp'
                });
                
                console.log(`[StickerPack] Processed ${i + 1}/${stickers.length}`);
            } catch (e) {
                console.log(`[StickerPack] Failed ${i + 1}:`, e.message);
            }
        }
        
        if (stickerMeta.length === 0) {
            fs.rmSync(packDir, { recursive: true, force: true });
            throw new Error('No stickers could be prepared');
        }
        
        const trayFileName = `${stickerPackId}.png`;
        if (trayBuffer) {
            fs.writeFileSync(path.join(packDir, trayFileName), trayBuffer);
        }
        
        const wastickersPath = path.join(tempDir, `${stickerPackId}.wastickers`);
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(wastickersPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.directory(packDir, false);
            archive.finalize();
        });
        
        const packBuffer = fs.readFileSync(wastickersPath);
        console.log(`[StickerPack] Bundle size: ${(packBuffer.length / 1024).toFixed(1)} KB`);
        
        const uploaded = await prepareWAMessageMedia(
            { sticker: packBuffer },
            { upload: sock.waUploadToServer }
        );
        
        fs.rmSync(packDir, { recursive: true, force: true });
        try { fs.unlinkSync(wastickersPath); } catch {}
        
        if (!uploaded?.stickerMessage) {
            throw new Error('Failed to upload pack bundle');
        }
        
        const sm = uploaded.stickerMessage;
        const fileSha256B64 = Buffer.isBuffer(sm.fileSha256) ? sm.fileSha256.toString('base64') : sm.fileSha256;
        const fileEncSha256B64 = Buffer.isBuffer(sm.fileEncSha256) ? sm.fileEncSha256.toString('base64') : sm.fileEncSha256;
        const mediaKeyB64 = Buffer.isBuffer(sm.mediaKey) ? sm.mediaKey.toString('base64') : sm.mediaKey;
        
        console.log(`[StickerPack] Uploaded to: ${sm.directPath}`);
        
        const stickerPackMessage = {
            stickerPackId,
            name: packname,
            publisher,
            stickers: stickerMeta,
            fileLength: String(packBuffer.length),
            fileSha256: fileSha256B64,
            fileEncSha256: fileEncSha256B64,
            mediaKey: mediaKeyB64,
            directPath: sm.directPath,
            packDescription,
            mediaKeyTimestamp: String(Math.floor(Date.now() / 1000)),
            trayIconFileName: trayFileName,
            thumbnailDirectPath: sm.directPath,
            thumbnailSha256: fileSha256B64,
            thumbnailEncSha256: fileEncSha256B64,
            thumbnailHeight: 252,
            thumbnailWidth: 252,
            stickerPackSize: String(packBuffer.length),
            stickerPackOrigin: 'USER_CREATED'
        };
        
        await sock.relayMessage(jid, { stickerPackMessage }, {});
        
        console.log(`[StickerPack] Sent "${packname}" with ${stickerMeta.length} stickers`);
        
        return { key: { id: stickerPackId } };
    };
    
    if (!global.stickerPackCache) {
        global.stickerPackCache = new Map();
    }
    
    sock.saveStickerPack = (packId, messageContent, packName = 'Unknown') => {
        global.stickerPackCache.set(packId, {
            message: messageContent,
            name: packName,
            savedAt: Date.now()
        });
        console.log(`[StickerPack] Saved pack "${packName}" (${packId})`);
    };
    
    sock.getSavedPacks = () => {
        const packs = [];
        for (const [id, data] of global.stickerPackCache.entries()) {
            packs.push({ id, name: data.name, savedAt: data.savedAt });
        }
        return packs;
    };
    
    sock.forwardStickerPack = async (jid, packIdOrMessage, m) => {
        const { generateWAMessageFromContent } = require('ourin');
        const crypto = require('crypto');
        
        let messageContent;
        
        if (typeof packIdOrMessage === 'string') {
            const cached = global.stickerPackCache.get(packIdOrMessage);
            if (!cached) {
                throw new Error(`Sticker pack "${packIdOrMessage}" not found in cache`);
            }
            messageContent = cached.message;
        } else if (packIdOrMessage?.stickerPackMessage) {
            messageContent = packIdOrMessage;
        } else {
            throw new Error('Invalid sticker pack message format');
        }
        
        const message = generateWAMessageFromContent(jid, messageContent, {
            quoted: m,
            userJid: sock.user?.id,
            messageId: crypto.randomBytes(8).toString('hex').toUpperCase()
        });
        
        await sock.relayMessage(jid, message.message, { messageId: message.key.id });
        
        console.log(`[StickerPack] Forwarded pack to ${jid}`);
        
        return message;
    };
    
    /**
     * Send file (auto-detect type)
     */
    sock.sendFile = async (jid, input, options = {}) => {
        let buffer;
        let filename = options.filename || 'file';
        let mimetype = options.mimetype;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
                filename = options.filename || path.basename(new URL(input).pathname) || 'file';
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
                filename = options.filename || path.basename(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        if (!mimetype) {
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.mp4': 'video/mp4',
                '.mp3': 'audio/mpeg',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
                '.zip': 'application/zip'
            };
            mimetype = mimeTypes[ext] || 'application/octet-stream';
        }
        
        let messageContent = {};
        
        if (mimetype.startsWith('image/')) {
            messageContent.image = buffer;
            if (options.caption) messageContent.caption = options.caption;
        } else if (mimetype.startsWith('video/')) {
            messageContent.video = buffer;
            messageContent.mimetype = mimetype;
            if (options.caption) messageContent.caption = options.caption;
        } else if (mimetype.startsWith('audio/')) {
            messageContent.audio = buffer;
            messageContent.mimetype = mimetype;
            messageContent.ptt = options.ptt || false;
        } else {
            messageContent.document = buffer;
            messageContent.mimetype = mimetype;
            messageContent.fileName = filename;
            if (options.caption) messageContent.caption = options.caption;
        }
        
        return sock.sendMessage(jid, messageContent, {
            quoted: options.quoted
        });
    };
    
    /**
     * Send contact card
     */
    sock.sendContact = async (jid, contacts, options = {}) => {
        const contactArray = Array.isArray(contacts) ? contacts : [contacts];
        
        const vcards = contactArray.map(contact => {
            const name = contact.name || 'Unknown';
            const number = contact.number?.replace(/[^0-9]/g, '') || '';
            const org = contact.org || '';
            
            let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
            vcard += `FN:${name}\n`;
            if (org) vcard += `ORG:${org}\n`;
            vcard += `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n`;
            vcard += `END:VCARD`;
            
            return { vcard };
        });
        
        const displayName = contactArray.length === 1 
            ? contactArray[0].name || 'Contact'
            : `${contactArray.length} Contacts`;
        
        return sock.sendMessage(jid, {
            contacts: {
                displayName,
                contacts: vcards
            }
        }, {
            quoted: options.quoted
        });
    };
    
    /**
     * Download media message and save to file
     */
    sock.downloadAndSaveMediaMessage = async (msg, savePath = null) => {
        const message = msg.message || msg;
        const type = getContentType(message);
        
        if (!type) {
            throw new Error('No media found in message');
        }
        
        const buffer = await downloadMediaMessage(
            { message },
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );
        
        let savedPath = null;
        
        if (savePath) {
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(savePath, buffer);
            savedPath = savePath;
        }
        
        return {
            buffer,
            path: savedPath,
            type
        };
    };
    
    /**
     * Get name/pushName from a JID
     * Handles LID resolution for groups
     * @param {string} jid - Target JID
     * @param {string} [groupJid] - Optional group JID for LID resolution
     * @returns {Promise<string>} Name or phone number fallback
     */
    sock.getName = async (jid, groupJid = null) => {
        if (!jid) return 'Unknown';
        
        const { isLid, isLidConverted, resolveAnyLidToJid, getCachedJid } = require('./lidHelper');
        
        let id = jid;
        if (isLid(jid) || isLidConverted(jid)) {
            const cached = getCachedJid(jid);
            if (cached) {
                id = cached;
            } else if (groupJid) {
                try {
                    const groupMeta = await sock.groupMetadata(groupJid);
                    id = resolveAnyLidToJid(jid, groupMeta.participants || []);
                } catch {
                    id = jid.replace('@lid', '@s.whatsapp.net');
                }
            } else {
                id = jid.replace('@lid', '@s.whatsapp.net');
            }
        }
        
        if (id.endsWith('@g.us')) {
            try {
                let v = sock.store?.contacts?.[id] || {};
                if (!(v.name || v.subject)) {
                    v = await sock.groupMetadata(id).catch(() => ({}));
                }
                return v.name || v.subject || id.split('@')[0];
            } catch {
                return id.split('@')[0];
            }
        }
        
        if (id === '0@s.whatsapp.net') {
            return 'WhatsApp';
        }
        
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (id === botId) {
            return sock.user?.name || sock.user?.verifiedName || 'Bot';
        }
        
        let v = sock.store?.contacts?.[id] || {};
        
        if (v.name) return v.name;
        if (v.notify) return v.notify;
        if (v.pushName) return v.pushName;
        if (v.verifiedName) return v.verifiedName;
        if (v.subject) return v.subject;
        
        if (groupJid) {
            try {
                const groupMeta = await sock.groupMetadata(groupJid);
                const targetNum = id.replace(/[^0-9]/g, '');
                const participant = groupMeta.participants?.find(p => {
                    const pNum = (p.jid || p.id || '').replace(/[^0-9]/g, '');
                    return pNum === targetNum;
                });
                if (participant) {
                    const pJid = participant.jid || participant.id || '';
                    if (sock.store?.contacts?.[pJid]) {
                        const contact = sock.store.contacts[pJid];
                        if (contact.name) return contact.name;
                        if (contact.notify) return contact.notify;
                        if (contact.pushName) return contact.pushName;
                    }
                }
            } catch {}
        }
        
        try {
            if (sock.getBusinessProfile) {
                const profile = await sock.getBusinessProfile(id).catch(() => null);
                if (profile?.wid?.user) {
                    const profileName = profile.name || profile.pushname || profile.verifiedName;
                    if (profileName) {
                        if (sock.store?.contacts) {
                            sock.store.contacts[id] = { ...sock.store.contacts[id], name: profileName };
                        }
                        return profileName;
                    }
                }
            }
        } catch {}
        
        try {
            if (sock.onWhatsApp) {
                const [result] = await sock.onWhatsApp(id).catch(() => []);
                if (result?.exists && result?.jid) {
                    const contactJid = result.jid;
                    if (sock.store?.contacts?.[contactJid]) {
                        const contact = sock.store.contacts[contactJid];
                        if (contact.name) return contact.name;
                        if (contact.notify) return contact.notify;
                    }
                }
            }
        } catch {}
        
        const number = id.replace(/@.+/g, '');
        if (number && number.length > 0) {
            if (number.startsWith('62')) {
                return '+62' + number.slice(2);
            }
            return '+' + number;
        }
        
        return 'Unknown';
    };

    
    /**
     * Get name from group participant (with cacing :c)
     * @param {string} jid - Target JID
     * @param {Object[]} participants - Group participants array
     * @returns {string} Name or phone number
     */
    sock.getNameFromParticipants = (jid, participants = []) => {
        if (!jid) return 'Unknown';
        
        const { isLid, isLidConverted, resolveAnyLidToJid } = require('./lidHelper');
        
        let resolvedJid = jid;
        
        if (isLid(jid) || isLidConverted(jid)) {
            resolvedJid = resolveAnyLidToJid(jid, participants);
        }
        
        const targetNum = resolvedJid.replace(/[^0-9]/g, '');
        const participant = participants.find(p => {
            const pNum = (p.jid || p.id || '').replace(/[^0-9]/g, '');
            return pNum === targetNum;
        });
        
        if (participant) {
            const pJid = participant.jid || participant.id || '';
            if (sock.store?.contacts?.[pJid]) {
                const contact = sock.store.contacts[pJid];
                if (contact.name) return contact.name;
                if (contact.notify) return contact.notify;
            }
        }
        const number = resolvedJid.replace(/@.+/g, '');
        if (number.startsWith('62')) {
            return '0' + number.slice(2);
        }
        return number || 'Unknown';
    };

    sock.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
    };

    sock.reply = (jid, text = '', quoted, options = {}) => {
        return Buffer.isBuffer(text) 
            ? sock.sendMessage(jid, { document: text, ...options }, { quoted })
            : sock.sendMessage(jid, { ...options, text, mentions: sock.parseMention(text) }, { quoted, ...options, mentions: sock.parseMention(text) });
    };

    sock.cMod = async (jid, message, text = '', sender = sock.user?.id, options = {}) => {
        const { proto, areJidsSameUser } = require('ourin');
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions];
        let copy = message.toJSON ? message.toJSON() : JSON.parse(JSON.stringify(message));
        delete copy.message?.messageContextInfo;
        delete copy.message?.senderKeyDistributionMessage;
        let mtype = Object.keys(copy.message || {})[0];
        let msg = copy.message;
        let content = msg?.[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content?.caption) content.caption = text || content.caption;
        else if (content?.text) content.text = text || content.text;
        if (typeof content !== 'string' && content) {
            msg[mtype] = { ...content, ...options };
            msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
            };
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant;
        else if (copy.key?.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key?.remoteJid?.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key?.remoteJid?.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, sock.user?.id) || false;
        return proto.WebMessageInfo.create(copy);
    };

    sock.cMods = (jid, message, text = '', sender = sock.user?.id, options = {}) => {
        const { proto, areJidsSameUser } = require('ourin');
        let copy = message.toJSON ? message.toJSON() : JSON.parse(JSON.stringify(message));
        let mtype = Object.keys(copy.message || {})[0];
        let isEphemeral = false;
        if (isEphemeral) {
            mtype = Object.keys(copy.message?.ephemeralMessage?.message || {})[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg?.[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content?.caption) content.caption = text || content.caption;
        else if (content?.text) content.text = text || content.text;
        if (typeof content !== 'string' && content) msg[mtype] = { ...content, ...options };
        if (copy.participant) sender = copy.participant = sender || copy.participant;
        else if (copy.key?.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key?.remoteJid?.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key?.remoteJid?.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, sock.user?.id) || false;
        return proto.WebMessageInfo.create(copy);
    };

    sock.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
        const { generateForwardMessageContent, generateWAMessageFromContent } = require('ourin');
        let m = generateForwardMessageContent(message, !!forwardingScore);
        let mtype = Object.keys(m)[0];
        if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) {
            m[mtype].contextInfo = m[mtype].contextInfo || {};
            m[mtype].contextInfo.forwardingScore = (m[mtype].contextInfo.forwardingScore || 0) + forwardingScore;
        }
        if (options.quoted) {
            m[mtype].contextInfo = m[mtype].contextInfo || {};
            m[mtype].contextInfo.quotedMessage = options.quoted.message;
            m[mtype].contextInfo.stanzaId = options.quoted.key?.id;
            m[mtype].contextInfo.participant = options.quoted.key?.participant || options.quoted.key?.remoteJid;
            m[mtype].contextInfo.remoteJid = options.quoted.key?.remoteJid;
        }
        m = generateWAMessageFromContent(jid, m, { ...options, userJid: sock.user?.id });
        await sock.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } });
        return m;
    };

    sock.fakeReply = async (jid, text = '', fakeJid = sock.user?.id, fakeText = '', fakeGroupJid, options = {}) => {
        const { areJidsSameUser } = require('ourin');
        return sock.reply(jid, text, { 
            key: { 
                fromMe: areJidsSameUser(fakeJid, sock.user?.id), 
                participant: fakeJid, 
                ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) 
            }, 
            message: { conversation: fakeText }, 
            ...options 
        });
    };
    
    return sock;
}

module.exports = {
    extendSocket,
    downloadBuffer,
    imageToWebp,
    videoToWebp,
    simpleImageToWebp,
    getTempDir
};
