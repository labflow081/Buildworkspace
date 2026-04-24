import { useEffect, useState } from 'react'

export const BootScreen = () => {
  const [barPos, setBarPos] = useState(0)

  // Animazione barra di caricamento XP (3 segmenti scorrevoli)
  useEffect(() => {
    const interval = setInterval(() => {
      setBarPos(prev => (prev + 1) % 5)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const segments = [0, 1, 2]

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
      style={{ background: '#000' }}
    >
      {/* Logo */}
      <img
        src="/logo.png"
        alt="BuildWorkSpace"
        style={{ width: 240, marginBottom: 48 }}
        onError={e => {
          // Fallback testuale se logo non trovato
          const t = e.currentTarget.parentElement!
          e.currentTarget.style.display = 'none'
          const div = document.createElement('div')
          div.textContent = 'BuildWorkSpace'
          div.style.cssText = 'color:#4A90D9;font-size:24px;font-weight:bold;font-family:Tahoma,sans-serif;margin-bottom:48px'
          t.insertBefore(div, t.firstChild)
        }}
      />

      {/* Barra di caricamento XP */}
      <div style={{
        width: 200,
        height: 14,
        border: '1px solid #444',
        borderRadius: 3,
        background: '#111',
        overflow: 'hidden',
        display: 'flex',
        gap: 2,
        padding: 2,
      }}>
        {segments.map(i => {
          const visible = ((barPos + i) % 5) < 3
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: '100%',
                borderRadius: 2,
                background: visible
                  ? 'linear-gradient(180deg, #6BB6E8 0%, #2A5BA5 100%)'
                  : 'transparent',
                transition: 'background 0.1s',
              }}
            />
          )
        })}
      </div>

      <p style={{
        color: '#555',
        marginTop: 16,
        fontSize: 10,
        fontFamily: 'Tahoma, Geneva, sans-serif',
      }}>
        Buildspace081 © 2026
      </p>
    </div>
  )
}
