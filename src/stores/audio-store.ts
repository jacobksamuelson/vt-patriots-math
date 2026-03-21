import { create } from 'zustand'

interface AudioStore {
  muted: boolean
  toggleMute: () => void
  playCorrect: () => void
  playIncorrect: () => void
  playStreak: () => void
}

// Lazy-init AudioContext (browsers require user gesture first)
let ctx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'square') {
  const audio = getCtx()
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.15, audio.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, audio.currentTime + duration)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + duration)
}

function playMelody(notes: [number, number][], type: OscillatorType = 'square') {
  const audio = getCtx()
  let time = audio.currentTime
  for (const [freq, dur] of notes) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.12, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(time)
    osc.stop(time + dur)
    time += dur * 0.7
  }
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  muted: false,

  toggleMute: () => set((s) => ({ muted: !s.muted })),

  playCorrect: () => {
    if (get().muted) return
    // Upward two-note chime
    playMelody([
      [523, 0.1], // C5
      [659, 0.15], // E5
    ])
  },

  playIncorrect: () => {
    if (get().muted) return
    // Low buzz
    playTone(180, 0.25, 'sawtooth')
  },

  playStreak: () => {
    if (get().muted) return
    // Triumphant ascending arpeggio
    playMelody([
      [523, 0.08], // C5
      [659, 0.08], // E5
      [784, 0.08], // G5
      [1047, 0.2], // C6
    ])
  },
}))
