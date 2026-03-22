import { useRef, useEffect } from 'react'
import { startGameLoop, type GameState, type InputState } from './game-loop'

interface Props {
  onComplete: (score: number) => void
}

// ── Game constants ──
const TOTAL_THROWS = 5
const FIELD_GREEN = '#1a8a2e'
const FIELD_LINE = '#2aaa3e'
const BALL_COLOR = '#8B4513'
const RECEIVER_COLOR = '#2244aa'
const CROSSHAIR_COLOR = '#ffd700'
const PERFECT_ZONE = 22
const GOOD_ZONE = 48

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

// ── Passing Drill State ──
class PassingDrillState implements GameState {
  // Receiver
  receiverX = 0
  receiverY = 120
  receiverDir = 1
  receiverSpeed = 180

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
  throwsLeft = TOTAL_THROWS
  score = 0
  round = 0
  feedbackTimer = 0
  feedbackText = ''
  feedbackColor = ''
  complete = false
  waitingForThrow = true

  // Celebration effects
  particles: Particle[] = []
  screenShake = 0
  catchFlashTimer = 0
  comboCount = 0
  scorePopTimer = 0
  scorePopValue = 0

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

  update(dt: number, input: InputState): void {
    if (this.complete) return

    this.crosshairX = input.mouseX
    this.crosshairY = input.mouseY

    // Update particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 120 * dt // gravity
      p.life -= dt
      return p.life > 0
    })

    // Update screen shake
    if (this.screenShake > 0) this.screenShake -= dt * 8

    // Update catch flash
    if (this.catchFlashTimer > 0) this.catchFlashTimer -= dt

    // Update score pop
    if (this.scorePopTimer > 0) this.scorePopTimer -= dt

    // Move receiver — side to side with random direction changes
    this.receiverX += this.receiverDir * this.receiverSpeed * dt
    if (this.receiverX > 560) this.receiverDir = -1
    if (this.receiverX < 40) this.receiverDir = 1
    // Random juke: 2% chance per frame to change direction (more in later rounds)
    if (Math.random() < 0.02 + this.round * 0.008) {
      this.receiverDir *= -1
    }

    // Handle feedback timer
    if (this.feedbackTimer > 0) {
      this.feedbackTimer -= dt
      if (this.feedbackTimer <= 0 && this.throwsLeft <= 0) {
        this.complete = true
        return
      }
      if (this.feedbackTimer <= 0) {
        this.waitingForThrow = true
        this.round++
        this.receiverSpeed = 180 + this.round * 40
      }
      return
    }

    // Handle ball in flight
    if (this.ballActive) {
      this.ballProgress += dt * 3
      if (this.ballProgress >= 1) {
        this.ballActive = false
        const dx = this.ballTargetX - this.receiverX
        const dy = this.ballTargetY - this.receiverY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < PERFECT_ZONE) {
          this.comboCount++
          const combo = Math.min(this.comboCount, 5)
          const pts = 100 + (combo - 1) * 25
          this.score += pts
          this.feedbackText = combo >= 3 ? `PERFECT x${combo}!` : 'PERFECT!'
          this.feedbackColor = '#ffd700'
          this.scorePopValue = pts
          this.scorePopTimer = 1

          // Big celebration
          this.spawnParticles(this.receiverX, this.receiverY, '#ffd700', 30, 200)
          this.spawnParticles(this.receiverX, this.receiverY, '#ff6600', 15, 150)
          this.spawnParticles(this.receiverX, this.receiverY, '#ffffff', 10, 100)
          this.screenShake = 1
          this.catchFlashTimer = 0.3
        } else if (dist < GOOD_ZONE) {
          this.comboCount++
          const pts = 70
          this.score += pts
          this.feedbackText = 'GOOD CATCH!'
          this.feedbackColor = '#1a8a2e'
          this.scorePopValue = pts
          this.scorePopTimer = 1

          // Medium celebration
          this.spawnParticles(this.receiverX, this.receiverY, '#1a8a2e', 15, 120)
          this.spawnParticles(this.receiverX, this.receiverY, '#ffffff', 8, 80)
          this.screenShake = 0.4
          this.catchFlashTimer = 0.2
        } else {
          this.comboCount = 0
          this.feedbackText = 'INCOMPLETE'
          this.feedbackColor = '#ff3333'

          // Sad puff
          this.spawnParticles(this.ballTargetX, this.ballTargetY, '#666666', 6, 40)
        }

        this.throwsLeft--
        this.feedbackTimer = 1.3
        this.waitingForThrow = false
      }
      return
    }

    // Throw on click
    if (input.clicked && this.waitingForThrow) {
      this.ballActive = true
      this.ballX = 300
      this.ballY = 350
      this.ballTargetX = input.mouseX
      this.ballTargetY = input.mouseY
      this.ballProgress = 0
      this.waitingForThrow = false
    }
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

    // Receiver shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(this.receiverX, this.receiverY + 20, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Receiver — pulse on catch
    const receiverScale = this.catchFlashTimer > 0 ? 1 + this.catchFlashTimer * 0.8 : 1
    const receiverRadius = 18 * receiverScale
    ctx.fillStyle = RECEIVER_COLOR
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
    // Jersey
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('23', this.receiverX, this.receiverY)

    // QB shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(300, 370, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // QB
    ctx.fillStyle = RECEIVER_COLOR
    ctx.beginPath()
    ctx.arc(300, 350, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText('12', 300, 350)

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

    // Crosshair with pulsing animation
    if (this.waitingForThrow) {
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
    ctx.fillText(`THROWS: ${this.throwsLeft}`, w - 15, h - 22)

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
    if (this.feedbackTimer > 0) {
      const scale = this.feedbackTimer > 1 ? 1 + (this.feedbackTimer - 1) * 2 : 1
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.scale(scale, scale)
      ctx.font = '28px "Press Start 2P", monospace'
      ctx.fillStyle = this.feedbackColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // Text shadow/glow
      ctx.shadowColor = this.feedbackColor
      ctx.shadowBlur = 20
      ctx.fillText(this.feedbackText, 0, 0)
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // Instructions
    if (this.waitingForThrow && this.feedbackTimer <= 0) {
      ctx.font = '10px "Press Start 2P", monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.textAlign = 'center'
      ctx.fillText('CLICK TO THROW', w / 2, h - 65)
    }
  }

  isComplete(): boolean {
    return this.complete
  }

  getScore(): number {
    return this.score
  }
}

export function PassingDrill({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const state = new PassingDrillState()
    state.receiverX = canvas.width / 2

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
