import { useState, useEffect } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useProfiles } from '@/hooks/useProfiles'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { NewTaskDialog } from '@/components/dialogs/NewTaskDialog'
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog'
import { CommentsDialog } from '@/components/dialogs/CommentsDialog'
import { XpSelect } from '@/components/xp/XpSelect'
import { useLongPress } from '@/hooks/useLongPress'
import { logActivity } from '@/lib/logActivity'
import { TAGS, PRIORITIES } from '@/constants/taxonomy'
import { Task } from '@/types'
import { playSound } from '@/lib/sounds'

// ── Badge helpers ─────────────────────────────────────────────

const PriorityBadge = ({ value }: { value: string }) => {
  const p = PRIORITIES.find(p => p.value === value)
  if (!p) return null
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: 'Tahoma' }}>
      ● {p.label}
    </span>
  )
}

const TagBadge = ({ value }: { value: string }) => {
  const t = TAGS.find(t => t.value === value)
  if (!t) return null
  return (
    <span style={{
      background: '#316AC5', color: 'white',
      fontFamily: 'Tahoma', fontSize: 10, fontWeight: 700,
      padding: '1px 6px', borderRadius: 2,
    }}>
      {t.label}
    </span>
  )
}

// ── TaskRow ───────────────────────────────────────────────────

interface Props {
  projectId: string
  projectName?: string
}

const TaskRow = ({
  task,
  assigneeName,
  commentCount,
  onToggle,
  onDelete,
  onEdit,
  onComment,
  highlighted,
}: {
  task: Task
  assigneeName: string
  commentCount: number
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onComment: (task: Task) => void
  highlighted: boolean
}) => {
  const [animating, setAnimating] = useState(false)
  const [showHighlight, setShowHighlight] = useState(highlighted)
  const longPress = useLongPress(() => onEdit(task))

  useEffect(() => {
    if (highlighted) {
      setShowHighlight(true)
      const t = setTimeout(() => setShowHighlight(false), 1500)
      return () => clearTimeout(t)
    }
  }, [highlighted])

  const handleToggle = () => {
    setAnimating(true)
    setTimeout(() => {
      onToggle(task.id, !task.done)
      setAnimating(false)
      playSound('navigate')
    }, 150)
  }

  const handleDelete = () => {
    if (window.confirm('Eliminare questa task?')) {
      onDelete(task.id)
      playSound('navigate')
    }
  }

  return (
    <div
      className="flex items-start gap-2 px-3"
      style={{
        borderBottom: '1px solid #d0cdc5',
        opacity: animating ? 0.5 : 1,
        transition: 'opacity 0.15s, background 0.6s ease',
        minHeight: 44,
        background: showHighlight
          ? 'rgba(255, 215, 0, 0.35)'
          : task.done ? 'rgba(0,0,0,0.02)' : 'transparent',
        paddingTop: 6, paddingBottom: 6,
      }}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={handleToggle}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2A5BA5', flexShrink: 0 }}
      />

      <div
        className="flex-1 min-w-0"
        {...longPress}
        style={{ cursor: 'default', userSelect: 'none' }}
      >
        <p style={{
          fontSize: 12, color: task.done ? '#999' : '#1A1828',
          textDecoration: task.done ? 'line-through' : 'none',
          wordBreak: 'break-word', margin: 0,
        }}>
          {task.text}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {assigneeName && <span style={{ fontSize: 10, color: '#666' }}>👤 {assigneeName}</span>}
          {task.due_date && (
            <span style={{ fontSize: 10, color: '#666' }}>
              📅 {new Date(task.due_date).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>
        {(task.priority || task.tag) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {task.priority && <PriorityBadge value={task.priority} />}
            {task.tag && <TagBadge value={task.tag} />}
          </div>
        )}
      </div>

      <button
        onClick={() => onComment(task)}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        title="Commenti"
        style={{
          height: 22, minWidth: 22, padding: '0 4px', borderRadius: 3,
          border: '1px solid #ccc',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
          fontSize: 10, fontFamily: 'Tahoma',
          color: commentCount > 0 ? '#2A5BA5' : '#999',
          fontWeight: commentCount > 0 ? 600 : 400,
          flexShrink: 0, marginTop: 1,
        }}
        onMouseOver={e => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#2A5BA5'
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#ccc'
        }}
      >
        💬{commentCount > 0 ? ` ${commentCount}` : ''}
      </button>

      <button
        onClick={handleDelete}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        title="Elimina task"
        style={{
          width: 22, height: 22, borderRadius: 3,
          border: '1px solid #ccc',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
          color: '#999', fontSize: 11, fontWeight: 700,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 1,
        }}
        onMouseOver={e => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #E84444 0%, #B81818 100%)'
          ;(e.currentTarget as HTMLElement).style.color = 'white'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#900'
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)'
          ;(e.currentTarget as HTMLElement).style.color = '#999'
          ;(e.currentTarget as HTMLElement).style.borderColor = '#ccc'
        }}
      >
        ✕
      </button>
    </div>
  )
}

// ── TasksPage ─────────────────────────────────────────────────

export const TasksPage = ({ projectId, projectName }: Props) => {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleDone, deleteTask, updateTask } = useTasks(projectId)
  const { profiles } = useProfiles()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [commentingTask, setCommentingTask] = useState<Task | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  // Filtri
  const [filterTag, setFilterTag] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const [highlightId] = useState<string | null>(() => {
    const id = sessionStorage.getItem('promotedTaskId')
    if (id) sessionStorage.removeItem('promotedTaskId')
    return id
  })

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('comments')
      .select('target_id')
      .eq('project_id', projectId)
      .eq('target_type', 'task')
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        data?.forEach(r => { counts[r.target_id] = (counts[r.target_id] ?? 0) + 1 })
        setCommentCounts(counts)
      })
  }, [projectId])

  const getName = (id: string | null) => {
    if (!id) return ''
    const p = profiles.find(p => p.id === id)
    return p?.display_name ?? id.slice(0, 8)
  }

  const handleCreate = async (data: {
    text: string
    assignee: string | null
    due_date: string | null
    tag: string | null
    priority: string | null
  }) => {
    if (!user) return
    const task = await createTask({ ...data, created_by: user.id })
    logActivity({
      userId: user.id,
      action_type: 'created_task',
      target_type: 'task',
      target_id: task.id,
      project_id: projectId,
      metadata: {
        project_name: projectName ?? '',
        ...(data.tag ? { tag: data.tag } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
      },
    })
  }

  const handleToggle = async (taskId: string, done: boolean) => {
    await toggleDone(taskId, done)
    if (done && user) {
      logActivity({
        userId: user.id,
        action_type: 'completed_task',
        target_type: 'task',
        target_id: taskId,
        project_id: projectId,
      })
    }
  }

  const handleSaveEdit = async (data: {
    text: string
    assignee: string | null
    due_date: string | null
    tag: string | null
    priority: string | null
  }) => {
    if (!editingTask || !user) return
    const prevAssignee = editingTask.assignee
    await updateTask(editingTask.id, data)
    if (data.assignee && data.assignee !== prevAssignee) {
      logActivity({
        userId: user.id,
        action_type: 'assigned_task',
        target_type: 'task',
        target_id: editingTask.id,
        project_id: projectId,
        metadata: {
          project_name: projectName ?? '',
          ...(data.tag ? { tag: data.tag } : {}),
          ...(data.priority ? { priority: data.priority } : {}),
        },
      })
    }
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 12, color: '#666' }}>Caricamento task...</div>
  }

  const filteredTasks = tasks.filter(t => {
    if (filterTag && t.tag !== filterTag) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const todo = filteredTasks.filter(t => !t.done)
  const done = filteredTasks.filter(t => t.done)
  const filtersActive = !!(filterTag || filterPriority)

  const SectionHeader = ({ label }: { label: string }) => (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#666',
      padding: '6px 12px 2px', textTransform: 'uppercase',
      borderBottom: '1px solid #ccc', background: '#EAE7D8',
    }}>
      {label}
    </div>
  )

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar filtri */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderBottom: '1px solid #ACA899',
        background: '#ECE9D8',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <label style={{ fontSize: 11, color: '#1A1828', whiteSpace: 'nowrap' }}>Tag:</label>
        <div style={{ minWidth: 100, flex: '1 1 100px' }}>
          <XpSelect
            options={TAGS}
            emptyLabel="Tutti"
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
          />
        </div>
        <label style={{ fontSize: 11, color: '#1A1828', whiteSpace: 'nowrap' }}>Priorità:</label>
        <div style={{ minWidth: 90, flex: '1 1 90px' }}>
          <XpSelect
            options={PRIORITIES}
            emptyLabel="Tutte"
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          />
        </div>
        {filtersActive && (
          <button
            className="xp-button"
            onClick={() => { setFilterTag(''); setFilterPriority('') }}
            style={{ whiteSpace: 'nowrap', padding: '3px 10px', minHeight: 24, minWidth: 0 }}
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 64 }}>
        {todo.length > 0 && (
          <div>
            <SectionHeader label={`Da fare (${todo.length})`} />
            {todo.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                assigneeName={getName(t.assignee)}
                commentCount={commentCounts[t.id] ?? 0}
                onToggle={handleToggle}
                onDelete={deleteTask}
                onEdit={setEditingTask}
                onComment={setCommentingTask}
                highlighted={highlightId === t.id}
              />
            ))}
          </div>
        )}
        {done.length > 0 && (
          <div>
            <SectionHeader label={`Fatte (${done.length})`} />
            {done.map(t => (
              <TaskRow
                key={t.id}
                task={t}
                assigneeName={getName(t.assignee)}
                commentCount={commentCounts[t.id] ?? 0}
                onToggle={handleToggle}
                onDelete={deleteTask}
                onEdit={setEditingTask}
                onComment={setCommentingTask}
                highlighted={highlightId === t.id}
              />
            ))}
          </div>
        )}
        {tasks.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
            Nessuna task. Aggiungine una!
          </div>
        )}
        {tasks.length > 0 && filteredTasks.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
            Nessuna task corrisponde ai filtri.
          </div>
        )}
      </div>

      <button
        onClick={() => setDialogOpen(true)}
        style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(180deg, #2A5BA5 0%, #1E4380 100%)',
          border: '2px solid #1E4380', color: 'white', fontSize: 24,
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Nuova task"
      >
        +
      </button>

      <NewTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        profiles={profiles}
        onCreate={handleCreate}
      />

      <EditTaskDialog
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        task={editingTask}
        profiles={profiles}
        onSave={handleSaveEdit}
      />

      <CommentsDialog
        open={commentingTask !== null}
        onClose={(finalCount) => {
          if (commentingTask) {
            setCommentCounts(prev => ({ ...prev, [commentingTask.id]: finalCount }))
          }
          setCommentingTask(null)
        }}
        targetType="task"
        targetId={commentingTask?.id ?? ''}
        targetText={commentingTask?.text ?? ''}
        projectId={projectId}
        projectName={projectName}
        currentUserId={user?.id ?? null}
        profiles={profiles}
      />
    </div>
  )
}
