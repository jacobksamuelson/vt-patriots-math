import { useRef, useEffect } from 'react'
import { startGameLoop, type GameState, type InputState } from './game-loop'

interface Props {
  onComplete: (score: number) => void
}

const TOTAL_KICKS = 3

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; size: number
}

type Phase = 'runup' | 'power' | 'aiming' | 'flight' | 'result'

class FieldGoalState implements GameState {
  // Meters
  meterValue = 0
  meterDir = 1
  meterSpeed = 2
  lockedPower = 0
  aimValue = 0.5
  aimDir = 1
  aimSpeed = 1.5
  lockedAim = 0

  // Kicker run-up
  kickerX = 340
  kickerY = 370
  kickerTargetX = 300
  kickerTargetY = 340
  kickerLegAngle = 0
  kickerRunProgress = 0

  // Ball
  ballX = 300
  ballY = 340
  ballVx = 0
  ballVy = 0
  ballTime = 0
  ballSpin = 0

  // Wind
  wind = 0

  // Game
  phase: Phase = 'power'
  kicksLeft = TOTAL_KICKS
  score = 0
  round = 0
  feedbackTimer = 0
  feedbackText = ''
  feedbackColor = ''
  complete = false
  goalPostY = 80
  postLeft = 230
  postRight = 370
  distance = 30

  // Effects
  particles: Particle[] = []
  screenShake = 0
  flashTimer = 0
  scorePopTimer = 0
  scorePopValue = 0
  starTime = 0 // for twinkling stars

  // Crowd bobbing
  crowdPhase = 0

  constructor() {
    this.newRound()
  }

  newRound() {
    this.phase = 'runup'
    this.meterValue = 0
    this.meterDir = 1
    this.aimValue = 0.5
    this.aimDir = 1
    this.lockedPower = 0
    this.lockedAim = 0
    this.ballX = 300
    this.ballY = 340
    this.ballTime = 0
    this.ballSpin = 0
    this.kickerX = 340
    this.kickerY = 380
    this.kickerRunProgress = 0
    this.kickerLegAngle = 0
    this.wind = (Math.random() - 0.5) * 40
    this.meterSpeed = 2 + this.round * 0.5
    this.aimSpeed = 1.5 + this.round * 0.4
    this.distance = 30 + this.round * 10
    this.postLeft = 230 + this.round * 15
    this.postRight = 370 - this.round * 15
  }

  spawnParticles(x: number, y: number, color: string, count: number, spread: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 30 + Math.random() * spread
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 0.5 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 4,
      })
    }
  }

  update(dt: number, input: InputState): void {
    if (this.complete) return

    this.starTime += dt
    this.crowdPhase += dt * 3

    // Update particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 100 * dt
      p.life -= dt
      return p.life > 0
    })

    if (this.screenShake > 0) this.screenShake -= dt * 6
    if (this.flashTimer > 0) this.flashTimer -= dt
    if (this.scorePopTimer > 0) this.scorePopTimer -= dt

    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt
      if (this.feedbackTimer <= 0) {
        if (this.kicksLeft <= 0) { this.complete = true; return }
        this.round++
        this.newRound()
      }
      return
    }

    if (this.phase === 'runup') {
      // Kicker runs toward the ball
      this.kickerRunProgress += dt * 1.8
      this.kickerLegAngle = Math.sin(this.kickerRunProgress * 8) * 0.5
      this.kickerX = 340 + (300 - 340) * Math.min(this.kickerRunProgress, 1)
      this.kickerY = 380 + (345 - 380) * Math.min(this.kickerRunProgress, 1)
      if (this.kickerRunProgress >= 1) {
        this.phase = 'power'
      }
    } else if (this.phase === 'power') {
      // Kicker leg swings while setting power
      this.kickerLegAngle = Math.sin(Date.now() * 0.005) * 0.15
      this.meterValue += this.meterDir * this.meterSpeed * dt
      if (this.meterValue >= 1) { this.meterValue = 1; this.meterDir = -1 }
      if (this.meterValue <= 0) { this.meterValue = 0; this.meterDir = 1 }
      if (input.clicked) {
        this.lockedPower = this.meterValue
        this.phase = 'aiming'
      }
    } else if (this.phase === 'aiming') {
      this.aimValue += this.aimDir * this.aimSpeed * dt
      if (this.aimValue >= 1) { this.aimValue = 1; this.aimDir = -1 }
      if (this.aimValue <= 0) { this.aimValue = 0; this.aimDir = 1 }
      if (input.clicked) {
        this.lockedAim = this.aimValue
        // Kick animation — swing leg then launch
        this.kickerLegAngle = -1.2 // big backswing
        setTimeout(() => {
          this.kickerLegAngle = 1.5 // follow through
        }, 150)
        setTimeout(() => {
          this.phase = 'flight'
        }, 300)
        const aimOffset = (this.lockedAim - 0.5) * 300
        this.ballVx = aimOffset + this.wind * 0.3
        this.ballVy = -this.lockedPower * 1.2
        this.ballTime = 0
      }
    } else if (this.phase === 'flight') {
      this.ballTime += dt * 2
      this.ballSpin += dt * 12
      this.ballX = 300 + this.ballVx * this.ballTime
      this.ballY = 340 + this.ballVy * this.ballTime * 200 + 40 * this.ballTime * this.ballTime

      if (this.ballY <= this.goalPostY) {
        this.phase = 'result'
        this.kicksLeft--
        const isGood = this.ballX > this.postLeft && this.ballX < this.postRight && this.lockedPower > 0.3
        if (isGood) {
          const distBonus = this.round * 50
          const pts = 100 + distBonus
          this.score += pts
          this.feedbackText = 'IT\'S GOOD!'
          this.feedbackColor = '#ffd700'
          this.scorePopValue = pts
          this.scorePopTimer = 1.2
          this.spawnParticles(this.ballX, this.goalPostY, '#ffd700', 40, 200)
          this.spawnParticles(this.ballX, this.goalPostY, '#ff6600', 20, 150)
          this.spawnParticles(this.ballX, this.goalPostY, '#ffffff', 15, 100)
          this.screenShake = 1
          this.flashTimer = 0.4
        } else {
          this.feedbackText = 'NO GOOD'
          this.feedbackColor = '#ff3333'
          this.spawnParticles(this.ballX, this.goalPostY, '#666', 8, 50)
          this.screenShake = 0.3
        }
        this.feedbackTimer = 1.8
      }

      if (this.ballY > 420 || this.ballX < -50 || this.ballX > 650) {
        this.phase = 'result'
        this.kicksLeft--
        this.feedbackText = 'WIDE!'
        this.feedbackColor = '#ff3333'
        this.feedbackTimer = 1.5
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 6 : 0
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 6 : 0
    ctx.save()
    ctx.translate(shakeX, shakeY)

    // Night sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 300)
    skyGrad.addColorStop(0, '#050818')
    skyGrad.addColorStop(0.6, '#0a1030')
    skyGrad.addColorStop(1, '#101845')
    ctx.fillStyle = skyGrad
    ctx.fillRect(-5, -5, w + 10, 310)

    // Stars
    ctx.fillStyle = '#ffffff'
    const starSeeds = [23, 67, 112, 198, 245, 310, 389, 445, 501, 78, 156, 290, 410, 530, 48]
    for (const seed of starSeeds) {
      const sx = (seed * 7 + 13) % w
      const sy = (seed * 3 + 7) % 200
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(this.starTime * 2 + seed))
      ctx.globalAlpha = twinkle
      ctx.beginPath()
      ctx.arc(sx, sy, 1 + (seed % 2), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Stadium lights (two glowing circles)
    for (const lx of [80, 520]) {
      const lightGrad = ctx.createRadialGradient(lx, 40, 5, lx, 40, 100)
      lightGrad.addColorStop(0, 'rgba(255, 220, 150, 0.3)')
      lightGrad.addColorStop(1, 'rgba(255, 220, 150, 0)')
      ctx.fillStyle = lightGrad
      ctx.fillRect(lx - 100, -60, 200, 200)
      // Light pole
      ctx.fillStyle = '#333'
      ctx.fillRect(lx - 2, 40, 4, 260)
      // Light fixture
      ctx.fillStyle = '#ffd700'
      ctx.beginPath()
      ctx.arc(lx, 40, 6, 0, Math.PI * 2)
      ctx.fill()
    }

    // Flash on good kick
    if (this.flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.flashTimer * 0.2})`
      ctx.fillRect(-5, -5, w + 10, h + 10)
    }

    // Grass with gradient
    const grassGrad = ctx.createLinearGradient(0, 280, 0, h)
    grassGrad.addColorStop(0, '#1a8a2e')
    grassGrad.addColorStop(1, '#116b22')
    ctx.fillStyle = grassGrad
    ctx.fillRect(-5, 280, w + 10, h - 275)

    // Grass stripes
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    for (let x = 0; x < w; x += 30) {
      if ((x / 30) % 2 === 0) ctx.fillRect(x, 280, 30, h - 280)
    }

    // Crowd silhouette
    ctx.fillStyle = '#1a1a3a'
    for (let cx = 0; cx < w; cx += 8) {
      const bob = Math.sin(this.crowdPhase + cx * 0.3) * 2
      const baseY = 270 + (cx % 16 === 0 ? -2 : 0)
      ctx.beginPath()
      ctx.arc(cx + 4, baseY + bob, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Goal post shadow on grass
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.fillRect(this.postLeft - 5, this.goalPostY + 5, this.postRight - this.postLeft + 10, 220)

    // Goal posts
    // Support post
    ctx.fillStyle = '#ddd'
    ctx.fillRect(298, this.goalPostY, 4, 220)
    // Crossbar
    ctx.fillStyle = '#ffd700'
    ctx.shadowColor = 'rgba(255, 215, 0, 0.4)'
    ctx.shadowBlur = 10
    ctx.fillRect(this.postLeft - 2, this.goalPostY - 2, this.postRight - this.postLeft + 4, 6)
    ctx.shadowBlur = 0
    // Uprights
    ctx.fillStyle = '#ffd700'
    ctx.fillRect(this.postLeft - 2, this.goalPostY - 60, 4, 62)
    ctx.fillRect(this.postRight - 2, this.goalPostY - 60, 4, 62)
    // Upright tips
    ctx.fillStyle = '#ff3333'
    ctx.fillRect(this.postLeft - 3, this.goalPostY - 64, 6, 6)
    ctx.fillRect(this.postRight - 3, this.goalPostY - 64, 6, 6)

    // Ball on tee (visible before flight)
    if (this.phase !== 'flight' && this.phase !== 'result') {
      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.ellipse(300, 348, 6, 4, -0.3, 0, Math.PI * 2)
      ctx.fill()
      // Tee
      ctx.fillStyle = '#ff6600'
      ctx.fillRect(297, 350, 6, 3)
    }

    // Kicker on the field
    if (this.phase === 'runup' || this.phase === 'power' || this.phase === 'aiming') {
      const kx = this.kickerX
      const ky = this.kickerY

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.ellipse(kx, ky + 15, 10, 4, 0, 0, Math.PI * 2)
      ctx.fill()

      // Kicking leg (animated)
      ctx.save()
      ctx.translate(kx, ky)
      ctx.rotate(this.kickerLegAngle)
      ctx.fillStyle = '#E8E8E0' // white pants
      ctx.fillRect(-3, 0, 6, 16)
      ctx.fillStyle = '#111' // shoe
      ctx.fillRect(-4, 14, 8, 4)
      ctx.restore()

      // Standing leg
      ctx.fillStyle = '#E8E8E0'
      ctx.fillRect(kx - 7, ky, 5, 14)
      ctx.fillStyle = '#111'
      ctx.fillRect(kx - 8, ky + 12, 6, 4)

      // Body / jersey
      ctx.fillStyle = '#2244aa'
      ctx.fillRect(kx - 9, ky - 16, 18, 18)
      // Jersey stripe
      ctx.fillStyle = '#3366dd'
      ctx.fillRect(kx - 9, ky - 12, 18, 3)

      // Arms (swinging with run)
      const armSwing = this.phase === 'runup' ? Math.sin(this.kickerRunProgress * 8) * 0.4 : 0
      ctx.save()
      ctx.translate(kx - 9, ky - 12)
      ctx.rotate(-armSwing)
      ctx.fillStyle = '#2244aa'
      ctx.fillRect(-4, 0, 4, 10)
      ctx.restore()
      ctx.save()
      ctx.translate(kx + 9, ky - 12)
      ctx.rotate(armSwing)
      ctx.fillStyle = '#2244aa'
      ctx.fillRect(0, 0, 4, 10)
      ctx.restore()

      // Helmet
      ctx.fillStyle = '#C0C0D0'
      ctx.beginPath()
      ctx.arc(kx, ky - 22, 8, 0, Math.PI * 2)
      ctx.fill()
      // Helmet stripe
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(kx - 1.5, ky - 30, 3, 8)
      // Facemask
      ctx.strokeStyle = '#C0C0D0'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(kx - 5, ky - 21)
      ctx.lineTo(kx - 8, ky - 19)
      ctx.lineTo(kx - 5, ky - 17)
      ctx.stroke()

      // Number
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 7px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('12', kx, ky - 7)
    }

    // Ball in flight
    if (this.phase === 'flight') {
      // Ball shadow on ground
      const shadowY = 345
      const shadowAlpha = Math.max(0, 1 - (340 - this.ballY) / 300)
      ctx.fillStyle = `rgba(0,0,0,${shadowAlpha * 0.3})`
      ctx.beginPath()
      ctx.ellipse(this.ballX, shadowY, 6 + (340 - this.ballY) * 0.02, 3, 0, 0, Math.PI * 2)
      ctx.fill()

      // Ball trail
      for (let i = 3; i > 0; i--) {
        const trailT = Math.max(0, this.ballTime - i * 0.04)
        const tx = 300 + this.ballVx * trailT
        const ty = 340 + this.ballVy * trailT * 200 + 40 * trailT * trailT
        ctx.fillStyle = `rgba(139, 69, 19, ${0.12 * (4 - i)})`
        ctx.beginPath()
        ctx.ellipse(tx, ty, 5, 3, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Ball with spin
      ctx.save()
      ctx.translate(this.ballX, this.ballY)
      ctx.rotate(this.ballSpin)
      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      // Laces
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-3, -3)
      ctx.lineTo(3, -3)
      ctx.stroke()
      ctx.restore()
    }

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.maxLife
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Wind indicator
    const windStrength = Math.abs(this.wind)
    const windArrows = windStrength > 20 ? '>>>' : windStrength > 10 ? '>>' : '>'
    const windDir = this.wind > 5 ? `WIND ${windArrows}` : this.wind < -5 ? `${windArrows.replace(/>/g, '<')} WIND` : 'CALM'
    ctx.font = '9px "Press Start 2P", monospace'
    ctx.fillStyle = windStrength > 20 ? '#ff6600' : 'rgba(255,255,255,0.5)'
    ctx.textAlign = 'center'
    ctx.fillText(windDir, w / 2, 25)

    ctx.restore() // end shake

    // Power meter (left side) — rendered outside shake
    if (this.phase === 'power' || this.phase === 'aiming') {
      const meterX = 20
      const meterH = 220
      const meterY = 70

      // Meter background
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 2
      ctx.fillRect(meterX, meterY, 28, meterH)
      ctx.strokeRect(meterX, meterY, 28, meterH)

      // Sweet spot zone at the TOP (high power = good, green)
      // Sweet spot = 70%-95% power (from top: meterH * 0.05 to meterH * 0.30)
      ctx.fillStyle = 'rgba(0, 255, 100, 0.2)'
      ctx.fillRect(meterX, meterY + meterH * 0.05, 28, meterH * 0.25)
      // Sweet spot border
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.4)'
      ctx.lineWidth = 1
      ctx.strokeRect(meterX, meterY + meterH * 0.05, 28, meterH * 0.25)
      // "MAX" label at sweet spot
      ctx.fillStyle = 'rgba(0, 255, 100, 0.6)'
      ctx.font = '6px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('MAX', meterX + 14, meterY + meterH * 0.05 - 3)

      // Fill — green when in sweet spot, gold mid-range, dim when low
      const val = this.phase === 'power' ? this.meterValue : this.lockedPower
      const fillH = val * meterH
      const inSweet = val >= 0.7 && val <= 0.95
      const fillColor = inSweet ? '#00cc44' : val > 0.5 ? '#ffd700' : '#666'
      ctx.fillStyle = fillColor
      ctx.fillRect(meterX + 2, meterY + meterH - fillH, 24, fillH)

      // Glow when in sweet spot
      if (inSweet && this.phase === 'power') {
        ctx.shadowColor = '#00ff66'
        ctx.shadowBlur = 12
        ctx.fillRect(meterX + 2, meterY + meterH - fillH, 24, fillH)
        ctx.shadowBlur = 0
      }

      // Lock indicator
      if (this.phase === 'aiming') {
        const lockY = meterY + meterH - this.lockedPower * meterH
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(meterX - 4, lockY)
        ctx.lineTo(meterX + 32, lockY)
        ctx.stroke()
      }

      ctx.font = '7px "Press Start 2P", monospace'
      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'center'
      ctx.fillText('POWER', meterX + 14, meterY + meterH + 15)
    }

    // Aim meter (bottom)
    if (this.phase === 'aiming') {
      const aimY = 320
      const aimW = 380
      const aimX = (w - aimW) / 2

      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 2
      ctx.fillRect(aimX, aimY, aimW, 16)
      ctx.strokeRect(aimX, aimY, aimW, 16)

      // Sweet spot zone (center)
      ctx.fillStyle = 'rgba(0, 255, 100, 0.15)'
      ctx.fillRect(aimX + aimW * 0.4, aimY, aimW * 0.2, 16)

      // Center tick
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(w / 2, aimY - 2)
      ctx.lineTo(w / 2, aimY + 18)
      ctx.stroke()

      // Marker
      const markerX = aimX + this.aimValue * aimW
      ctx.fillStyle = '#ffd700'
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 8
      ctx.fillRect(markerX - 3, aimY - 3, 6, 22)
      ctx.shadowBlur = 0

      ctx.font = '7px "Press Start 2P", monospace'
      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'center'
      ctx.fillText('AIM', w / 2, aimY - 8)
    }

    // HUD bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(0, h - 42, w, 42)
    // Divider line
    ctx.strokeStyle = '#ffd700'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, h - 42)
    ctx.lineTo(w, h - 42)
    ctx.stroke()

    ctx.font = '12px "Press Start 2P", monospace'
    ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 15, h - 18)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff'
    ctx.fillText(`${this.distance} YDS`, w / 2, h - 18)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`KICKS: ${this.kicksLeft}`, w - 15, h - 18)

    // Instructions
    if (this.phase === 'power') {
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.textAlign = 'center'
      ctx.fillText('CLICK TO SET POWER', w / 2, 305)
    } else if (this.phase === 'aiming') {
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.textAlign = 'center'
      ctx.fillText('CLICK TO SET AIM', w / 2, 305)
    } else if (this.phase === 'runup') {
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.textAlign = 'center'
      ctx.fillText('GET READY...', w / 2, 305)
    }

    // Floating score pop
    if (this.scorePopTimer > 0) {
      const popY = h / 2 - 30 - (1.2 - this.scorePopTimer) * 40
      ctx.globalAlpha = this.scorePopTimer / 1.2
      ctx.font = '18px "Press Start 2P", monospace'
      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 15
      ctx.fillText(`+${this.scorePopValue}`, w / 2, popY)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // Feedback text
    if (this.feedbackTimer > 0) {
      const scale = this.feedbackTimer > 1.2 ? 1 + (this.feedbackTimer - 1.2) * 3 : 1
      ctx.save()
      ctx.translate(w / 2, h / 2 - 20)
      ctx.scale(scale, scale)
      ctx.font = '28px "Press Start 2P", monospace'
      ctx.fillStyle = this.feedbackColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = this.feedbackColor
      ctx.shadowBlur = 25
      ctx.fillText(this.feedbackText, 0, 0)
      ctx.shadowBlur = 0
      ctx.restore()
    }
  }

  isComplete(): boolean {
    return this.complete
  }

  getScore(): number {
    return this.score
  }
}

export function FieldGoal({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = new FieldGoalState()
    const cleanup = startGameLoop(canvas, state, onComplete)
    return cleanup
  }, [onComplete])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="border-2 border-gold/30 rounded-sm cursor-pointer touch-none"
    />
  )
}
