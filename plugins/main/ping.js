const { createCanvas } = require('@napi-rs/canvas')
const { performance } = require('perf_hooks')
const os = require('os')
const { execSync } = require('child_process')
const config = require('../../config')

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
    glow: '#00d4ff'
}

const pluginConfig = {
    name: 'ping',
    alias: ['speed', 'p', 'latency', 'sys', 'status'],
    category: 'main',
    description: 'Cek kecepatan respon bot dengan dashboard lengkap',
    usage: '.ping',
    example: '.ping',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energi: 0,
    isEnabled: true
}

const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
}

const formatTime = (seconds) => {
    seconds = Number(seconds)
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor(seconds % (3600 * 24) / 3600)
    const m = Math.floor(seconds % 3600 / 60)
    const s = Math.floor(seconds % 60)
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
}

function drawGlowCircle(ctx, x, y, radius, percent, color, icon, label, value) {
    ctx.save()
    
    ctx.beginPath()
    ctx.arc(x, y, radius + 8, 0, Math.PI * 2)
    ctx.fillStyle = `${color}15`
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = THEME.border
    ctx.lineWidth = 10
    ctx.stroke()
    
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + (Math.PI * 2 * (percent / 100))
    
    ctx.beginPath()
    ctx.arc(x, y, radius, startAngle, endAngle)
    ctx.strokeStyle = color
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 20
    ctx.stroke()
    
    ctx.shadowBlur = 0
    ctx.fillStyle = color
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, x, y - 8)
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 14px Arial'
    ctx.fillText(value, x, y + 22)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.fillText(label, x, y + radius + 25)
    
    ctx.restore()
}

function drawNeonCard(ctx, x, y, w, h, color) {
    ctx.save()
    
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h)
    gradient.addColorStop(0, `${color}20`)
    gradient.addColorStop(1, `${color}05`)
    
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 12)
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.strokeStyle = `${color}60`
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x, y + 3)
    ctx.lineTo(x, y + 12)
    ctx.quadraticCurveTo(x, y, x + 12, y)
    ctx.lineTo(x + 30, y)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.stroke()
    
    ctx.restore()
}

function drawStatRow(ctx, x, y, label, value, color, maxWidth = 200) {
    ctx.save()
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '11px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y)
    
    ctx.fillStyle = color || THEME.textPrimary
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'right'
    
    let displayVal = String(value)
    if (ctx.measureText(displayVal).width > maxWidth * 0.5) {
        displayVal = displayVal.substring(0, 18) + '...'
    }
    ctx.fillText(displayVal, x + maxWidth, y)
    ctx.restore()
}

function drawMiniBar(ctx, x, y, w, h, percent, color) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, h / 2)
    ctx.fillStyle = THEME.border
    ctx.fill()
    
    if (percent > 0) {
        const fillW = Math.max(h, w * (percent / 100))
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(x, y, fillW, h, h / 2)
        ctx.fillStyle = color
        ctx.shadowColor = color
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.restore()
    }
}

async function renderDashboard(stats) {
    const W = 900
    const H = 580
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, '#0a0e14')
    bgGrad.addColorStop(0.5, '#0f1419')
    bgGrad.addColorStop(1, '#0a0e14')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)
    
    ctx.globalAlpha = 0.03
    for (let i = 0; i < W; i += 50) {
        ctx.strokeStyle = THEME.primary
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, H)
        ctx.stroke()
    }
    for (let i = 0; i < H; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(W, i)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
    
    const glowGrad = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 400)
    glowGrad.addColorStop(0, `${THEME.secondary}15`)
    glowGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = glowGrad
    ctx.fillRect(0, 0, W, H)
    
    ctx.save()
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = THEME.primary
    ctx.shadowBlur = 30
    ctx.fillText('⚡', 30, 42)
    ctx.shadowBlur = 0
    ctx.restore()
    
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText('SYSTEM DASHBOARD', 65, 42)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '12px Arial'
    ctx.fillText(`${config.bot?.name || 'Ourin-AI'} • Real-time Monitoring`, 65, 65)
    
    const pingColor = stats.ping < 100 ? THEME.success : stats.ping < 300 ? THEME.warning : THEME.danger
    const pingStatus = stats.ping < 100 ? 'EXCELLENT' : stats.ping < 300 ? 'GOOD' : 'SLOW'
    
    ctx.save()
    ctx.fillStyle = `${pingColor}30`
    ctx.beginPath()
    ctx.roundRect(W - 160, 22, 130, 50, 12)
    ctx.fill()
    ctx.strokeStyle = pingColor
    ctx.lineWidth = 1
    ctx.stroke()
    
    ctx.fillStyle = pingColor
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = pingColor
    ctx.shadowBlur = 15
    ctx.fillText(`${stats.ping}ms`, W - 95, 42)
    ctx.shadowBlur = 0
    ctx.font = '9px Arial'
    ctx.fillText(pingStatus, W - 95, 60)
    ctx.restore()
    
    const grad = ctx.createLinearGradient(30, 85, W - 30, 85)
    grad.addColorStop(0, THEME.primary)
    grad.addColorStop(0.5, THEME.secondary)
    grad.addColorStop(1, THEME.pink)
    ctx.strokeStyle = grad
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(30, 85)
    ctx.lineTo(W - 30, 85)
    ctx.stroke()
    
    const gaugeY = 160
    const ramPercent = (stats.ramUsed / stats.ramTotal) * 100
    const diskPercent = stats.diskTotal > 0 ? (stats.diskUsed / stats.diskTotal) * 100 : 0
    
    drawGlowCircle(ctx, 90, gaugeY, 45, parseFloat(stats.cpuLoad), THEME.primary, '💻', 'CPU LOAD', `${stats.cpuLoad}%`)
    drawGlowCircle(ctx, 210, gaugeY, 45, ramPercent, THEME.success, '🧠', 'MEMORY', `${ramPercent.toFixed(0)}%`)
    drawGlowCircle(ctx, 330, gaugeY, 45, diskPercent, THEME.secondary, '💾', 'STORAGE', `${diskPercent.toFixed(0)}%`)
    
    drawNeonCard(ctx, 410, 105, 220, 115, THEME.primary)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('🌐 NETWORK', 425, 118)
    
    ctx.fillStyle = THEME.primary
    ctx.font = 'bold 16px Arial'
    ctx.fillText(`↓ ${formatSize(stats.networkRx)}`, 425, 145)
    
    ctx.fillStyle = THEME.pink
    ctx.fillText(`↑ ${formatSize(stats.networkTx)}`, 530, 145)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.fillText(`Interface: ${stats.networkInterface}`, 425, 175)
    ctx.fillText(`Status: ${stats.ping < 100 ? '🟢 Online' : stats.ping < 300 ? '🟡 Stable' : '🔴 Lag'}`, 425, 195)
    
    drawNeonCard(ctx, 650, 105, 220, 115, THEME.success)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('⏱️ UPTIME', 665, 118)
    
    ctx.fillStyle = THEME.success
    ctx.font = 'bold 20px Arial'
    ctx.fillText(stats.uptimeBot, 665, 148)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.fillText('Bot Runtime', 665, 178)
    ctx.fillText(`Server: ${stats.uptimeServer}`, 665, 195)
    
    const cardY = 235
    const cardH = 160
    const cardW = 270
    const cardGap = 15
    
    drawNeonCard(ctx, 30, cardY, cardW, cardH, THEME.secondary)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('🖥️ SERVER INFO', 45, cardY + 12)
    
    let rowY = cardY + 38
    const rowGap = 20
    drawStatRow(ctx, 45, rowY, 'Hostname', stats.hostname, THEME.textPrimary, 235)
    drawStatRow(ctx, 45, rowY += rowGap, 'Platform', stats.platform, THEME.primary, 235)
    drawStatRow(ctx, 45, rowY += rowGap, 'Architecture', stats.arch, THEME.textPrimary, 235)
    drawStatRow(ctx, 45, rowY += rowGap, 'Kernel', stats.release.substring(0, 18), THEME.textSecondary, 235)
    drawStatRow(ctx, 45, rowY += rowGap, 'Node.js', stats.nodeVersion, THEME.success, 235)
    drawStatRow(ctx, 45, rowY += rowGap, 'V8 Engine', stats.v8Version, THEME.secondary, 235)
    
    drawNeonCard(ctx, 30 + cardW + cardGap, cardY, cardW, cardH, THEME.primary)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('💻 CPU DETAILS', 45 + cardW + cardGap, cardY + 12)
    
    rowY = cardY + 38
    const cpuX = 45 + cardW + cardGap
    drawStatRow(ctx, cpuX, rowY, 'Model', stats.cpuModel.substring(0, 20), THEME.textPrimary, 235)
    drawStatRow(ctx, cpuX, rowY += rowGap, 'Cores', `${stats.cpuCores} cores`, THEME.primary, 235)
    drawStatRow(ctx, cpuX, rowY += rowGap, 'Speed', `${stats.cpuSpeed} MHz`, THEME.textPrimary, 235)
    drawStatRow(ctx, cpuX, rowY += rowGap, 'Load Avg', stats.loadAvg, THEME.warning, 235)
    drawStatRow(ctx, cpuX, rowY += rowGap, 'Usage', `${stats.cpuLoad}%`, parseFloat(stats.cpuLoad) > 80 ? THEME.danger : THEME.success, 235)
    rowY += rowGap + 5
    drawMiniBar(ctx, cpuX, rowY, 235, 6, parseFloat(stats.cpuLoad), parseFloat(stats.cpuLoad) > 80 ? THEME.danger : THEME.primary)
    
    drawNeonCard(ctx, 30 + (cardW + cardGap) * 2, cardY, cardW, cardH, THEME.pink)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('🧠 MEMORY DETAILS', 45 + (cardW + cardGap) * 2, cardY + 12)
    
    rowY = cardY + 38
    const memX = 45 + (cardW + cardGap) * 2
    drawStatRow(ctx, memX, rowY, 'Total RAM', formatSize(stats.ramTotal), THEME.textPrimary, 235)
    drawStatRow(ctx, memX, rowY += rowGap, 'Used', formatSize(stats.ramUsed), THEME.warning, 235)
    drawStatRow(ctx, memX, rowY += rowGap, 'Free', formatSize(stats.ramTotal - stats.ramUsed), THEME.success, 235)
    drawStatRow(ctx, memX, rowY += rowGap, 'Heap Used', stats.heapUsed, THEME.primary, 235)
    drawStatRow(ctx, memX, rowY += rowGap, 'RSS', stats.rss, THEME.pink, 235)
    rowY += rowGap + 5
    drawMiniBar(ctx, memX, rowY, 235, 6, ramPercent, ramPercent > 80 ? THEME.danger : THEME.success)
    
    const bottomY = 415
    const bottomCardW = 420
    const bottomCardH = 115
    
    drawNeonCard(ctx, 30, bottomY, bottomCardW, bottomCardH, THEME.warning)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('📊 PROCESS INFO', 45, bottomY + 12)
    
    rowY = bottomY + 38
    const col1X = 45
    const col2X = 240
    const colW = 170
    drawStatRow(ctx, col1X, rowY, 'PID', `#${stats.pid}`, THEME.warning, colW)
    drawStatRow(ctx, col2X, rowY, 'UID', stats.uid, THEME.textSecondary, colW)
    drawStatRow(ctx, col1X, rowY += rowGap, 'CWD', stats.cwd.substring(0, 15), THEME.textSecondary, colW)
    drawStatRow(ctx, col2X, rowY, 'Exec', stats.execPath, THEME.primary, colW)
    drawStatRow(ctx, col1X, rowY += rowGap, 'External', stats.external, THEME.textSecondary, colW)
    drawStatRow(ctx, col2X, rowY, 'Buffers', stats.arrayBuffers, THEME.textSecondary, colW)
    drawStatRow(ctx, col1X, rowY += rowGap, 'Handles', stats.activeHandles, THEME.success, colW)
    drawStatRow(ctx, col2X, rowY, 'Requests', stats.activeRequests, THEME.primary, colW)
    
    drawNeonCard(ctx, 30 + bottomCardW + cardGap, bottomY, bottomCardW, bottomCardH, THEME.success)
    ctx.fillStyle = THEME.textPrimary
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('💾 STORAGE & ENV', 45 + bottomCardW + cardGap, bottomY + 12)
    
    rowY = bottomY + 38
    const storX = 45 + bottomCardW + cardGap
    drawStatRow(ctx, storX, rowY, 'Total Disk', formatSize(stats.diskTotal), THEME.textPrimary, 380)
    drawStatRow(ctx, storX, rowY += rowGap, 'Used', formatSize(stats.diskUsed), THEME.warning, 380)
    drawStatRow(ctx, storX, rowY += rowGap, 'Free', formatSize(stats.diskTotal - stats.diskUsed), THEME.success, 380)
    drawStatRow(ctx, storX, rowY += rowGap, 'Environment', stats.nodeEnv || 'production', THEME.primary, 380)
    
    ctx.fillStyle = THEME.textSecondary
    ctx.font = '10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`Generated at ${require('moment-timezone')().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss')} WIB`, W / 2, H - 10)
    
    return canvas.toBuffer('image/png')
}

function getNetworkStats() {
    try {
        const interfaces = os.networkInterfaces()
        let activeInterface = 'N/A'
        
        for (const [name, addrs] of Object.entries(interfaces)) {
            if (name.toLowerCase().includes('lo')) continue
            for (const addr of addrs) {
                if (addr.family === 'IPv4' && !addr.internal) {
                    activeInterface = name
                    break
                }
            }
        }
        
        let totalRx = 0, totalTx = 0
        
        try {
            if (process.platform === 'linux') {
                const netDev = require('fs').readFileSync('/proc/net/dev', 'utf8')
                const lines = netDev.split('\n')
                for (const line of lines) {
                    if (line.includes(':') && !line.includes('lo:')) {
                        const parts = line.trim().split(/\s+/)
                        if (parts.length >= 10) {
                            const ifName = parts[0].replace(':', '')
                            const rx = parseInt(parts[1]) || 0
                            const tx = parseInt(parts[9]) || 0
                            if (ifName === activeInterface || (activeInterface === 'N/A' && rx > 0)) {
                                totalRx = rx
                                totalTx = tx
                                if (activeInterface === 'N/A') activeInterface = ifName
                                break
                            }
                        }
                    }
                }
            } else if (process.platform === 'win32') {
                const netstat = execSync('netstat -e', { encoding: 'utf-8' })
                const lines = netstat.split('\n')
                for (const line of lines) {
                    if (line.toLowerCase().includes('bytes')) {
                        const parts = line.trim().split(/\s+/)
                        if (parts.length >= 3) {
                            totalRx = parseInt(parts[1]) || 0
                            totalTx = parseInt(parts[2]) || 0
                        }
                        break
                    }
                }
                if (activeInterface === 'N/A') {
                    const firstIface = Object.keys(interfaces).find(n => !n.toLowerCase().includes('loopback'))
                    if (firstIface) activeInterface = firstIface
                }
            }
        } catch {}
        
        return { totalRx, totalTx, activeInterface }
    } catch {
        return { totalRx: 0, totalTx: 0, activeInterface: 'N/A' }
    }
}

async function handler(m, { sock }) {
    const startTime = Date.now()
    await m.react('⏳')
    
    try {
        const msgTimestamp = m.messageTimestamp ? (m.messageTimestamp * 1000) : startTime
        const latency = Math.max(1, Date.now() - msgTimestamp)
        
        const cpus = os.cpus()
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        
        let cpuPercent = 0
        try {
            const cpus1 = os.cpus()
            const cpuInfo = cpus1.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
                const idle = cpu.times.idle
                acc.total += total
                acc.idle += idle
                return acc
            }, { total: 0, idle: 0 })
            
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const cpus2 = os.cpus()
            const cpuInfo2 = cpus2.reduce((acc, cpu) => {
                const total = Object.values(cpu.times).reduce((a, b) => a + b, 0)
                const idle = cpu.times.idle
                acc.total += total
                acc.idle += idle
                return acc
            }, { total: 0, idle: 0 })
            
            const totalDiff = cpuInfo2.total - cpuInfo.total
            const idleDiff = cpuInfo2.idle - cpuInfo.idle
            
            if (totalDiff > 0) {
                cpuPercent = ((totalDiff - idleDiff) / totalDiff * 100).toFixed(1)
            } else {
                const loadAvg = os.loadavg()[0]
                cpuPercent = Math.min(100, (loadAvg / cpus.length * 100)).toFixed(1)
            }
            
            if (parseFloat(cpuPercent) <= 0) {
                const loadAvg = os.loadavg()[0]
                cpuPercent = Math.max(1, Math.min(100, (loadAvg / cpus.length * 100))).toFixed(1)
            }
        } catch {
            const loadAvg = os.loadavg()[0]
            cpuPercent = Math.max(1, Math.min(100, (loadAvg / cpus.length * 100))).toFixed(1)
        }
        
        let diskTotal = 0, diskUsed = 0
        try {
            if (process.platform === 'win32') {
                const wmic = execSync('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:value', { encoding: 'utf-8' })
                const freeMatch = wmic.match(/FreeSpace=(\d+)/)
                const sizeMatch = wmic.match(/Size=(\d+)/)
                if (sizeMatch && freeMatch) {
                    diskTotal = parseInt(sizeMatch[1])
                    diskUsed = diskTotal - parseInt(freeMatch[1])
                }
            } else {
                const df = execSync('df -k --output=size,used / 2>/dev/null').toString()
                const lines = df.trim().split('\n')
                if (lines.length > 1) {
                    const parts = lines[1].trim().split(/\s+/).map(Number)
                    if (parts.length >= 2) {
                        diskTotal = parts[0] * 1024
                        diskUsed = parts[1] * 1024
                    }
                }
            }
        } catch {
            diskTotal = 500 * 1024 * 1024 * 1024
            diskUsed = 250 * 1024 * 1024 * 1024
        }
        
        const networkStats = getNetworkStats()
        const heap = process.memoryUsage()
        const loadAvgArr = os.loadavg()
        
        const stats = {
            ping: latency,
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            nodeVersion: process.version,
            v8Version: process.versions.v8,
            uptimeBot: formatTime(process.uptime()),
            uptimeServer: formatTime(os.uptime()),
            cpuModel: cpus[0]?.model?.trim() || 'Unknown',
            cpuSpeed: cpus[0]?.speed || 0,
            cpuCores: cpus.length,
            cpuLoad: cpuPercent,
            loadAvg: loadAvgArr.map(l => l.toFixed(2)).join(', '),
            ramTotal: totalMem,
            ramUsed: totalMem - freeMem,
            diskTotal,
            diskUsed,
            networkRx: networkStats.totalRx,
            networkTx: networkStats.totalTx,
            networkInterface: networkStats.activeInterface,
            heapUsed: formatSize(heap.heapUsed),
            heapTotal: formatSize(heap.heapTotal),
            rss: formatSize(heap.rss),
            external: formatSize(heap.external),
            arrayBuffers: formatSize(heap.arrayBuffers || 0),
            pid: process.pid,
            uid: process.getuid?.() ?? 'N/A',
            cwd: process.cwd(),
            execPath: process.argv[0].split(/[/\\]/).pop(),
            nodeEnv: process.env.NODE_ENV || 'development',
            activeHandles: process._getActiveHandles?.()?.length ?? 'N/A',
            activeRequests: process._getActiveRequests?.()?.length ?? 'N/A'
        }
        
        const imageBuffer = await renderDashboard(stats)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Ourin-AI'
        
        const ramPercent = ((stats.ramUsed / stats.ramTotal) * 100).toFixed(1)
        const diskPercent = stats.diskTotal > 0 ? ((stats.diskUsed / stats.diskTotal) * 100).toFixed(1) : 0
        
        const pingStatus = latency < 100 ? '🟢 Excellent' : latency < 300 ? '🟡 Good' : '🔴 Poor'
        
        const osName = {
            'linux': '🐧 Linux',
            'darwin': '🍎 macOS',
            'win32': '🪟 Windows',
            'android': '🤖 Android'
        }[stats.platform] || `📦 ${stats.platform}`
        
        const caption = `⚡ *SYSTEM DASHBOARD*\n\n` +
            `╭┈┈⬡「 🏓 *ʀᴇsᴘᴏɴsᴇ* 」\n` +
            `┃ ◦ Latency: *${latency}ms* ${pingStatus}\n` +
            `┃ ◦ Status: *Online*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🖥️ *sᴇʀᴠᴇʀ* 」\n` +
            `┃ ◦ Hostname: *${stats.hostname}*\n` +
            `┃ ◦ OS: *${osName}*\n` +
            `┃ ◦ Arch: *${stats.arch}*\n` +
            `┃ ◦ Kernel: *${stats.release}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 💻 *ᴄᴘᴜ* 」\n` +
            `┃ ◦ Model: *${stats.cpuModel.substring(0, 30)}*\n` +
            `┃ ◦ Cores: *${stats.cpuCores} cores @ ${stats.cpuSpeed} MHz*\n` +
            `┃ ◦ Load: *${stats.cpuLoad}%*\n` +
            `┃ ◦ Load Avg: *${stats.loadAvg}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🧠 *ᴍᴇᴍᴏʀʏ* 」\n` +
            `┃ ◦ Total: *${formatSize(stats.ramTotal)}*\n` +
            `┃ ◦ Used: *${formatSize(stats.ramUsed)}* (${ramPercent}%)\n` +
            `┃ ◦ Free: *${formatSize(stats.ramTotal - stats.ramUsed)}*\n` +
            `┃ ◦ Heap: *${stats.heapUsed}/${stats.heapTotal}*\n` +
            `┃ ◦ RSS: *${stats.rss}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 💾 *sᴛᴏʀᴀɢᴇ* 」\n` +
            `┃ ◦ Total: *${formatSize(stats.diskTotal)}*\n` +
            `┃ ◦ Used: *${formatSize(stats.diskUsed)}* (${diskPercent}%)\n` +
            `┃ ◦ Free: *${formatSize(stats.diskTotal - stats.diskUsed)}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📊 *ᴘʀᴏᴄᴇss* 」\n` +
            `┃ ◦ PID: *${stats.pid}*\n` +
            `┃ ◦ Node.js: *${stats.nodeVersion}*\n` +
            `┃ ◦ V8: *${stats.v8Version}*\n` +
            `┃ ◦ External: *${stats.external}*\n` +
            `┃ ◦ Handles: *${stats.activeHandles}*\n` +
            `┃ ◦ Requests: *${stats.activeRequests}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🌐 *ɴᴇᴛᴡᴏʀᴋ* 」\n` +
            `┃ ◦ Interface: *${stats.networkInterface}*\n` +
            `┃ ◦ Download: *${formatSize(stats.networkRx)}*\n` +
            `┃ ◦ Upload: *${formatSize(stats.networkTx)}*\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 ⏱️ *ᴜᴘᴛɪᴍᴇ* 」\n` +
            `┃ ◦ Bot: *${stats.uptimeBot}*\n` +
            `┃ ◦ Server: *${stats.uptimeServer}*\n` +
            `╰┈┈⬡`
        
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
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
        
        await m.react('✅')
        
    } catch (error) {
        await m.react('❌')
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${error.message}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
