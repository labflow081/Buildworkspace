import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWindows } from '@/contexts/WindowContext'
import { useProjects } from '@/hooks/useProjects'
import { UserAvatar } from './UserAvatar'
import { getSoundsEnabled, toggleSounds } from '@/lib/sounds'
import { useState } from 'react'

export const StartMenu = () => {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { closeStartMenu } = useWindows()
  const { projects } = useProjects()
  const [soundsOn, setSoundsOn] = useState(getSoundsEnabled())

  const recent = projects.slice(0, 5)

  const go = (path: string) => {
    closeStartMenu()
    navigate(path)
  }

  const handleLogout = async () => {
    closeStartMenu()
    await signOut()
    navigate('/login')
  }

  const handleSoundToggle = () => {
    const next = toggleSounds()
    setSoundsOn(next)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={closeStartMenu}
      />

      {/* Menu */}
      <div
        className="fixed bottom-10 left-0 z-[9999] flex flex-col"
        style={{
          width: 280,
          background: '#ECE9D8',
          border: '2px solid #2A5BA5',
          borderRadius: '6px 6px 0 0',
          boxShadow: '4px 0 12px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          fontFamily: 'Tahoma, Geneva, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, #2A5BA5 0%, #1E4380 100%)',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <UserAvatar profile={profile} size={36} />
          <div>
            <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>
              {profile?.display_name ?? 'Utente'}
            </div>
            <div style={{ color: '#8FCBF0', fontSize: 10 }}>Buildspace081</div>
          </div>
        </div>

        {/* Body: due pannelli */}
        <div className="flex flex-1">
          {/* Sinistra: progetti recenti */}
          <div style={{ flex: 1, background: 'white', padding: '8px 0', borderRight: '1px solid #ccc' }}>
            <div style={{ fontSize: 10, color: '#666', padding: '2px 12px 4px', fontWeight: 600, textTransform: 'uppercase' }}>
              Recenti
            </div>
            {recent.map(p => (
              <button
                key={p.id}
                onClick={() => go(`/project/${p.id}`)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '6px 12px', fontSize: 12,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#1A1828',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
              >
                <svg width="14" height="12" viewBox="0 0 14 12">
                  <rect x="0" y="2" width="14" height="10" fill="#E8B947" rx="1"/>
                  <rect x="0" y="0" width="5" height="3" fill="#F5D77A" rx="1"/>
                </svg>
                <span className="truncate" style={{ maxWidth: 90 }}>{p.name}</span>
              </button>
            ))}
            {recent.length === 0 && (
              <div style={{ fontSize: 11, color: '#999', padding: '6px 12px' }}>Nessun progetto</div>
            )}
            <div style={{ height: 1, background: '#ddd', margin: '4px 0' }} />
            <button
              onClick={() => go('/desktop')}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 12px', fontSize: 12,
                background: 'none', border: 'none', cursor: 'pointer', color: '#1A1828',
                fontWeight: 600,
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
            >
              + Nuovo progetto
            </button>
          </div>

          {/* Destra */}
          <div style={{ width: 110, background: '#D4E4F4', padding: '8px 0' }}>
            <div style={{ fontSize: 10, color: '#555', padding: '2px 8px 4px', fontWeight: 600, textTransform: 'uppercase' }}>
              Menu
            </div>
            <button
              onClick={() => go('/desktop')}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 8px', fontSize: 11,
                background: 'none', border: 'none', cursor: 'pointer', color: '#1A1828',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
            >
              🖥 Desktop
            </button>
            <button
              onClick={handleSoundToggle}
              style={{
                width: '100%', textAlign: 'left',
                padding: '6px 8px', fontSize: 11,
                background: 'none', border: 'none', cursor: 'pointer', color: '#1A1828',
              }}
            >
              {soundsOn ? '🔊' : '🔇'} Suoni
            </button>
            <div style={{ opacity: 0.4, padding: '6px 8px', fontSize: 11, color: '#1A1828' }}>
              ⚙ Impostazioni
            </div>
          </div>
        </div>

        {/* Footer logout */}
        <div style={{ borderTop: '1px solid #aaa', background: '#D4E4F4' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 12px', fontSize: 12,
              background: 'none', border: 'none', cursor: 'pointer', color: '#990000',
              display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
            }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#990000' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="7" width="8" height="2" fill="currentColor"/>
              <path d="M9 4l5 4-5 4V4z" fill="currentColor"/>
              <rect x="1" y="1" width="7" height="2" fill="currentColor" opacity="0.5"/>
              <rect x="1" y="13" width="7" height="2" fill="currentColor" opacity="0.5"/>
              <rect x="1" y="1" width="2" height="14" fill="currentColor" opacity="0.5"/>
            </svg>
            Disconnetti
          </button>
        </div>
      </div>
    </>
  )
}
