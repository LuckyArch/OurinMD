const { getAllPlugins } = require('../../src/lib/plugins')
const { createCanvas } = require('@napi-rs/canvas')
const config = require('../../config')

const pluginConfig = {
    name: 'totalfitur',
    alias: ['totalfeature', 'totalcmd', 'countplugin', 'distribusi', 'stats'],
    category: 'main',
    description: 'Lihat total fitur/command bot dengan chart premium',
    usage: '.totalfitur',
    example: '.totalfitur',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energi: 0,
    isEnabled: true
}

const THEME = {
    bg: '#0a0e14',
    bgCard: '#1a1f2e',
    primary: '#00d4ff',
    secondary: '#7c3aed',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    pink: '#ec4899',
    orange: '#f97316',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    border: '#334155',
    colors: ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#f97316', '#ef4444', '#06b6d4', '#8b5cf6', '#22c55e']
}

const CATEGORY_ICONS = {
    main: '🏠',
    tools: '🔧',
    downloader: '📥',
    download: '📥',
    sticker: '🎨',
    ai: '🤖',
    media: '📷',
    game: '🎮',
    rpg: '⚔️',
    maker: '🖼️',
    fun: '🎭',
    group: '👥',
    owner: '👑',
    premium: '💎',
    info: '📊',
    search: '🔍',
    canvas: '🎨',
    anime: '🌸',
    nsfw: '🔞',
    utility: '🛠️',
    economy: '💰',
    other: '📦'
}

async function createPremiumChart(categories, totalCommands, enabledCommands) {
    const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)
    const topCategories = sorted.slice(0, 10)
    
    const W = 900
    const H = 650
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0a0e14')
    bgGrad.addColorStop(0.5, '#0f1419')
    bgGrad.addColorStop(1, '#0a0e14')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    ctx.globalAlpha = 0.02
    for (let i = 0; i < W; i += 40) {
        ctx.strokeStyle = THEME.primary
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, H)
        ctx.stroke()
    }
    for (let i = 0; i < H; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(W, i)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
    
    const glowGrad = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, 400)
    glowGrad.addColorStop(0, `${THEME.secondary}15`)
    glowGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGrad
    ctx.fillRect(0, 0, W, H)
    
    ctx.save()
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 30
    ctx.fillText('📊', 35, 45)
    ctx.shadowBlur = 0
    ctx.restore()
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 26px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('DISTRIBUSI FITUR', 80, 45)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px Arial'
    ctx.fillText(`${config.bot?.name || 'Ourin-AI'} • Command Statistics`, 80, 72)
    
    const statBoxes = [
        { label: 'TOTAL', value: totalCommands, color: THEME.primary, icon: '⚡' },
        { label: 'ENABLED', value: enabledCommands, color: THEME.success, icon: '✅' },
        { label: 'KATEGORI', value: sorted.length, color: THEME.secondary, icon: '📁' }
    ]
    
    let statX = W - 400
    statBoxes.forEach((stat, i) => {
        ctx.save()
        ctx.fillStyle = `${stat.color}20`
        ctx.beginPath()
        ctx.roundRect(statX + i * 125, 20, 115, 55, 12)
        ctx.fill()
        ctx.strokeStyle = `${stat.color}60`
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.fillStyle = stat.color
        ctx.font = 'bold 22px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = stat.color
        ctx.shadowBlur = 10
        ctx.fillText(`${stat.icon} ${stat.value}`, statX + i * 125 + 57, 42)
        ctx.shadowBlur = 0
        
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '9px Arial'
        ctx.fillText(stat.label, statX + i * 125 + 57, 62)
        ctx.restore()
    })
    
    const grad = ctx.createLinearGradient(35, 95, W - 35, 95)
    grad.addColorStop(0, THEME.primary)
    grad.addColorStop(0.5, THEME.secondary)
    grad.addColorStop(1, THEME.pink)
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(35, 95)
    ctx.lineTo(W - 35, 95)
    ctx.stroke()
    
    const pieX = 160
    const pieY = 280
    const pieR = 110
    
    ctx.save()
    ctx.fillStyle = `${THEME.primary}10`
    ctx.beginPath()
    ctx.arc(pieX, pieY, pieR + 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    
    let startAngle = -Math.PI / 2
    topCategories.forEach(([cat, data], i) => {
        const sliceAngle = (data.total / totalCommands) * Math.PI * 2
        const color = THEME.colors[i % THEME.colors.length]
        
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(pieX, pieY)
        ctx.arc(pieX, pieY, pieR, startAngle, startAngle + sliceAngle)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.restore()
        
        ctx.beginPath()
        ctx.moveTo(pieX, pieY)
        ctx.arc(pieX, pieY, pieR, startAngle, startAngle + sliceAngle)
        ctx.closePath()
        ctx.strokeStyle = '#0a0e14'
        ctx.lineWidth = 2
        ctx.stroke()
        
        startAngle += sliceAngle
    })
    
    ctx.save()
    ctx.beginPath()
    ctx.arc(pieX, pieY, 50, 0, Math.PI * 2)
    ctx.fillStyle = THEME.bg
    ctx.fill()
    ctx.strokeStyle = THEME.border
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(totalCommands.toString(), pieX, pieY - 5)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.fillText('COMMANDS', pieX, pieY + 18)
    ctx.restore()
    
    const barStartX = 330
    const barStartY = 130
    const barWidth = 320
    const barHeight = 24
    const barGap = 44
    const maxVal = Math.max(...topCategories.map(([, d]) => d.total))
    
    topCategories.forEach(([cat, data], i) => {
        const y = barStartY + i * barGap
        const pct = ((data.total / totalCommands) * 100).toFixed(1)
        const fillWidth = (data.total / maxVal) * barWidth
        const color = THEME.colors[i % THEME.colors.length]
        const icon = CATEGORY_ICONS[cat] || '📦'
        
        ctx.fillStyle = THEME.textPrimary
        ctx.font = 'bold 11px Arial'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${icon} ${cat.toUpperCase()}`, barStartX - 12, y + barHeight / 2)
        
        ctx.beginPath()
        ctx.roundRect(barStartX, y, barWidth, barHeight, 6)
        ctx.fillStyle = THEME.border
        ctx.fill()
        
        if (fillWidth > 8) {
            ctx.save()
            const barGrad = ctx.createLinearGradient(barStartX, 0, barStartX + fillWidth, 0)
            barGrad.addColorStop(0, color)
            barGrad.addColorStop(1, `${color}80`)
            
            ctx.beginPath()
            ctx.roundRect(barStartX, y, fillWidth, barHeight, 6)
            ctx.fillStyle = barGrad
            ctx.shadowColor = color
            ctx.shadowBlur = 10
            ctx.fill()
            ctx.restore()
            
            if (fillWidth > 35) {
                ctx.fillStyle = '#fff'
                ctx.font = 'bold 10px Arial'
                ctx.textAlign = 'left'
                ctx.textBaseline = 'middle'
                ctx.fillText(data.total.toString(), barStartX + 10, y + barHeight / 2)
            }
        }
        
        ctx.fillStyle = THEME.textSecondary
        ctx.font = '10px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${pct}%`, barStartX + barWidth + 12, y + barHeight / 2)
    })
    
    ctx.save()
    ctx.fillStyle = `${THEME.secondary}15`
    ctx.beginPath()
    ctx.roundRect(700, 125, 170, 400, 15)
    ctx.fill()
    ctx.strokeStyle = `${THEME.secondary}40`
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📋 ALL CATEGORIES', 785, 150)
    
    let legendY = 180
    sorted.forEach(([cat, data], i) => {
        const color = THEME.colors[i % THEME.colors.length]
        const icon = CATEGORY_ICONS[cat] || '📦'
        const pct = ((data.total / totalCommands) * 100).toFixed(0)
        
        ctx.beginPath()
        ctx.arc(720, legendY, 5, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        
        ctx.fillStyle = THEME.textPrimary
        ctx.font = '10px Arial'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${icon} ${cat}`, 732, legendY)
        
        ctx.fillStyle = THEME.textSecondary
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'right'
        ctx.fillText(`${data.total} (${pct}%)`, 858, legendY)
        
        legendY += 22
    })
    ctx.restore()
    
    ctx.save()
    ctx.fillStyle = `${THEME.primary}10`
    ctx.fillRect(0, H - 55, W, 55)
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 15
    ctx.fillText(`⚡ ${totalCommands} TOTAL COMMANDS AVAILABLE`, W / 2, H - 32)
    ctx.shadowBlur = 0
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.fillText(`Generated at ${require('moment-timezone')().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm')} WIB`, W / 2, H - 12)
    ctx.restore()
    
    return canvas.toBuffer('image/png')
}

async function handler(m, { sock }) {
    try {
        const allPlugins = getAllPlugins()
        
        const categories = {}
        let totalCommands = 0
        let enabledCommands = 0
        
        for (const plugin of allPlugins) {
            if (!plugin.config) continue
            
            const cat = plugin.config.category || 'other'
            if (!categories[cat]) {
                categories[cat] = { total: 0, enabled: 0 }
            }
            
            categories[cat].total++
            totalCommands++
            
            if (plugin.config.isEnabled !== false) {
                categories[cat].enabled++
                enabledCommands++
            }
        }
        
        await m.react('📊')
        
        const chartBuffer = await createPremiumChart(categories, totalCommands, enabledCommands)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const sorted = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)
        
        let caption = `📊 *ᴅɪsᴛʀɪʙᴜsɪ ꜰɪᴛᴜʀ ʙᴏᴛ*\n\n`
        caption += `╭┈┈⬡「 📈 *sᴛᴀᴛɪsᴛɪᴋ* 」\n`
        caption += `┃ ◦ Total Commands: *${totalCommands}*\n`
        caption += `┃ ◦ Enabled: *${enabledCommands}*\n`
        caption += `┃ ◦ Disabled: *${totalCommands - enabledCommands}*\n`
        caption += `┃ ◦ Categories: *${sorted.length}*\n`
        caption += `╰┈┈⬡\n\n`
        caption += `╭┈┈⬡「 📋 *ᴋᴀᴛᴇɢᴏʀɪ* 」\n`
        
        sorted.forEach(([cat, data]) => {
            const pct = ((data.total / totalCommands) * 100).toFixed(1)
            const icon = CATEGORY_ICONS[cat] || '📦'
            caption += `┃ ${icon} \`${cat.toUpperCase()}\`: *${data.total}* _(${pct}%)_\n`
        })
        caption += `╰┈┈⬡\n\n`
        caption += `> ⚡ *${totalCommands}* fitur tersedia`
        
        await sock.sendMessage(m.chat, {
            image: chartBuffer,
            caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
