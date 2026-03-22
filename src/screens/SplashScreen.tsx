import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAudioStore } from '@/stores/audio-store'
import { MusicToggle } from '@/components/MusicToggle'
import { PlayerSprite } from '@/components/PlayerSprite'
import { playIntroMusic, stopIntroMusic } from '@/lib/music'

export function SplashScreen() {
  const navigate = useNavigate()
  const { muted } = useAudioStore()
  const [phase, setPhase] = useState<'loading' | 'ready' | 'exit'>('loading')
  const [loadPct, setLoadPct] = useState(0)
  const [musicStarted, setMusicStarted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  // Loading bar
  useEffect(() => {
    if (phase !== 'loading') return
    const timer = setInterval(() => {
      setLoadPct((p) => {
        if (p >= 100) { clearInterval(timer); setPhase('ready'); return 100 }
        return p + 2 + Math.random() * 5
      })
    }, 60)
    return () => clearInterval(timer)
  }, [phase])

  // Music on first click
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

  // Stop music if muted
  useEffect(() => {
    if (muted && musicStarted) {
      stopIntroMusic()
      setMusicStarted(false)
    }
  }, [muted, musicStarted])

  // Animated field background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let offset = 0

    function draw() {
      const w = canvas!.width
      const h = canvas!.height
      offset += 0.4

      // Field green gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#1a8a2e')
      grad.addColorStop(0.3, '#22a038')
      grad.addColorStop(0.7, '#1e9432')
      grad.addColorStop(1, '#168025')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Alternating field stripes
      for (let y = (offset % 80) - 80; y < h + 80; y += 80) {
        ctx.fillStyle = 'rgba(0,0,0,0.04)'
        ctx.fillRect(0, y, w, 40)
      }

      // Yard lines (thick white dashes)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 3
      for (let y = (offset % 60) - 60; y < h + 60; y += 60) {
        ctx.setLineDash([20, 15])
        ctx.beginPath()
        ctx.moveTo(w * 0.05, y)
        ctx.lineTo(w * 0.95, y)
        ctx.stroke()
      }
      ctx.setLineDash([])

      // Hash marks
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 2
      for (let y = (offset % 60) - 60; y < h + 60; y += 60) {
        for (const x of [w * 0.15, w * 0.35, w * 0.65, w * 0.85]) {
          ctx.beginPath()
          ctx.moveTo(x, y - 8)
          ctx.lineTo(x, y + 8)
          ctx.stroke()
        }
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.75)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.45)')
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
    setTimeout(() => navigate('/profiles'), 400)
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Animated field */}
      <canvas ref={canvasRef} width={960} height={640} className="absolute inset-0 w-full h-full" />

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Music toggle — top right */}
      <div className="absolute top-4 right-4 z-20">
        <MusicToggle />
      </div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center justify-between h-full py-6 transition-opacity duration-400 ${phase === 'exit' ? 'opacity-0 scale-95' : 'opacity-100'}`}>

        {/* Top section — Logo */}
        <div className="flex flex-col items-center mt-2">
          {/* Shield */}
          <svg viewBox="0 0 120 130" className="w-28 h-28 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {/* Outer shield */}
            <path d="M60 5 L110 30 L105 95 L60 125 L15 95 L10 30 Z" fill="#0a1a5a" stroke="#ffd700" strokeWidth="4" />
            {/* Inner shield */}
            <path d="M60 15 L98 35 L94 88 L60 115 L26 88 L22 35 Z" fill="#1a3a8a" />
            {/* Diagonal stripe */}
            <path d="M35 35 L85 85 L80 92 L30 42 Z" fill="#ff3333" opacity="0.6" />
            {/* Star */}
            <polygon points="60,28 67,48 88,48 71,60 78,80 60,68 42,80 49,60 32,48 53,48" fill="#ff3333" stroke="#ffd700" strokeWidth="1.5" />
            {/* VP text */}
            <text x="60" y="108" textAnchor="middle" fill="#ffd700" fontSize="16" fontFamily="monospace" fontWeight="bold">VP</text>
          </svg>
        </div>

        {/* Middle section — Title + Players */}
        <div className="flex items-center gap-6">
          {/* Blake (left) */}
          <div className="flex flex-col items-center">
            <PlayerSprite avatar="blake" size={120} animate />
            <div className="bg-blue-team/90 border-2 border-gold/50 px-3 py-1.5 mt-1 rounded-sm text-center">
              <p className="font-pixel text-[7px] text-chalk leading-tight">Blake</p>
              <p className="font-pixel text-[7px] text-chalk leading-tight">Draye</p>
            </div>
          </div>

          {/* Title block */}
          <div className="flex flex-col items-center">
            <p
              className="font-pixel text-[16px] tracking-[0.25em] text-chalk/90 mb-1"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
            >
              VERMONT
            </p>
            <h1
              className="font-pixel text-[48px] text-red leading-none"
              style={{ textShadow: '0 0 30px rgba(255,50,50,0.4), 0 4px 0 #880000, 0 5px 10px rgba(0,0,0,0.5)' }}
            >
              PATRIOTS
            </h1>
            {/* Banner */}
            <div
              className="bg-gradient-to-r from-blue-team via-blue-light to-blue-team border-y-2 border-gold px-10 py-2 mt-2 -mx-4"
              style={{ clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)' }}
            >
              <p
                className="font-pixel text-[15px] text-gold tracking-wider"
                style={{ textShadow: '0 0 12px rgba(255,215,0,0.5)' }}
              >
                MATH FOOTBALL
              </p>
            </div>
          </div>

          {/* Davion (right) */}
          <div className="flex flex-col items-center">
            <PlayerSprite avatar="davion" size={120} animate />
            <div className="bg-blue-team/90 border-2 border-gold/50 px-3 py-1.5 mt-1 rounded-sm text-center">
              <p className="font-pixel text-[7px] text-chalk leading-tight">Davion</p>
              <p className="font-pixel text-[7px] text-chalk leading-tight">Tenderson</p>
            </div>
          </div>
        </div>

        {/* Bottom section — Play button + loading */}
        <div className="flex flex-col items-center gap-3">
          {phase === 'loading' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-72 h-6 border-2 border-gold/50 bg-navy/80 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all duration-100"
                  style={{ width: `${Math.min(loadPct, 100)}%` }}
                />
              </div>
              <p className="font-pixel text-[8px] text-chalk/40">LOADING...</p>
            </div>
          ) : (
            <>
              {/* PLAY button */}
              <button onClick={handlePlay} className="group relative">
                <div
                  className="bg-gradient-to-b from-gold to-gold-dark border-4 border-gold px-16 py-4 rounded-sm transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{ boxShadow: '0 5px 0 #8a6600, 0 7px 15px rgba(0,0,0,0.5)' }}
                >
                  <span
                    className="font-pixel text-[26px] text-navy"
                    style={{ textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}
                  >
                    PLAY!
                  </span>
                </div>
              </button>

              {/* Grade badges */}
              <div className="flex flex-col items-center gap-2 mt-1">
                <p className="font-retro text-xl text-chalk/40">Select your grade</p>
                <div className="flex gap-3">
                  {[3, 4, 5, 6].map((g) => (
                    <div
                      key={g}
                      className="w-10 h-10 bg-blue-team/60 border-2 border-blue-light/50 rounded-sm flex items-center justify-center"
                    >
                      <span className="font-pixel text-[14px] text-chalk/70">{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!musicStarted && !muted && (
                <p className="font-pixel text-[6px] text-chalk/20 mt-1">
                  CLICK ANYWHERE FOR MUSIC
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
