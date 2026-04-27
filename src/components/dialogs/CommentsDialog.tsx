import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/logActivity'
import { Profile } from '@/types'

interface CommentRow {
  id: string
  target_type: 'task' | 'idea'
  target_id: string
  project_id: string
  text: string
  created_by: string
  created_at: string
  display_name: string | null
  avatar_color: string | null
}

type RawComment = Omit<CommentRow, 'display_name' | 'avatar_color'>

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

interface Props {
  open: boolean
  onClose: (finalCount: number) => void
  targetType: 'idea' | 'task'
  targetId: string
  targetText: string
  projectId: string
  projectName?: string
  currentUserId: string | null
  profiles: Profile[]
}

export const CommentsDialog = ({
  open, onClose, targetType, targetId, targetText,
  projectId, projectName, currentUserId, profiles,
}: Props) => {
  const [comments, setComments] = useState<CommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  // Always-current profiles ref to avoid stale closures in async callbacks
  const profilesRef = useRef(profiles)
  profilesRef.current = profiles

  const enrich = (c: RawComment): CommentRow => {
    const p = profilesRef.current.find(x => x.id === c.created_by)
    return { ...c, display_name: p?.display_name ?? null, avatar_color: p?.avatar_color ?? null }
  }

  // Fetch + subscribe on open
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setText('')
    prevCountRef.current = 0

    supabase
      .from('comments')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setComments((data ?? []).map(enrich))
        setLoading(false)
      })

    const channel = supabase
      .channel(`comments:${targetType}:${targetId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `target_id=eq.${targetId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          const raw = payload.new as RawComment
          setComments(prev => {
            if (prev.find(c => c.id === raw.id)) return prev
            return [...prev, enrich(raw)]
          })
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as { id: string }
          setComments(prev => prev.filter(c => c.id !== old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [open, targetId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when new comments arrive
  useEffect(() => {
    if (comments.length > prevCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
    prevCountRef.current = comments.length
  }, [comments.length])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const truncated = targetText.length > 30 ? targetText.slice(0, 30) + '…' : targetText
  const title = `💬 Commenti — ${truncated}`

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !currentUserId || sending) return
    setSending(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          target_type: targetType,
          target_id: targetId,
          project_id: projectId,
          text: trimmed,
          created_by: currentUserId,
        })
        .select()
        .single()
      if (error) throw error
      // Optimistic (realtime deduplicates)
      setComments(prev => {
        if (prev.find(c => c.id === data.id)) return prev
        return [...prev, enrich(data as RawComment)]
      })
      setText('')
      logActivity({
        userId: currentUserId,
        action_type: 'commented',
        target_type: targetType,
        target_id: targetId,
        project_id: projectId,
        metadata: { project_name: projectName ?? '', preview: trimmed.slice(0, 50) },
      })
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    await supabase.from('comments').delete().eq('id', commentId)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const close = () => onClose(comments.length)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      <div
        className="xp-window w-full animate-xp-open"
        style={{
          maxWidth: 480,
          height: '80vh',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '8px 8px 4px 4px',
        }}
      >
        {/* Title bar */}
        <div className="xp-titlebar" style={{ borderRadius: '6px 6px 0 0', flexShrink: 0 }}>
          <div className="w-4 h-4 flex-shrink-0">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <rect x="2" y="3" width="12" height="10" rx="1" fill="#4A90D9" stroke="#2A5BA5" strokeWidth="0.5"/>
              <line x1="5" y1="7" x2="11" y2="7" stroke="white" strokeWidth="1"/>
              <line x1="5" y1="9.5" x2="9" y2="9.5" stroke="white" strokeWidth="1"/>
            </svg>
          </div>
          <span
            className="xp-titlebar-title"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {title}
          </span>
          <button className="xp-window-btn xp-window-btn-close" onClick={close} aria-label="Chiudi">✕</button>
        </div>

        {/* Comments list */}
        <div
          ref={listRef}
          style={{ flex: 1, overflowY: 'auto', background: '#ECE9D8', padding: '8px 10px' }}
        >
          {loading && (
            <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 11, fontFamily: 'Tahoma', color: '#666' }}>
              Caricamento...
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 11, fontFamily: 'Tahoma', color: '#999' }}>
              Nessun commento ancora. Scrivi il primo! 👇
            </div>
          )}
          {comments.map(c => {
            const initial = (c.display_name ?? 'U')[0].toUpperCase()
            const color = c.avatar_color ?? '#4A90D9'
            const isOwn = c.created_by === currentUserId
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  marginBottom: 10, animation: 'fadeIn 0.2s ease',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: color, color: 'white',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {initial}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontFamily: 'Tahoma', fontWeight: 600, color: '#1A1828' }}>
                      {c.display_name ?? c.created_by.slice(0, 8)}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'Tahoma', color: '#999' }}>
                      · {relativeTime(c.created_at)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828',
                    margin: '3px 0 0', lineHeight: 1.5, wordBreak: 'break-word',
                    background: 'white', border: '1px solid #D4D0C8',
                    borderRadius: 3, padding: '4px 7px',
                  }}>
                    {c.text}
                  </p>
                </div>

                {/* Delete (own only) */}
                {isOwn && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    title="Elimina commento"
                    style={{
                      width: 18, height: 18, borderRadius: 2,
                      border: '1px solid #ccc',
                      background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
                      color: '#bbb', fontSize: 9, fontWeight: 700,
                      cursor: 'pointer', flexShrink: 0, marginTop: 3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseOver={e => {
                      (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #E84444 0%, #B81818 100%)'
                      ;(e.currentTarget as HTMLElement).style.color = 'white'
                      ;(e.currentTarget as HTMLElement).style.borderColor = '#900'
                    }}
                    onMouseOut={e => {
                      (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)'
                      ;(e.currentTarget as HTMLElement).style.color = '#bbb'
                      ;(e.currentTarget as HTMLElement).style.borderColor = '#ccc'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Input area */}
        <div style={{
          borderTop: '1px solid #ACA899',
          background: '#ECE9D8',
          padding: '8px 10px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={500}
                rows={2}
                placeholder="Scrivi un commento… (Ctrl+Enter per inviare)"
                style={{
                  width: '100%', resize: 'none',
                  border: '1px solid #7F9DB9',
                  background: 'white', borderRadius: 2,
                  padding: '4px 6px',
                  fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: 10, color: '#999', textAlign: 'right', fontFamily: 'Tahoma' }}>
                {text.length}/500
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              style={{
                padding: '5px 12px', minHeight: 32, marginBottom: 16,
                background: 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)',
                border: '2px solid #2A5BA5', borderRadius: 3,
                fontSize: 11, fontFamily: 'Tahoma', fontWeight: 600,
                color: '#1A1828',
                cursor: sending || !text.trim() ? 'default' : 'pointer',
                opacity: sending || !text.trim() ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              Invia
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
