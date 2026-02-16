const config = require('../../config');
const { getDatabase } = require('../../src/lib/database');
const { generateWAMessageFromContent, proto } = require('ourin');

const pluginConfig = {
    name: 'setmenu',
    alias: ['menuvariant', 'menustyle'],
    category: 'owner',
    description: 'Mengatur variant tampilan menu',
    usage: '.setmenu <v1-v11>',
    example: '.setmenu v8',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energi: 0,
    isEnabled: true
};

const VARIANTS = {
    v1: { id: 1, name: 'Simple', desc: 'Image biasa tanpa contextInfo' },
    v2: { id: 2, name: 'Standard', desc: 'Image + full contextInfo (default)' },
    v3: { id: 3, name: 'Document', desc: 'Document + jpegThumbnail + verified quoted' },
    v4: { id: 4, name: 'Video', desc: 'Video + contextInfo + verified quoted' },
    v5: { id: 5, name: 'Button', desc: 'Image + buttons (single_select & quick_reply)' },
    v6: { id: 6, name: 'Document Premium', desc: 'Document + jpegThumbnail 1280x450 + full contextInfo' },
    v7: { id: 7, name: 'Carousel', desc: 'Swipeable cards per kategori (modern)' },
    v8: { id: 8, name: 'Minimalist', desc: 'Image + ftroli quoted + fresh design' },
    v9: { id: 9, name: 'NativeFlow', desc: 'Interactive + limited_time_offer + bottom_sheet + single_select' },
    v10: { id: 10, name: 'NativeFlow', desc: 'OURINNNNNNNNNN' },
    v11: { id: 11, name: 'Document Interactive', desc: 'Document + nativeFlowMessage + limited_time_offer + cta buttons' }
};

async function handler(m, { sock, db }) {
    const args = m.args || [];
    const variant = args[0]?.toLowerCase();

    if (variant) {
        const selected = VARIANTS[variant];
        if (!selected) {
            await m.reply(`❌ Variant tidak valid!\n\nGunakan: v1 s/d v11`);
            return;
        }

        db.setting('menuVariant', selected.id);
        await db.save();

        await m.reply(
            `✅ Menu variant diubah ke *V${selected.id}*\n\n` +
            `> *${selected.name}*\n` +
            `> _${selected.desc}_`
        );
        return;
    }

    const current = db.setting('menuVariant') || config.ui?.menuVariant || 2;

    const rows = Object.entries(VARIANTS).map(([key, val]) => ({
        title: `${key.toUpperCase()}${val.id === current ? ' ✓' : ''} — ${val.name}`,
        description: val.desc,
        id: `${m.prefix}setmenu ${key}`
    }));

    const bodyText =
        `🎨 *sᴇᴛ ᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ*\n\n` +
        `> Variant aktif: *V${current}*\n` +
        `> _${VARIANTS[`v${current}`]?.name || 'Unknown'}_\n\n` +
        `> Pilih variant dari daftar di bawah`;

    try {
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🎨 ᴘɪʟɪʜ ᴠᴀʀɪᴀɴᴛ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴠᴀʀɪᴀɴᴛ ᴍᴇɴᴜ',
                        rows
                    }]
                })
            }
        ];

        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: bodyText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: config.bot?.name || 'Ourin-AI'
                        }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: '🎨 Menu Variant',
                            subtitle: `${Object.keys(VARIANTS).length} variant tersedia`,
                            hasMediaAttachment: false
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: interactiveButtons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: config.saluran?.id || '120363208449943317@newsletter',
                                newsletterName: config.saluran?.name || config.bot?.name || 'Ourin-AI',
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m });

        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    } catch {
        let txt = `🎨 *sᴇᴛ ᴍᴇɴᴜ ᴠᴀʀɪᴀɴᴛ*\n\n`;
        txt += `> Variant saat ini: *V${current}*\n\n`;
        for (const [key, val] of Object.entries(VARIANTS)) {
            const mark = val.id === current ? ' ✓' : '';
            txt += `> *${key.toUpperCase()}*${mark} — _${val.desc}_\n`;
        }
        txt += `\n_Gunakan: \`.setmenu v1\` dst._`;
        await m.reply(txt);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
