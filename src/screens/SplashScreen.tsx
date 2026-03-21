import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAudioStore } from '@/stores/audio-store'
import { playIntroMusic, stopIntroMusic } from '@/lib/music'

export function SplashScreen() {
  const navigate = useNavigate()
  const { muted } = useAudioStore()
  const [phase, setPhase] = useState<'loading' | 'ready' | 'exit'>('loading')
  const [loadPct, setLoadPct] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  // Fake loading bar
  useEffect(() => {
    if (phase !== 'loading') return
    const timer = setInterval(() => {
      setLoadPct((p) => {
        if (p >= 100) {
          clearInterval(timer)
          setPhase('ready')
          return 100
        }
        return p + 2 + Math.random() * 5
      })
    }, 60)
    return () => clearInterval(timer)
  }, [phase])

  // Music needs a user gesture to start (browser policy).
  // We start it on the first click anywhere on the splash screen.
  const [musicStarted, setMusicStarted] = useState(false)

  useEffect(() => {
    if (musicStarted || muted || phase === 'exit') return

    function startOnClick() {
      playIntroMusic()
      setMusicStarted(true)
      document.removeEventListener('click', startOnClick)
    }

    if (phase === 'ready') {
      document.addEventListener('click', startOnClick)
      return () => document.removeEventListener('click', startOnClick)
    }
  }, [phase, muted, musicStarted])

  // Animated field background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let offset = 0

    function draw() {
      if (!ctx) return
      const w = canvas!.width
      const h = canvas!.height
      offset += 0.3

      // Field green gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#1a8a2e')
      grad.addColorStop(0.5, '#22a038')
      grad.addColorStop(1, '#168025')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Scrolling yard lines
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 3
      for (let y = (offset % 50) - 50; y < h + 50; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Hash marks
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 2
      for (let y = (offset % 50) - 50; y < h + 50; y += 50) {
        for (const x of [w * 0.2, w * 0.4, w * 0.6, w * 0.8]) {
          ctx.beginPath()
          ctx.moveTo(x, y - 6)
          ctx.lineTo(x, y + 6)
          ctx.stroke()
        }
      }

      // Subtle vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.4)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  function handlePlay() {
    setPhase('exit')
    stopIntroMusic()
    setTimeout(() => navigate('/profiles'), 500)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Animated field background */}
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        className="absolute inset-0 w-full h-full"
      />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center h-full transition-opacity duration-500 ${
          phase === 'exit' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Logo / Shield area */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              {/* Shield shape */}
              <path d="M50 5 L90 25 L85 75 L50 95 L15 75 L10 25 Z" fill="#1a3a8a" stroke="#ffd700" strokeWidth="3" />
              <path d="M50 15 L78 30 L74 70 L50 85 L26 70 L22 30 Z" fill="#2244aa" />
              {/* Star */}
              <polygon points="50,25 56,42 74,42 60,53 65,70 50,60 35,70 40,53 26,42 44,42" fill="#ff3333" stroke="#ffd700" strokeWidth="1" />
              {/* VP text */}
              <text x="50" y="82" textAnchor="middle" fill="#ffd700" fontSize="12" fontFamily="monospace" fontWeight="bold">VP</text>
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <p
            className="font-pixel text-[14px] tracking-[0.3em] text-chalk/80"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            VERMONT
          </p>
          <h1
            className="font-pixel text-[42px] text-red leading-tight"
            style={{ textShadow: '0 0 20px rgba(255,50,50,0.5), 0 3px 0 #990000, 0 4px 8px rgba(0,0,0,0.5)' }}
          >
            PATRIOTS
          </h1>
          <div className="bg-blue-team/90 border-2 border-gold px-6 py-1.5 mt-1 inline-block">
            <p
              className="font-pixel text-[13px] text-gold tracking-wider"
              style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}
            >
              MATH FOOTBALL
            </p>
          </div>
        </div>

        {/* Players */}
        <div className="flex items-end justify-center gap-24 my-6">
          {/* Blake */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-24 bg-blue-team border-2 border-blue-light rounded-sm flex flex-col items-center justify-center shadow-lg">
              <span className="font-pixel text-[18px] text-chalk">#12</span>
              <div className="w-4 h-4 rounded-full bg-chalk/80 mt-1" />
            </div>
            <div className="bg-blue-team/90 border border-gold/50 px-3 py-1 mt-2 rounded-sm">
              <p className="font-pixel text-[7px] text-chalk">Blake</p>
              <p className="font-pixel text-[7px] text-chalk">Draye</p>
            </div>
          </div>

          {/* Davion */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-24 bg-blue-team border-2 border-blue-light rounded-sm flex flex-col items-center justify-center shadow-lg">
              <span className="font-pixel text-[18px] text-chalk">#23</span>
              <div className="w-4 h-4 rounded-full bg-amber-800 mt-1" />
            </div>
            <div className="bg-blue-team/90 border border-gold/50 px-3 py-1 mt-2 rounded-sm">
              <p className="font-pixel text-[7px] text-chalk">Davion</p>
              <p className="font-pixel text-[7px] text-chalk">Tenderson</p>
            </div>
          </div>
        </div>

        {/* Play button or loading bar */}
        {phase === 'loading' ? (
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="w-64 h-5 border-2 border-gold/50 bg-navy/80 rounded-sm overflow-hidden">
              <div
                className="h-full bg-gold transition-all duration-100"
                style={{ width: `${Math.min(loadPct, 100)}%` }}
              />
            </div>
            <p className="font-pixel text-[8px] text-chalk/40">LOADING...</p>
          </div>
        ) : (
          <button
            onClick={handlePlay}
            className="mt-4 group relative"
          >
            <div
              className="bg-gradient-to-b from-gold to-gold-dark border-4 border-gold px-12 py-4 rounded-sm transition-transform group-hover:scale-105 group-active:scale-95"
              style={{ boxShadow: '0 4px 0 #996600, 0 6px 12px rgba(0,0,0,0.4)' }}
            >
              <span
                className="font-pixel text-[22px] text-navy"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}
              >
                PLAY!
              </span>
            </div>
          </button>
        )}

        {/* Hints */}
        {phase === 'ready' && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="font-pixel text-[8px] text-chalk/30 animate-pulse">
              GRADES 3 — 6
            </p>
            {!musicStarted && !muted && (
              <p className="font-pixel text-[6px] text-chalk/20">
                CLICK ANYWHERE FOR MUSIC
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
