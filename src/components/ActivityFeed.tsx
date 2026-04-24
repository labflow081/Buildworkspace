import { useNavigate } from 'react-router-dom'
import { useActivities } from '@/hooks/useActivities'
import { useProfiles } from '@/hooks/useProfiles'
import { Activity } from '@/types'

const relativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'ora'
  if (mins < 60) return `${mins}m fa`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ieri'
  return `${days}g fa`
}

const activityText = (a: Activity): string => {
  const m = a.metadata as Record<string, string>
  switch (a.action_type) {
    case 'created_idea':       return "ha aggiunto un'idea"
    case 'created_task':       return 'ha aggiunto una task'
    case 'completed_task':     return 'ha completato una task'
    case 'promoted_idea_to_task': return "ha trasformato un'idea in task"
    case 'created_project':
      return m.project_name ? `ha creato "${m.project_name}"` : 'ha creato un progetto'
    case 'renamed_project':
      return m.old_name && m.new_name
        ? `ha rinominato "${m.old_name}" in "${m.new_name}"`
        : 'ha rinominato un progetto'
    default: return 'ha fatto un aggiornamento'
  }
}

interface Props {
  onMinimize: () => void
  onClose: () => void
}

export const ActivityFeed = ({ onMinimize, onClose }: Props) => {
  const navigate = useNavigate()
  const { activities, loading } = useActivities()
  const { profiles } = useProfiles()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 64,
        right: 12,
        width: 'min(320px, calc(100vw - 24px))',
        zIndex: 40,
        borderRadius: '8px 8px 4px 4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        border: '2px solid #7B9DD2',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div className="xp-titlebar" style={{ borderRadius: '6px 6px 0 0' }}>
        <div className="w-4 h-4 flex-shrink-0">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <rect x="2" y="3" width="12" height="10" rx="1" fill="#4A90D9" stroke="#2A5BA5" strokeWidth="0.5"/>
            <line x1="5" y1="7" x2="11" y2="7" stroke="white" strokeWidth="1"/>
            <line x1="5" y1="9.5" x2="11" y2="9.5" stroke="white" strokeWidth="1"/>
          </svg>
        </div>
        <span className="xp-titlebar-title">Attività recenti</span>
        <div className="flex gap-[2px] flex-shrink-0">
          <button className="xp-window-btn xp-window-btn-min" onClick={onMinimize} aria-label="Minimizza">_</button>
          <button className="xp-window-btn xp-window-btn-close" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>
      </div>

      {/* Feed */}
      <div style={{ maxHeight: 280, overflowY: 'auto', background: '#ECE9D8' }}>
        {loading && (
          <div style={{ padding: '12px 10px', fontSize: 11, color: '#666', fontFamily: 'Tahoma' }}>
            Caricamento...
          </div>
        )}
        {!loading && activities.length === 0 && (
          <div style={{ padding: '12px 10px', fontSize: 11, color: '#999', fontFamily: 'Tahoma' }}>
            Nessuna attività ancora.
          </div>
        )}
        {activities.map((a, i) => {
          const profile = profiles.find(p => p.id === a.user_id)
          const name = profile?.display_name ?? a.user_id.slice(0, 8)
          const color = profile?.avatar_color ?? '#4A90D9'
          const initial = (profile?.display_name ?? 'U')[0].toUpperCase()
          const text = activityText(a)
          const time = relativeTime(a.created_at)

          return (
            <div
              key={a.id}
              onClick={() => a.project_id && navigate(`/project/${a.project_id}`)}
              style={{
                padding: '7px 10px',
                borderBottom: i < activities.length - 1 ? '1px solid #D4D0C8' : 'none',
                cursor: a.project_id ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                animation: 'fadeIn 0.3s ease',
                background: 'transparent',
              }}
              onMouseOver={e => {
                if (a.project_id)
                  (e.currentTarget as HTMLElement).style.background = '#DDE8F5'
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: color, color: 'white',
                fontSize: 9, fontWeight: 700, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 1,
              }}>
                {initial}
              </div>
              {/* Testo */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828', lineHeight: 1.4 }}>
                  <strong>{name}</strong> {text}
                </span>
                <span style={{ fontSize: 10, color: '#999', marginLeft: 4 }}>· {time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
