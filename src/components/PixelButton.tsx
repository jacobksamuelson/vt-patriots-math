interface PixelButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'gold' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

const variantStyles = {
  primary: 'bg-blue-team border-blue-light text-chalk hover:bg-blue-light',
  secondary: 'bg-navy border-chalk/30 text-chalk hover:bg-navy-light',
  gold: 'bg-gold-dark border-gold text-navy hover:bg-gold',
  danger: 'bg-red border-red/70 text-chalk hover:bg-red/80',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-[8px]',
  md: 'px-5 py-2.5 text-[10px]',
  lg: 'px-8 py-4 text-[14px]',
}

export function PixelButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: PixelButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`retro-btn ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {children}
    </button>
  )
}
