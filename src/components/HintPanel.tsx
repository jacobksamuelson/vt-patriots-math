interface HintPanelProps {
  hints: string[]
  hintIndex: number // 0 = no hints, 1 = first hint, 2 = both hints
}

export function HintPanel({ hints, hintIndex }: HintPanelProps) {
  if (hintIndex === 0 || hints.length === 0) return null

  return (
    <div className="bg-hint-bg border-2 border-gold/20 rounded-sm px-5 py-3 max-w-[400px] animate-[slideUp_0.3s_ease-out]">
      <p className="font-pixel text-[8px] text-gold/60 mb-2">HINT</p>
      <div className="flex flex-col gap-2">
        {hints.slice(0, hintIndex).map((hint, i) => (
          <p key={i} className="font-retro text-xl text-chalk/80 leading-snug">
            {hint}
          </p>
        ))}
      </div>
    </div>
  )
}
