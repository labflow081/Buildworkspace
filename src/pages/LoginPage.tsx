import { useState, FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { XPButton } from '@/components/xp/XPButton'
import { XPInput } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

type Tab = 'login' | 'signup'

export const LoginPage = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/desktop" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        playSound('open')
        navigate('/desktop', { replace: true })
      } else {
        if (!displayName.trim()) throw new Error('Inserisci il tuo nome utente.')
        if (password.length < 6) throw new Error('La password deve avere almeno 6 caratteri.')
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() } }
        })
        if (error) throw error
        playSound('open')
        navigate('/desktop', { replace: true })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(msg)
      playSound('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #4A90D9 0%, #6BB6E8 40%, #8FCBF0 55%, #A8D88B 60%, #6FAB47 80%, #4A8B2C 100%)',
      }}
    >
      {/* Finestra login XP */}
      <div className="xp-window w-full mx-4" style={{ maxWidth: 320, borderRadius: '8px 8px 4px 4px' }}>
        {/* Title bar */}
        <div className="xp-titlebar" style={{ borderRadius: '6px 6px 0 0' }}>
          <img src="/logo.png" alt="" style={{ width: 16, height: 16, marginRight: 6, imageRendering: 'pixelated' }}
            onError={e => { e.currentTarget.style.display = 'none' }} />
          <span className="xp-titlebar-title">Accesso — BuildWorkSpace</span>
          <div style={{ width: 21, height: 21 }} /> {/* placeholder allineamento */}
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '1px solid #ccc', background: '#ECE9D8' }}>
          {(['login', 'signup'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 11,
                fontFamily: 'Tahoma, sans-serif',
                background: tab === t ? '#ECE9D8' : '#D4D0C8',
                border: 'none',
                borderBottom: tab === t ? '2px solid #ECE9D8' : '2px solid #aaa',
                cursor: 'pointer',
                color: '#1A1828',
                fontWeight: tab === t ? 600 : 400,
              }}
            >
              {t === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4" style={{ background: '#ECE9D8' }}>
          {tab === 'signup' && (
            <XPInput
              label="Nome utente:"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Come ti chiami?"
              autoFocus={tab === 'signup'}
              maxLength={32}
            />
          )}
          <XPInput
            label="E-mail:"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nome@esempio.com"
            autoFocus={tab === 'login'}
            autoComplete="email"
          />
          <XPInput
            label="Password:"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••"
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
          />

          {error && (
            <div style={{
              fontSize: 11, color: '#CC0000',
              border: '1px solid #CC0000', padding: '4px 8px',
              background: '#FFF0F0', borderRadius: 2,
            }}>
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <XPButton type="submit" variant="primary" disabled={submitting}>
              {submitting ? '...' : 'OK'}
            </XPButton>
          </div>
        </form>
      </div>
    </div>
  )
}
