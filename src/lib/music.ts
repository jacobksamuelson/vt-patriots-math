// Retro chiptune intro music — all generated via Web Audio API
let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let isPlaying = false
let scheduledNodes: OscillatorNode[] = []

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Note frequencies
const NOTE: Record<string, number> = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
  A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
  F5: 698.46, G5: 783.99, A5: 880.00,
  REST: 0,
}

interface MelodyNote {
  note: string
  duration: number // in beats
}

// Upbeat, stadium-anthem-style melody
const MELODY: MelodyNote[] = [
  // Bar 1 - triumphant opening
  { note: 'C4', duration: 0.5 }, { note: 'E4', duration: 0.5 },
  { note: 'G4', duration: 0.5 }, { note: 'C5', duration: 0.5 },
  { note: 'E5', duration: 1 }, { note: 'D5', duration: 1 },
  // Bar 2
  { note: 'C5', duration: 0.5 }, { note: 'G4', duration: 0.5 },
  { note: 'A4', duration: 1 }, { note: 'G4', duration: 0.5 },
  { note: 'F4', duration: 0.5 }, { note: 'E4', duration: 1 },
  // Bar 3 - build up
  { note: 'F4', duration: 0.5 }, { note: 'G4', duration: 0.5 },
  { note: 'A4', duration: 0.5 }, { note: 'B4', duration: 0.5 },
  { note: 'C5', duration: 1 }, { note: 'D5', duration: 0.5 },
  { note: 'E5', duration: 0.5 },
  // Bar 4 - resolve
  { note: 'G5', duration: 1.5 }, { note: 'E5', duration: 0.5 },
  { note: 'C5', duration: 1 }, { note: 'REST', duration: 1 },
]

// Bass line
const BASS: MelodyNote[] = [
  { note: 'C4', duration: 2 }, { note: 'G4', duration: 2 },
  { note: 'A4', duration: 2 }, { note: 'E4', duration: 2 },
  { note: 'F4', duration: 2 }, { note: 'G4', duration: 2 },
  { note: 'C5', duration: 2 }, { note: 'C4', duration: 2 },
]

function scheduleVoice(
  audio: AudioContext,
  master: GainNode,
  notes: MelodyNote[],
  startTime: number,
  bpm: number,
  type: OscillatorType,
  volume: number,
  octaveShift: number = 0,
): OscillatorNode[] {
  const beatDuration = 60 / bpm
  const nodes: OscillatorNode[] = []
  let time = startTime

  for (const { note, duration } of notes) {
    const dur = duration * beatDuration
    if (note !== 'REST') {
      const freq = NOTE[note] * Math.pow(2, octaveShift)
      const osc = audio.createOscillator()
      const gain = audio.createGain()

      osc.type = type
      osc.frequency.value = freq

      // Envelope
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(volume, time + 0.02)
      gain.gain.setValueAtTime(volume, time + dur * 0.7)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.95)

      osc.connect(gain)
      gain.connect(master)
      osc.start(time)
      osc.stop(time + dur)
      nodes.push(osc)
    }
    time += dur
  }

  return nodes
}

export function playIntroMusic() {
  if (isPlaying) return
  isPlaying = true

  const audio = getCtx()
  masterGain = audio.createGain()
  masterGain.gain.value = 0.3
  masterGain.connect(audio.destination)

  const bpm = 140
  const now = audio.currentTime + 0.1

  function scheduleLoop(startTime: number) {
    if (!isPlaying || !masterGain) return

    // Lead melody — square wave (classic chiptune)
    const melodyNodes = scheduleVoice(audio, masterGain, MELODY, startTime, bpm, 'square', 0.08)

    // Bass — triangle wave (warm low end)
    const bassNodes = scheduleVoice(audio, masterGain, BASS, startTime, bpm, 'triangle', 0.12, -1)

    // Harmony — pulse (quieter, adds fullness)
    const harmonyNotes = MELODY.map((n) => ({
      ...n,
      note: n.note === 'REST' ? 'REST' : n.note, // keep same timing
    }))
    const harmonyNodes = scheduleVoice(audio, masterGain, harmonyNotes, startTime, bpm, 'sawtooth', 0.03, -1)

    scheduledNodes.push(...melodyNodes, ...bassNodes, ...harmonyNodes)

    // Calculate loop length and schedule next
    const beatDuration = 60 / bpm
    const totalBeats = MELODY.reduce((sum, n) => sum + n.duration, 0)
    const loopLength = totalBeats * beatDuration

    // Schedule next loop slightly before this one ends
    setTimeout(() => scheduleLoop(startTime + loopLength), (loopLength - 0.5) * 1000)
  }

  scheduleLoop(now)
}

export function stopIntroMusic() {
  isPlaying = false
  for (const node of scheduledNodes) {
    try { node.stop() } catch { /* already stopped */ }
  }
  scheduledNodes = []
  if (masterGain) {
    masterGain.gain.linearRampToValueAtTime(0, (ctx?.currentTime ?? 0) + 0.3)
  }
}
