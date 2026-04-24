import { Profile } from '@/types'

interface UserAvatarProps {
  profile: Profile | null
  size?: number
  className?: string
}

export const UserAvatar = ({ profile, size = 24, className = '' }: UserAvatarProps) => {
  const color = profile?.avatar_color ?? '#4A90D9'
  const letter = (profile?.display_name ?? '?')[0].toUpperCase()

  return (
    <div
      className={`flex items-center justify-center rounded-full flex-shrink-0 font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.max(8, size * 0.45),
        border: '1px solid rgba(255,255,255,0.3)',
        fontFamily: "'Tahoma', sans-serif",
      }}
    >
      {letter}
    </div>
  )
}
