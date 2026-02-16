const pluginConfig = {
    name: 'add',
    alias: ['addmember', 'invite'],
    category: 'group',
    description: 'Menambahkan member ke grup (support multiple)',
    usage: '.add <nomor1> [nomor2] [nomor3]... [link_grup]',
    example: '.add 6281234567890 6289876543210',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    
    if (args.length === 0) {
        return m.reply(
            `👥 *ᴀᴅᴅ ᴍᴇᴍʙᴇʀ*\n\n` +
            `> Cara pakai:\n` +
            `> 1. Di grup: \`${m.prefix}add <nomor>\`\n` +
            `> 2. Multiple: \`${m.prefix}add <nomor1> <nomor2> ...\`\n` +
            `> 3. Di private: \`${m.prefix}add <nomor> <link_grup>\`\n\n` +
            `> Contoh:\n` +
            `> \`${m.prefix}add 6281234567890\`\n` +
            `> \`${m.prefix}add 628123 628456 628789\`\n` +
            `> \`${m.prefix}add 628123 https://chat.whatsapp.com/xxx\`\n\n` +
            `> Syarat:\n` +
            `> - Bot harus admin di grup target\n` +
            `> - Yang jalankan command harus admin`
        )
    }
    
    let targetGroup = m.isGroup ? m.chat : null
    let targetNumbers = []
    
    for (const arg of args) {
        const linkMatch = arg.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/)
        if (linkMatch) {
            try {
                const groupInfo = await sock.groupGetInviteInfo(linkMatch[1])
                targetGroup = groupInfo.id
            } catch (e) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link grup tidak valid atau sudah expired!`)
            }
        } else if (arg.includes('@g.us')) {
            targetGroup = arg
        } else {
            let num = arg.replace(/[^0-9]/g, '')
            if (num.startsWith('0')) {
                num = '62' + num.slice(1)
            }
            if (num.length >= 10) {
                targetNumbers.push(num)
            }
        }
    }
    
    if (targetNumbers.length === 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Masukkan nomor yang valid!`)
    }
    
    if (!targetGroup) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Jalankan di grup atau sertakan link grup!\n\n\`${m.prefix}add <nomor> <link_grup>\``)
    }
    
    try {
        const groupMeta = await sock.groupMetadata(targetGroup)
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
        const botParticipant = groupMeta.participants.find(p => 
            p.id === botId || p.jid === botId || p.id?.includes(sock.user?.id?.split(':')[0])
        )
        
        if (!botParticipant || !['admin', 'superadmin'].includes(botParticipant.admin)) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot bukan admin di grup *${groupMeta.subject}*!`)
        }
        
        if (!m.isGroup) {
            const senderId = m.sender?.split('@')[0]
            const senderParticipant = groupMeta.participants.find(p => 
                p.id?.includes(senderId) || p.jid?.includes(senderId)
            )
            
            if (!senderParticipant || !['admin', 'superadmin'].includes(senderParticipant.admin)) {
                return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Kamu bukan admin di grup *${groupMeta.subject}*!`)
            }
        }
        
        const validNumbers = []
        const alreadyInGroup = []
        
        for (const num of targetNumbers) {
            const existingMember = groupMeta.participants.find(p => 
                p.id?.includes(num) || p.jid?.includes(num)
            )
            
            if (existingMember) {
                alreadyInGroup.push(num)
            } else {
                validNumbers.push(num + '@s.whatsapp.net')
            }
        }
        
        if (validNumbers.length === 0) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Semua nomor sudah ada di grup!`)
        }
        
        m.react('⏳')
        
        const results = await sock.groupParticipantsUpdate(targetGroup, validNumbers, 'add')
        
        let successList = []
        let invitedList = []
        let failedList = []
        
        for (const res of results) {
            const num = res.jid?.replace('@s.whatsapp.net', '') || ''
            
            if (res.status === '200') {
                successList.push(num)
            } else if (res.status === '408') {
                invitedList.push(num)
            } else {
                failedList.push({ num, status: res.status })
            }
        }
        
        let resultText = `👥 *ᴀᴅᴅ ᴍᴇᴍʙᴇʀ*\n\n`
        resultText += `╭┈┈⬡「 📋 *ʜᴀsɪʟ* 」\n`
        resultText += `┃ 👥 ɢʀᴜᴘ: \`${groupMeta.subject}\`\n`
        resultText += `┃ 📊 ᴛᴏᴛᴀʟ: \`${targetNumbers.length}\` nomor\n`
        resultText += `╰┈┈⬡\n\n`
        
        if (successList.length > 0) {
            resultText += `✅ *ʙᴇʀʜᴀsɪʟ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ (${successList.length}):*\n`
            successList.forEach(n => resultText += `> • ${n}\n`)
            resultText += `\n`
        }
        
        if (invitedList.length > 0) {
            resultText += `📨 *ᴜɴᴅᴀɴɢᴀɴ ᴅɪᴋɪʀɪᴍ (${invitedList.length}):*\n`
            invitedList.forEach(n => resultText += `> • ${n}\n`)
            resultText += `\n`
        }
        
        if (failedList.length > 0) {
            resultText += `❌ *ɢᴀɢᴀʟ (${failedList.length}):*\n`
            failedList.forEach(f => resultText += `> • ${f.num} (${f.status})\n`)
            resultText += `\n`
        }
        
        if (alreadyInGroup.length > 0) {
            resultText += `⏭️ *sᴜᴅᴀʜ ᴅɪ ɢʀᴜᴘ (${alreadyInGroup.length}):*\n`
            alreadyInGroup.forEach(n => resultText += `> • ${n}\n`)
        }
        
        m.react(successList.length > 0 || invitedList.length > 0 ? '✅' : '❌')
        await m.reply(resultText)
        
    } catch (error) {
        m.react('❌')
        
        if (error.message?.includes('not-authorized')) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot tidak memiliki izin untuk menambah member!`)
        } else if (error.message?.includes('forbidden')) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot tidak memiliki akses ke grup ini!`)
        } else {
            await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
