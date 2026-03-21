import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RetroFrame } from '@/components/RetroFrame'
import { PixelButton } from '@/components/PixelButton'
import { useGameStore } from '@/stores/game-store'
import { getProfiles, createProfile, type Profile, type Avatar } from '@/lib/auth'

export function ProfileSelect() {
  const navigate = useNavigate()
  const setProfile = useGameStore((s) => s.setProfile)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
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

  async function handleCreate() {
    if (!newName.trim()) return
    const profile = await createProfile(newName.trim(), newAvatar)
    setProfiles((prev) => [profile, ...prev])
    setCreating(false)
    selectProfile(profile)
  }

  return (
    <RetroFrame>
      <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="font-pixel text-[20px] text-gold text-glow-gold leading-relaxed">
            VERMONT
          </h1>
          <h1 className="font-pixel text-[28px] text-red text-glow-red leading-relaxed">
            PATRIOTS
          </h1>
          <p className="font-pixel text-[12px] text-chalk/70 mt-2">MATH FOOTBALL</p>
        </div>

        {creating ? (
          /* New profile form */
          <div className="flex flex-col items-center gap-6 bg-navy/80 border-2 border-gold/30 p-8 rounded-sm">
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

            <div className="flex gap-6">
              {(['blake', 'davion'] as const).map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setNewAvatar(avatar)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-sm transition-colors ${
                    newAvatar === avatar
                      ? 'border-gold bg-navy-light'
                      : 'border-chalk/20 hover:border-chalk/40'
                  }`}
                >
                  <div className="w-16 h-16 bg-blue-team rounded-sm flex items-center justify-center">
                    <span className="font-pixel text-[10px] text-chalk">
                      #{avatar === 'blake' ? '12' : '23'}
                    </span>
                  </div>
                  <span className="font-pixel text-[8px] text-chalk">
                    {avatar === 'blake' ? 'BLAKE' : 'DAVION'}
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
          <div className="flex flex-col items-center gap-6">
            {loading ? (
              <p className="font-retro text-2xl text-chalk/50">Loading players...</p>
            ) : profiles.length === 0 ? (
              <p className="font-retro text-2xl text-chalk/50">No players yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[280px] overflow-y-auto">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => selectProfile(profile)}
                    className="flex items-center gap-4 bg-navy border-2 border-chalk/20 hover:border-gold p-4 rounded-sm transition-colors min-w-[200px]"
                  >
                    <div className="w-12 h-12 bg-blue-team rounded-sm flex items-center justify-center shrink-0">
                      <span className="font-pixel text-[8px] text-chalk">
                        #{profile.avatar === 'blake' ? '12' : '23'}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-pixel text-[10px] text-chalk">{profile.name}</p>
                      <p className="font-retro text-lg text-chalk/50">
                        {profile.avatar === 'blake' ? 'Blake Draye' : 'Davion Tenderson'}
                      </p>
                    </div>
                  </button>
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
