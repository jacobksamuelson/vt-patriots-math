interface HintPanelProps {
  hints: string[]
  hintIndex: number // 0 = no hints, 1 = first hint, 2 = both hints
  solution?: string[] | null // step-by-step solution, shown after wrong twice
  showSolution?: boolean
  correctAnswer?: number
}

export function HintPanel({ hints, hintIndex, solution, showSolution, correctAnswer }: HintPanelProps) {
  if (hintIndex === 0 && !showSolution) return null
  if (hints.length === 0 && !showSolution) return null

  return (
    <div className="bg-hint-bg border-2 border-gold/20 rounded-sm px-5 py-3 max-w-[440px] animate-[slideUp_0.3s_ease-out]">
      {showSolution && solution && solution.length > 0 ? (
        <>
          <p className="font-pixel text-[8px] text-gold mb-3">HOW TO SOLVE IT</p>
          <div className="flex flex-col gap-2">
            {solution.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="font-pixel text-[9px] text-gold/50 shrink-0 mt-0.5">
                  {i + 1}.
                </span>
                <p className="font-retro text-xl text-chalk/90 leading-snug">{step}</p>
              </div>
            ))}
          </div>
          {correctAnswer !== undefined && (
            <div className="mt-3 pt-2 border-t border-gold/10 text-center">
              <span className="font-pixel text-[8px] text-chalk/40">ANSWER: </span>
              <span className="font-pixel text-[12px] text-gold text-glow-gold">{correctAnswer}</span>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="font-pixel text-[8px] text-gold/60 mb-2">HINT</p>
          <div className="flex flex-col gap-2">
            {hints.slice(0, hintIndex).map((hint, i) => (
              <p key={i} className="font-retro text-xl text-chalk/80 leading-snug">
                {hint}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
