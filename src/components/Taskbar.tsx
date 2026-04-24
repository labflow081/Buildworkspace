import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWindows } from '@/contexts/WindowContext'
import { useAuth } from '@/contexts/AuthContext'
import { UserAvatar } from './UserAvatar'

const Clock = () => {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{ fontSize: 11, color: 'white', fontFamily: 'Tahoma', whiteSpace: 'nowrap' }}>
      {time.getHours().toString().padStart(2, '0')}:{time.getMinutes().toString().padStart(2, '0')}
    </span>
  )
}

export const Taskbar = () => {
  const navigate = useNavigate()
  const { minimized, removeMinimized, toggleStartMenu } = useWindows()
  const { profile } = useAuth()

  const restoreWindow = (id: string, path: string) => {
    removeMinimized(id)
    navigate(path)
  }

  return (
    <div className="xp-taskbar" style={{ zIndex: 9998 }}>
      {/* Start button */}
      <button className="xp-start-btn" onClick={toggleStartMenu} aria-label="Start">
        <img src="/logo.png" alt="" style={{ width: 16, height: 16, marginRight: 4, imageRendering: 'pixelated' }}
          onError={e => { e.currentTarget.style.display = 'none' }} />
        start
      </button>

      {/* Separator */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

      {/* Minimized windows */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {minimized.map(win => (
          <button
            key={win.id}
            onClick={() => restoreWindow(win.id, win.path)}
            style={{
              background: 'linear-gradient(180deg, #3569B5 0%, #2A5BA5 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              color: 'white',
              fontSize: 11,
              fontFamily: 'Tahoma',
              padding: '2px 8px',
              height: 26,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {win.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div
        className="flex items-center gap-2 px-2"
        style={{
          background: 'rgba(0,0,0,0.2)',
          height: 32,
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <UserAvatar profile={profile} size={20} />
        <Clock />
      </div>
    </div>
  )
}
