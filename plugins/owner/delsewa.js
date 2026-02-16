const { getDatabase } = require('../../src/lib/database')

const pluginConfig = {
    name: 'delsewa',
    alias: ['sewadel', 'hapussewa', 'removesewa'],
    category: 'owner',
    description: 'Hapus grup dari whitelist sewa',
    usage: '.delsewa <link/id grup>',
    example: '.delsewa https://chat.whatsapp.com/xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.text?.trim()
    
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }
    
    let groupId = null
    let groupName = null
    
    if (!input) {
        if (!m.isGroup) {
            return m.reply(
                `📝 *ᴅᴇʟ sᴇᴡᴀ*\n\n` +
                `> Hapus dari private: \`${m.prefix}delsewa <link/id grup>\`\n` +
                `> Hapus di grup: ketik \`${m.prefix}delsewa\` di grup`
            )
        }
        groupId = m.chat
    } else if (input.includes('chat.whatsapp.com/')) {
        try {
            const inviteCode = input.split('chat.whatsapp.com/')[1]?.split(/[\s?]/)[0]
            const metadata = await sock.groupGetInviteInfo(inviteCode)
            if (metadata?.id) {
                groupId = metadata.id
                groupName = metadata.subject
            }
        } catch (e) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link tidak valid atau grup tidak ditemukan`)
        }
    } else {
        groupId = input.includes('@g.us') ? input : input + '@g.us'
    }
    
    if (!groupId) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Tidak dapat menentukan grup`)
    }
    
    const sewaData = db.db.data.sewa.groups[groupId]
    if (!sewaData) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Grup tidak terdaftar dalam sistem sewa`)
    }
    
    groupName = groupName || sewaData.name || groupId.split('@')[0]
    
    delete db.db.data.sewa.groups[groupId]
    db.db.write()
    
    m.react('✅')
    return m.reply(
        `✅ *sᴇᴡᴀ ᴅɪʜᴀᴘᴜs*\n\n` +
        `> Grup: \`${groupName}\`\n` +
        `> ID: \`${groupId.split('@')[0]}\`\n\n` +
        `⚠️ _Jika sewabot aktif, bot akan keluar dari grup ini_`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
