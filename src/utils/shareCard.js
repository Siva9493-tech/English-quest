// Generate a beautiful, shareable progress card as a PNG data URL.
// Drawn entirely with the HTML Canvas API — no network, no dependencies.
//
// userData: { name }
// stats:    { earnedXP, streak, completedVideos }
export async function generateShareCard(userData, stats) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080)
  gradient.addColorStop(0, '#0a0a0f')
  gradient.addColorStop(1, '#1a0533')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1080)

  // Grid pattern
  ctx.strokeStyle = 'rgba(0,229,255,0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x < 1080; x += 50) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 1080)
    ctx.stroke()
  }
  for (let y = 0; y < 1080; y += 50) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(1080, y)
    ctx.stroke()
  }

  // EnglishQuest logo text
  ctx.font = 'bold 48px Arial'
  ctx.fillStyle = '#00e5ff'
  ctx.textAlign = 'center'
  ctx.fillText('🗺️ EnglishQuest', 540, 120)

  // User name
  ctx.font = 'bold 72px Arial'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(userData?.name || 'Learner', 540, 250)

  // Stats
  const statItems = [
    { label: 'XP Earned', value: String(stats.earnedXP) },
    { label: 'Day Streak', value: stats.streak + ' 🔥' },
    { label: 'Videos Watched', value: String(stats.completedVideos) },
  ]

  statItems.forEach((item, i) => {
    const x = 200 + i * 340
    const y = 450
    ctx.fillStyle = 'rgba(0,229,255,0.1)'
    ctx.beginPath()
    ctx.roundRect(x - 120, y - 80, 240, 160, 20)
    ctx.fill()
    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = '#00e5ff'
    ctx.fillText(item.value, x, y)
    ctx.font = '28px Arial'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(item.label, x, y + 60)
  })

  // Bottom tagline
  ctx.font = '32px Arial'
  ctx.fillStyle = '#bf00ff'
  ctx.fillText('Learning English with AI — Free Forever', 540, 900)

  // App URL
  ctx.font = '24px Arial'
  ctx.fillStyle = '#4a5568'
  ctx.fillText('englishquest.vercel.app', 540, 980)

  return canvas.toDataURL('image/png')
}
