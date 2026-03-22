import { useState, useEffect } from 'react'
import { UNLOCKABLES, type Unlockable } from '@/lib/unlockables'

interface Props {
  unlockedIds: string[]
  previousIds: string[]
}

export function UnlockBanner({ unlockedIds, previousIds }: Props) {
  const [newUnlock, setNewUnlock] = useState<Unlockable | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Find newly unlocked items
    const prevSet = new Set(previousIds)
    const newIds = unlockedIds.filter((id) => !prevSet.has(id))
    if (newIds.length === 0) return

    const item = UNLOCKABLES.find((u) => u.id === newIds[0])
    if (!item) return

    setNewUnlock(item)
    setVisible(true)

    const timer = setTimeout(() => setVisible(false), 4000)
    return () => clearTimeout(timer)
  }, [unlockedIds, previousIds])

  if (!newUnlock || !visible) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-[slideDown_0.5s_ease-out]">
      <div className="bg-navy border-2 border-gold px-6 py-3 rounded-sm flex items-center gap-4 shadow-[0_4px_20px_rgba(255,215,0,0.3)]">
        <span className="text-3xl">{newUnlock.icon}</span>
        <div>
          <p className="font-pixel text-[10px] text-gold text-glow-gold">UNLOCKED!</p>
          <p className="font-pixel text-[8px] text-chalk mt-0.5">{newUnlock.name}</p>
          <p className="font-retro text-lg text-chalk/50">{newUnlock.description}</p>
        </div>
      </div>
    </div>
  )
}
