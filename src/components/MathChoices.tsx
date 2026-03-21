interface MathChoicesProps {
  choices: number[]
  onSelect: (choice: number) => void
  disabled: boolean
  correctAnswer: number | null // non-null when showing result
  selectedAnswer: number | null
}

export function MathChoices({ choices, onSelect, disabled, correctAnswer, selectedAnswer }: MathChoicesProps) {
  function getStyle(choice: number): string {
    const base = 'retro-btn w-full py-4 text-center font-pixel text-[16px] transition-all duration-150'

    if (correctAnswer !== null) {
      if (choice === correctAnswer) {
        return `${base} bg-field border-field text-chalk scale-105`
      }
      if (choice === selectedAnswer && choice !== correctAnswer) {
        return `${base} bg-red/60 border-red text-chalk opacity-70`
      }
      return `${base} bg-navy border-chalk/10 text-chalk/30`
    }

    return `${base} bg-blue-team border-blue-light text-chalk hover:bg-blue-light hover:scale-[1.02]`
  }

  return (
    <div className="grid grid-cols-2 gap-4 w-[400px]">
      {choices.map((choice) => (
        <button
          key={choice}
          onClick={() => onSelect(choice)}
          disabled={disabled}
          className={getStyle(choice)}
        >
          {choice}
        </button>
      ))}
    </div>
  )
}
