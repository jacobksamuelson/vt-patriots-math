interface RetroFrameProps {
  children: React.ReactNode
}

export function RetroFrame({ children }: RetroFrameProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-navy">
      <div className="relative w-[960px] h-[640px] border-4 border-gold rounded-sm overflow-hidden crt-glow scanlines">
        <div className="absolute inset-0 bg-navy-light">
          {children}
        </div>
      </div>
    </div>
  )
}
