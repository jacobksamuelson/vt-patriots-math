import { useRef, useEffect } from 'react'

interface Props {
  avatar: 'blake' | 'davion'
  size?: number
  animate?: boolean
  selected?: boolean
}

const SKIN_COLORS = {
  blake: { skin: '#F5D0B0', hair: '#8B6914' },
  davion: { skin: '#8B5E3C', hair: '#2C1810' },
}

const JERSEY_BLUE = '#2244aa'
const JERSEY_LIGHT = '#3366dd'
const PANTS_WHITE = '#E8E8E0'
const HELMET_SILVER = '#C0C0D0'
const HELMET_STRIPE = '#ffd700'

export function PlayerSprite({ avatar, size = 80, animate = false, selected = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const colors = SKIN_COLORS[avatar]
    const number = avatar === 'blake' ? '12' : '23'

    function draw() {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height)
      const s = canvas!.width / 32 // scale factor (32px base grid)
      const bobY = animate ? Math.sin(frameRef.current * 0.08) * 1.5 * s : 0

      ctx.imageSmoothingEnabled = false

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.beginPath()
      ctx.ellipse(16 * s, 30 * s, 6 * s, 2 * s, 0, 0, Math.PI * 2)
      ctx.fill()

      // Legs / pants
      ctx.fillStyle = PANTS_WHITE
      ctx.fillRect(12 * s, (22 + bobY / s) * s, 3 * s, 6 * s) // left leg
      ctx.fillRect(17 * s, (22 + bobY / s) * s, 3 * s, 6 * s) // right leg

      // Shoes
      ctx.fillStyle = '#111'
      ctx.fillRect(11 * s, (27 + bobY / s) * s, 4 * s, 2 * s)
      ctx.fillRect(17 * s, (27 + bobY / s) * s, 4 * s, 2 * s)

      // Body / jersey
      ctx.fillStyle = JERSEY_BLUE
      ctx.fillRect(10 * s, (12 + bobY / s) * s, 12 * s, 11 * s)
      // Jersey stripes
      ctx.fillStyle = JERSEY_LIGHT
      ctx.fillRect(10 * s, (14 + bobY / s) * s, 12 * s, 1.5 * s)
      ctx.fillRect(10 * s, (18 + bobY / s) * s, 12 * s, 1.5 * s)

      // Arms
      ctx.fillStyle = JERSEY_BLUE
      ctx.fillRect(7 * s, (13 + bobY / s) * s, 3 * s, 7 * s) // left arm
      ctx.fillRect(22 * s, (13 + bobY / s) * s, 3 * s, 7 * s) // right arm
      // Hands
      ctx.fillStyle = colors.skin
      ctx.fillRect(7 * s, (19 + bobY / s) * s, 3 * s, 2 * s)
      ctx.fillRect(22 * s, (19 + bobY / s) * s, 3 * s, 2 * s)

      // Jersey number
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${3.5 * s}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(number, 16 * s, (17.5 + bobY / s) * s)

      // Neck
      ctx.fillStyle = colors.skin
      ctx.fillRect(14 * s, (10 + bobY / s) * s, 4 * s, 3 * s)

      // Helmet
      ctx.fillStyle = HELMET_SILVER
      ctx.beginPath()
      ctx.arc(16 * s, (7 + bobY / s) * s, 5.5 * s, 0, Math.PI * 2)
      ctx.fill()
      // Helmet stripe
      ctx.fillStyle = HELMET_STRIPE
      ctx.fillRect(15 * s, (2 + bobY / s) * s, 2 * s, 5 * s)
      // Face opening
      ctx.fillStyle = colors.skin
      ctx.fillRect(13 * s, (6 + bobY / s) * s, 4 * s, 3 * s)
      // Facemask
      ctx.strokeStyle = HELMET_SILVER
      ctx.lineWidth = 0.8 * s
      ctx.beginPath()
      ctx.moveTo(13 * s, (7 + bobY / s) * s)
      ctx.lineTo(11.5 * s, (8 + bobY / s) * s)
      ctx.lineTo(13 * s, (9 + bobY / s) * s)
      ctx.stroke()
      // Eye
      ctx.fillStyle = '#111'
      ctx.fillRect(14 * s, (7 + bobY / s) * s, 1.2 * s, 1.2 * s)

      // Football in right hand (if blake = QB)
      if (avatar === 'blake') {
        ctx.fillStyle = '#8B4513'
        ctx.beginPath()
        ctx.ellipse(24 * s, (18 + bobY / s) * s, 2.5 * s, 1.5 * s, 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 0.5 * s
        ctx.beginPath()
        ctx.moveTo(23 * s, (17 + bobY / s) * s)
        ctx.lineTo(25 * s, (17 + bobY / s) * s)
        ctx.stroke()
      }

      // Selection glow
      if (selected) {
        ctx.strokeStyle = '#ffd700'
        ctx.lineWidth = 2 * s
        ctx.shadowColor = '#ffd700'
        ctx.shadowBlur = 10 * s
        ctx.strokeRect(4 * s, 1 * s, 24 * s, 28 * s)
        ctx.shadowBlur = 0
      }

      frameRef.current++
      if (animate) {
        animRef.current = requestAnimationFrame(draw)
      }
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [avatar, size, animate, selected])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="pixel-art"
    />
  )
}
