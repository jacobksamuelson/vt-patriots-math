import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { PixelButton } from '@/components/PixelButton'
import { PlayerSprite } from '@/components/PlayerSprite'
import { useGameStore } from '@/stores/game-store'
import { getProfiles, createProfile, deleteProfile, type Profile, type Avatar } from '@/lib/auth'

export function ProfileSelect() {
  const navigate = useNavigate()
  const setProfile = useGameStore((s) => s.setProfile)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState<Avatar>('blake')

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function selectProfile(profile: Profile) {
    setProfile(profile.id, profile.name, profile.avatar as Avatar)
    navigate('/grade')
  }

  async function handleDelete(id: string) {
    await deleteProfile(id)
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    setConfirmDelete(null)
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const profile = await createProfile(newName.trim(), newAvatar)
    setProfiles((prev) => [profile, ...prev])
    setCreating(false)
    selectProfile(profile)
  }

  return (
    <RetroFrame>
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-pixel text-[18px] text-gold text-glow-gold leading-relaxed">
            VERMONT
          </h1>
          <h1 className="font-pixel text-[26px] text-red text-glow-red leading-relaxed">
            PATRIOTS
          </h1>
          <p className="font-pixel text-[11px] text-chalk/70 mt-1">MATH FOOTBALL</p>
        </div>

        {creating ? (
          /* New profile form */
          <div className="flex flex-col items-center gap-5 bg-navy/80 border-2 border-gold/30 p-6 rounded-sm">
            <h2 className="font-pixel text-[12px] text-gold">NEW PLAYER</h2>

            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ENTER NAME"
              maxLength={16}
              autoFocus
              className="bg-navy border-2 border-chalk/30 text-chalk font-retro text-2xl px-4 py-2 text-center w-64 focus:border-gold focus:outline-none"
            />

            <p className="font-pixel text-[8px] text-chalk/40">CHOOSE YOUR PLAYER</p>

            <div className="flex gap-8">
              {(['blake', 'davion'] as const).map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setNewAvatar(avatar)}
                  className={`flex flex-col items-center gap-2 p-3 border-2 rounded-sm transition-all ${
                    newAvatar === avatar
                      ? 'border-gold bg-gold/10 scale-105'
                      : 'border-chalk/20 hover:border-chalk/40'
                  }`}
                >
                  <PlayerSprite
                    avatar={avatar}
                    size={96}
                    animate={newAvatar === avatar}
                    selected={newAvatar === avatar}
                  />
                  <span className="font-pixel text-[8px] text-chalk">
                    {avatar === 'blake' ? 'BLAKE DRAYE' : 'DAVION TENDERSON'}
                  </span>
                  <span className="font-pixel text-[7px] text-chalk/40">
                    #{avatar === 'blake' ? '12 · QB' : '23 · WR'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <PixelButton variant="gold" onClick={handleCreate}>
                CREATE
              </PixelButton>
              <PixelButton variant="secondary" onClick={() => setCreating(false)}>
                BACK
              </PixelButton>
            </div>
          </div>
        ) : (
          /* Profile list */
          <div className="flex flex-col items-center gap-5">
            {loading ? (
              <p className="font-retro text-2xl text-chalk/50">Loading players...</p>
            ) : profiles.length === 0 ? (
              <p className="font-retro text-2xl text-chalk/50">No players yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto">
                {profiles.map((profile) => (
                  <div key={profile.id} className="relative group">
                    {confirmDelete === profile.id ? (
                      /* Confirm delete overlay */
                      <div className="flex flex-col items-center gap-2 bg-navy border-2 border-red p-3 rounded-sm min-w-[220px]">
                        <p className="font-pixel text-[8px] text-red">DELETE {profile.name}?</p>
                        <p className="font-retro text-sm text-chalk/40">All progress will be lost</p>
                        <div className="flex gap-2">
                          <PixelButton size="sm" variant="danger" onClick={() => handleDelete(profile.id)}>
                            YES
                          </PixelButton>
                          <PixelButton size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
                            NO
                          </PixelButton>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => selectProfile(profile)}
                        className="flex items-center gap-3 bg-navy border-2 border-chalk/20 hover:border-gold p-3 rounded-sm transition-colors min-w-[220px] w-full"
                      >
                        <PlayerSprite avatar={profile.avatar as Avatar} size={48} />
                        <div className="text-left flex-1">
                          <p className="font-pixel text-[10px] text-chalk">{profile.name}</p>
                          <p className="font-retro text-lg text-chalk/50">
                            {profile.avatar === 'blake' ? 'Blake Draye' : 'Davion Tenderson'}
                          </p>
                        </div>
                      </button>
                    )}
                    {/* Delete button — visible on hover */}
                    {confirmDelete !== profile.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(profile.id) }}
                        className="absolute top-1 right-1 w-6 h-6 bg-navy/80 border border-chalk/20 rounded-sm text-chalk/30 hover:text-red hover:border-red text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete profile"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <PixelButton variant="gold" size="lg" onClick={() => setCreating(true)}>
              NEW PLAYER
            </PixelButton>
          </div>
        )}
      </div>
    </RetroFrame>
  )
}
