import { useRef, useEffect } from 'react'
import { startGameLoop, type GameState, type InputState } from './game-loop'

interface Props {
  onComplete: (score: number) => void
}

// ── Game constants ──
const TOTAL_ROUNDS = 5
const FIELD_GREEN = '#1a8a2e'
const FIELD_LINE = '#2aaa3e'
const BALL_COLOR = '#8B4513'
const PLAYER_COLOR = '#2244aa'
const CROSSHAIR_COLOR = '#ffd700'
const PERFECT_ZONE = 20
const GOOD_ZONE = 50

const QB_X = 300
const QB_Y = 350

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Waypoint {
  x: number
  y: number
}

interface RouteDefinition {
  name: string
  waypoints: Waypoint[]
  speed: number // base pixels per second
}

// Routes defined as waypoints relative to the receiver start position.
// Receiver starts at roughly (300, 260) — line of scrimmage.
// The field is top-down: y decreases = running downfield.
function buildRoutes(): RouteDefinition[] {
  const startX = 300
  const startY = 260

  return [
    {
      name: 'DRAG',
      speed: 150,
      waypoints: [
        { x: startX, y: startY },
        { x: startX, y: startY - 10 },
        { x: startX + 160, y: startY - 10 },
      ],
    },
    {
      name: 'SLANT',
      speed: 160,
      waypoints: [
        { x: startX, y: startY },
        { x: startX, y: startY - 60 },
        { x: startX - 100, y: startY - 130 },
      ],
    },
    {
      name: 'OUT',
      speed: 170,
      waypoints: [
        { x: startX, y: startY },
        { x: startX, y: startY - 110 },
        { x: startX + 140, y: startY - 110 },
      ],
    },
    {
      name: 'CURL',
      speed: 170,
      waypoints: [
        { x: startX, y: startY },
        { x: startX, y: startY - 140 },
        { x: startX + 10, y: startY - 110 },
      ],
    },
    {
      name: 'CORNER',
      speed: 185,
      waypoints: [
        { x: startX, y: startY },
        { x: startX, y: startY - 100 },
        { x: startX + 120, y: startY - 200 },
      ],
    },
    {
      name: 'POST',
      speed: 185,
      waypoints: [
        { x: startX, y: startY },
        { x: startX, y: startY - 110 },
        { x: startX - 80, y: startY - 210 },
      ],
    },
  ]
}

type Phase = 'preview' | 'running' | 'flight' | 'result'

// ── Route Running State ──
class RouteRunningState implements GameState {
  // Routes
  allRoutes: RouteDefinition[] = []
  roundRoutes: RouteDefinition[] = []
  currentRoute: RouteDefinition | null = null

  // Receiver
  receiverX = 300
  receiverY = 260
  receiverSegment = 0
  receiverSegmentProgress = 0

  // Ball
  ballX = 0
  ballY = 0
  ballActive = false
  ballTargetX = 0
  ballTargetY = 0
  ballProgress = 0

  // Crosshair
  crosshairX = 0
  crosshairY = 0

  // Game state
  round = 0
  score = 0
  phase: Phase = 'preview'
  previewTimer = 0
  feedbackTimer = 0
  feedbackText = ''
  feedbackColor = ''
  complete = false

  // Celebration effects
  particles: Particle[] = []
  screenShake = 0
  catchFlashTimer = 0
  comboCount = 0
  scorePopTimer = 0
  scorePopValue = 0

  constructor() {
    this.allRoutes = buildRoutes()
    this.pickRoutes()
    this.startPreview()
  }

  pickRoutes() {
    // Pick 5 routes with increasing difficulty:
    // Rounds 0-1: easy routes (Drag, Slant)
    // Rounds 2-3: medium routes (Out, Curl)
    // Round 4: hard route (Corner, Post)
    const easy = this.allRoutes.filter((r) => r.name === 'DRAG' || r.name === 'SLANT')
    const medium = this.allRoutes.filter((r) => r.name === 'OUT' || r.name === 'CURL')
    const hard = this.allRoutes.filter((r) => r.name === 'CORNER' || r.name === 'POST')

    const pick = (arr: RouteDefinition[]) => arr[Math.floor(Math.random() * arr.length)]

    this.roundRoutes = [
      pick(easy),
      pick(easy),
      pick(medium),
      pick(medium),
      pick(hard),
    ]
  }

  startPreview() {
    this.currentRoute = this.roundRoutes[this.round]
    this.phase = 'preview'
    this.previewTimer = 2.0
    this.receiverSegment = 0
    this.receiverSegmentProgress = 0
    if (this.currentRoute) {
      this.receiverX = this.currentRoute.waypoints[0].x
      this.receiverY = this.currentRoute.waypoints[0].y
    }
    this.ballActive = false
  }

  startRunning() {
    this.phase = 'running'
    this.receiverSegment = 0
    this.receiverSegmentProgress = 0
  }

  spawnParticles(x: number, y: number, color: string, count: number, spread: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * spread
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        color,
        size: 3 + Math.random() * 4,
      })
    }
  }

  getReceiverPosition(): { x: number; y: number } {
    if (!this.currentRoute) return { x: this.receiverX, y: this.receiverY }
    const wps = this.currentRoute.waypoints
    const seg = Math.min(this.receiverSegment, wps.length - 2)
    if (seg < 0 || seg >= wps.length - 1) {
      return { x: wps[wps.length - 1].x, y: wps[wps.length - 1].y }
    }
    const a = wps[seg]
    const b = wps[seg + 1]
    const t = this.receiverSegmentProgress
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    }
  }

  update(dt: number, input: InputState): void {
    if (this.complete) return

    this.crosshairX = input.mouseX
    this.crosshairY = input.mouseY

    // Update particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 120 * dt
      p.life -= dt
      return p.life > 0
    })

    if (this.screenShake > 0) this.screenShake -= dt * 8
    if (this.catchFlashTimer > 0) this.catchFlashTimer -= dt
    if (this.scorePopTimer > 0) this.scorePopTimer -= dt

    // --- Preview phase ---
    if (this.phase === 'preview') {
      this.previewTimer -= dt
      if (this.previewTimer <= 0) {
        this.startRunning()
      }
      return
    }

    // --- Result / feedback phase ---
    if (this.phase === 'result') {
      this.feedbackTimer -= dt
      // Keep moving receiver during result for visual continuity
      this.moveReceiver(dt)
      if (this.feedbackTimer <= 0) {
        this.round++
        if (this.round >= TOTAL_ROUNDS) {
          this.complete = true
          return
        }
        this.startPreview()
      }
      return
    }

    // --- Running phase (receiver moving, waiting for throw) ---
    if (this.phase === 'running') {
      this.moveReceiver(dt)

      // Check if receiver finished the route without a throw
      if (this.currentRoute && this.receiverSegment >= this.currentRoute.waypoints.length - 1) {
        // Receiver reached the end — auto-incomplete
        this.phase = 'result'
        this.feedbackText = 'TOO LATE!'
        this.feedbackColor = '#ff3333'
        this.comboCount = 0
        this.spawnParticles(this.receiverX, this.receiverY, '#666666', 6, 40)
        this.feedbackTimer = 1.3
        return
      }

      // Throw on click
      if (input.clicked) {
        this.ballActive = true
        this.ballX = QB_X
        this.ballY = QB_Y
        this.ballTargetX = input.mouseX
        this.ballTargetY = input.mouseY
        this.ballProgress = 0
        this.phase = 'flight'
      }
      return
    }

    // --- Flight phase (ball in air, receiver still moving) ---
    if (this.phase === 'flight') {
      this.moveReceiver(dt)
      this.ballProgress += dt * 2.5

      if (this.ballProgress >= 1) {
        this.ballActive = false
        const pos = this.getReceiverPosition()
        const dx = this.ballTargetX - pos.x
        const dy = this.ballTargetY - pos.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < PERFECT_ZONE) {
          this.comboCount++
          const combo = Math.min(this.comboCount, 5)
          const pts = 150
          this.score += pts
          this.feedbackText = combo >= 3 ? `PERFECT x${combo}!` : 'PERFECT!'
          this.feedbackColor = '#ffd700'
          this.scorePopValue = pts
          this.scorePopTimer = 1

          this.spawnParticles(pos.x, pos.y, '#ffd700', 30, 200)
          this.spawnParticles(pos.x, pos.y, '#ff6600', 15, 150)
          this.spawnParticles(pos.x, pos.y, '#ffffff', 10, 100)
          this.screenShake = 1
          this.catchFlashTimer = 0.3
        } else if (dist < GOOD_ZONE) {
          this.comboCount++
          const pts = 100
          this.score += pts
          this.feedbackText = 'GOOD THROW!'
          this.feedbackColor = '#1a8a2e'
          this.scorePopValue = pts
          this.scorePopTimer = 1

          this.spawnParticles(pos.x, pos.y, '#1a8a2e', 15, 120)
          this.spawnParticles(pos.x, pos.y, '#ffffff', 8, 80)
          this.screenShake = 0.4
          this.catchFlashTimer = 0.2
        } else {
          this.comboCount = 0
          this.feedbackText = 'INCOMPLETE'
          this.feedbackColor = '#ff3333'
          this.spawnParticles(this.ballTargetX, this.ballTargetY, '#666666', 6, 40)
        }

        this.phase = 'result'
        this.feedbackTimer = 1.3
      }
    }
  }

  moveReceiver(dt: number) {
    if (!this.currentRoute) return
    const wps = this.currentRoute.waypoints
    if (this.receiverSegment >= wps.length - 1) return

    const a = wps[this.receiverSegment]
    const b = wps[this.receiverSegment + 1]
    const segDx = b.x - a.x
    const segDy = b.y - a.y
    const segLen = Math.sqrt(segDx * segDx + segDy * segDy)
    if (segLen === 0) {
      this.receiverSegment++
      this.receiverSegmentProgress = 0
      return
    }

    // Speed increases each round
    const speedMult = 1 + this.round * 0.12
    const speed = this.currentRoute.speed * speedMult
    const progressPerSec = speed / segLen
    this.receiverSegmentProgress += progressPerSec * dt

    if (this.receiverSegmentProgress >= 1) {
      this.receiverSegmentProgress = 0
      this.receiverSegment++
    }

    const pos = this.getReceiverPosition()
    this.receiverX = pos.x
    this.receiverY = pos.y
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Screen shake offset
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 6 : 0
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 6 : 0
    ctx.save()
    ctx.translate(shakeX, shakeY)

    // Field
    ctx.fillStyle = FIELD_GREEN
    ctx.fillRect(-5, -5, w + 10, h + 10)

    // Catch flash overlay
    if (this.catchFlashTimer > 0) {
      const alpha = this.catchFlashTimer * 2
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.15})`
      ctx.fillRect(0, 0, w, h)
    }

    // Yard lines
    ctx.strokeStyle = FIELD_LINE
    ctx.lineWidth = 2
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Hash marks
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    for (let y = 0; y < h; y += 40) {
      for (const hx of [180, 420]) {
        ctx.beginPath()
        ctx.moveTo(hx, y - 4)
        ctx.lineTo(hx, y + 4)
        ctx.stroke()
      }
    }

    // Line of scrimmage
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(0, 260)
    ctx.lineTo(w, 260)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw route preview during preview phase or faintly during running
    if (this.currentRoute) {
      const wps = this.currentRoute.waypoints
      const isPreview = this.phase === 'preview'
      const alpha = isPreview ? 1.0 : 0.25

      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = CROSSHAIR_COLOR
      ctx.lineWidth = 3
      ctx.setLineDash([8, 6])

      ctx.beginPath()
      ctx.moveTo(wps[0].x, wps[0].y)
      for (let i = 1; i < wps.length; i++) {
        ctx.lineTo(wps[i].x, wps[i].y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // Arrow head at the last waypoint
      if (wps.length >= 2) {
        const last = wps[wps.length - 1]
        const prev = wps[wps.length - 2]
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
        const arrowLen = 12
        ctx.fillStyle = CROSSHAIR_COLOR
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(
          last.x - arrowLen * Math.cos(angle - 0.4),
          last.y - arrowLen * Math.sin(angle - 0.4),
        )
        ctx.lineTo(
          last.x - arrowLen * Math.cos(angle + 0.4),
          last.y - arrowLen * Math.sin(angle + 0.4),
        )
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()
    }

    // Receiver shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(this.receiverX, this.receiverY + 20, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Receiver — pulse on catch
    const receiverScale = this.catchFlashTimer > 0 ? 1 + this.catchFlashTimer * 0.8 : 1
    const receiverRadius = 18 * receiverScale
    ctx.fillStyle = PLAYER_COLOR
    ctx.beginPath()
    ctx.arc(this.receiverX, this.receiverY, receiverRadius, 0, Math.PI * 2)
    ctx.fill()
    // Glow ring on catch
    if (this.catchFlashTimer > 0) {
      ctx.strokeStyle = `rgba(255, 215, 0, ${this.catchFlashTimer * 3})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(this.receiverX, this.receiverY, receiverRadius + 8, 0, Math.PI * 2)
      ctx.stroke()
    }
    // Jersey number
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('23', this.receiverX, this.receiverY)

    // QB shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(QB_X, QB_Y + 20, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // QB
    ctx.fillStyle = PLAYER_COLOR
    ctx.beginPath()
    ctx.arc(QB_X, QB_Y, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('12', QB_X, QB_Y)

    // Ball in flight with trail
    if (this.ballActive) {
      const bx = this.ballX + (this.ballTargetX - this.ballX) * this.ballProgress
      const by = this.ballY + (this.ballTargetY - this.ballY) * this.ballProgress
      const arcHeight = -80 * Math.sin(this.ballProgress * Math.PI)

      // Motion trail
      for (let i = 3; i > 0; i--) {
        const trailProg = Math.max(0, this.ballProgress - i * 0.06)
        const tx = this.ballX + (this.ballTargetX - this.ballX) * trailProg
        const ty = this.ballY + (this.ballTargetY - this.ballY) * trailProg
        const tArc = -80 * Math.sin(trailProg * Math.PI)
        ctx.fillStyle = `rgba(139, 69, 19, ${0.15 * (4 - i)})`
        ctx.beginPath()
        ctx.ellipse(tx, ty + tArc, 6, 4, 0.3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Ball
      ctx.fillStyle = BALL_COLOR
      ctx.beginPath()
      ctx.ellipse(bx, by + arcHeight, 8, 5, 0.3, 0, Math.PI * 2)
      ctx.fill()
      // Ball laces
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(bx - 2, by + arcHeight - 3)
      ctx.lineTo(bx + 2, by + arcHeight - 3)
      ctx.stroke()
    }

    // Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Crosshair during running phase
    if (this.phase === 'running') {
      const pulse = 1 + Math.sin(Date.now() / 200) * 0.1
      ctx.strokeStyle = CROSSHAIR_COLOR
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(this.crosshairX, this.crosshairY, 15 * pulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(this.crosshairX - 22, this.crosshairY)
      ctx.lineTo(this.crosshairX - 8, this.crosshairY)
      ctx.moveTo(this.crosshairX + 8, this.crosshairY)
      ctx.lineTo(this.crosshairX + 22, this.crosshairY)
      ctx.moveTo(this.crosshairX, this.crosshairY - 22)
      ctx.lineTo(this.crosshairX, this.crosshairY - 8)
      ctx.moveTo(this.crosshairX, this.crosshairY + 8)
      ctx.lineTo(this.crosshairX, this.crosshairY + 22)
      ctx.stroke()
    }

    ctx.restore() // end screen shake

    // HUD (outside shake)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, h - 50, w, 50)
    ctx.font = '14px "Press Start 2P", monospace'
    ctx.fillStyle = '#ffd700'
    ctx.textAlign = 'left'
    ctx.fillText(`SCORE: ${this.score}`, 15, h - 22)
    ctx.textAlign = 'center'
    if (this.comboCount >= 2) {
      ctx.fillStyle = '#ff6600'
      ctx.fillText(`${this.comboCount}x COMBO`, w / 2, h - 22)
    }
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffd700'
    ctx.fillText(`ROUND: ${this.round + 1}/${TOTAL_ROUNDS}`, w - 15, h - 22)

    // Route name banner during preview
    if (this.phase === 'preview' && this.currentRoute) {
      // Semi-transparent background banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(0, 0, w, 50)

      ctx.font = '22px "Press Start 2P", monospace'
      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 15
      ctx.fillText(this.currentRoute.name, w / 2, 26)
      ctx.shadowBlur = 0

      // Countdown bar
      const barW = 200
      const barH = 6
      const barX = (w - barW) / 2
      const barY = 44
      const progress = this.previewTimer / 2.0
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(barX, barY, barW, barH)
      ctx.fillStyle = '#ffd700'
      ctx.fillRect(barX, barY, barW * progress, barH)
    }

    // Floating score pop
    if (this.scorePopTimer > 0) {
      const popY = h / 2 - 50 - (1 - this.scorePopTimer) * 40
      const popAlpha = this.scorePopTimer
      ctx.globalAlpha = popAlpha
      ctx.font = '18px "Press Start 2P", monospace'
      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'center'
      ctx.fillText(`+${this.scorePopValue}`, w / 2, popY - 30)
      ctx.globalAlpha = 1
    }

    // Feedback text
    if (this.feedbackTimer > 0 && this.phase === 'result') {
      const scale = this.feedbackTimer > 1 ? 1 + (this.feedbackTimer - 1) * 2 : 1
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(scale, scale)
      ctx.font = '28px "Press Start 2P", monospace'
      ctx.fillStyle = this.feedbackColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = this.feedbackColor
      ctx.shadowBlur = 20
      ctx.fillText(this.feedbackText, 0, 0)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // Instructions
    if (this.phase === 'running') {
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.textAlign = 'center'
      ctx.fillText('CLICK TO THROW — LEAD THE RECEIVER!', w / 2, h - 65)
    }
  }

  isComplete(): boolean {
    return this.complete
  }

  getScore(): number {
    return this.score
  }
}

export function RouteRunning({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = new RouteRunningState()
    const cleanup = startGameLoop(canvas, state, onComplete)
    return cleanup
  }, [onComplete])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="border-2 border-gold/30 rounded-sm cursor-crosshair touch-none"
    />
  )
}
