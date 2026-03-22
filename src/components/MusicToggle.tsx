import { useAudioStore } from '@/stores/audio-store'

interface Props {
  className?: string
}

export function MusicToggle({ className = '' }: Props) {
  const { muted, toggleMute } = useAudioStore()

  return (
    <button
      onClick={toggleMute}
      className={`retro-btn bg-navy border-chalk/30 text-chalk/60 hover:text-chalk hover:border-chalk/50 px-3 py-1.5 text-[8px] flex items-center gap-2 ${className}`}
      title={muted ? 'Turn sound on' : 'Turn sound off'}
    >
      <span className="text-sm">{muted ? '🔇' : '🔊'}</span>
      <span className="font-pixel">{muted ? 'OFF' : 'ON'}</span>
    </button>
  )
}
