const pluginConfig = {
    name: [
        'bego', 'goblok', 'janda', 'perawan', 'babi', 'tolol', 'pekok', 
        'jancok', 'pinter', 'pintar', 'asu', 'bodoh', 'gay', 'lesby',
        'bajingan', 'anjing', 'anjg', 'anjj', 'anj', 'ngentod', 'ngentot',
        'monyet', 'mastah', 'newbie', 'bangsat', 'bangke', 'sange', 'sangean',
        'dakjal', 'horny', 'wibu', 'puki', 'puqi', 'peak', 'pantex', 'pantek',
        'setan', 'iblis', 'cacat', 'yatim', 'piatu', 'ganteng', 'cantik',
        'jelek', 'keren', 'cupu', 'noob', 'pro', 'sultan', 'miskin', 'kaya', 'siapa'
    ],
    alias: [],
    category: 'fun',
    description: 'Random pilih member untuk kategori tertentu',
    usage: '.<kategori>',
    example: '.ganteng',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const command = m.command?.toLowerCase()
    
    m.react('🎲')
    
    try {
        const groupMeta = await sock.groupMetadata(m.chat)
        const participants = groupMeta.participants || []
        
        const members = participants
            .map(p => p.id || p.jid)
            .filter(id => id && id !== sock.user?.id?.split(':')[0] + '@s.whatsapp.net')
        
        if (members.length === 0) {
            return m.reply(`❌ Tidak ada member di grup!`)
        }
        
        const randomMember = members[Math.floor(Math.random() * members.length)]
        
        const positiveWords = ['ganteng', 'cantik', 'keren', 'pro', 'sultan', 'kaya', 'pinter', 'pintar', 'mastah']
        const isPositive = positiveWords.includes(command)
        
        const emoji = isPositive ? '✨' : '😏'
        const label = isPositive ? 'Yang paling' : 'Anak'
        
        await sock.sendMessage(m.chat, {
            text: `╭┈┈⬡「 ${emoji} *ʀᴀɴᴅᴏᴍ ᴘɪᴄᴋ* 」
┃ ㊗ ᴋᴀᴛᴇɢᴏʀɪ: *${command}*
┃ ㊗ ᴛᴇʀᴘɪʟɪʜ: @${randomMember.split('@')[0]}
╰┈┈⬡

> _${label} ${command} di sini adalah_ \`@${randomMember.split('@')[0]}\``,
            mentions: [randomMember]
        }, { quoted: m })
        
    } catch (error) {
        m.react('❌')
        m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
