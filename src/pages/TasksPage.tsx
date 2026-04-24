import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useProfiles } from '@/hooks/useProfiles'
import { useAuth } from '@/contexts/AuthContext'
import { NewTaskDialog } from '@/components/dialogs/NewTaskDialog'
import { Task } from '@/types'
import { playSound } from '@/lib/sounds'

interface Props {
  projectId: string
}

const TaskRow = ({
  task,
  assigneeName,
  onToggle,
}: {
  task: Task
  assigneeName: string
  onToggle: (id: string, done: boolean) => void
}) => {
  const [animating, setAnimating] = useState(false)

  const handleToggle = () => {
    setAnimating(true)
    setTimeout(() => {
      onToggle(task.id, !task.done)
      setAnimating(false)
      playSound('navigate')
    }, 150)
  }

  return (
    <div
      className="flex items-start gap-3 py-2 px-3"
      style={{
        borderBottom: '1px solid #d0cdc5',
        opacity: animating ? 0.5 : 1,
        transition: 'opacity 0.15s',
        minHeight: 44,
        background: task.done ? 'rgba(0,0,0,0.02)' : 'transparent',
      }}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={handleToggle}
        style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2A5BA5', flexShrink: 0 }}
      />
      <div className="flex-1 min-w-0">
        <p style={{
          fontSize: 12,
          color: task.done ? '#999' : '#1A1828',
          textDecoration: task.done ? 'line-through' : 'none',
          wordBreak: 'break-word',
          margin: 0,
        }}>
          {task.text}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {assigneeName && (
            <span style={{ fontSize: 10, color: '#666' }}>👤 {assigneeName}</span>
          )}
          {task.due_date && (
            <span style={{ fontSize: 10, color: '#666' }}>
              📅 {new Date(task.due_date).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export const TasksPage = ({ projectId }: Props) => {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleDone } = useTasks(projectId)
  const { profiles } = useProfiles()
  const [dialogOpen, setDialogOpen] = useState(false)

  const todo = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  const getName = (id: string | null) => {
    if (!id) return ''
    const p = profiles.find(p => p.id === id)
    return p?.display_name ?? id.slice(0, 8)
  }

  const handleCreate = async (data: { text: string; assignee: string | null; due_date: string | null }) => {
    if (!user) return
    await createTask({ ...data, created_by: user.id })
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 12, color: '#666' }}>Caricamento task...</div>
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 64 }}>
        {/* Da fare */}
        {todo.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#666',
              padding: '6px 12px 2px',
              textTransform: 'uppercase',
              borderBottom: '1px solid #ccc',
              background: '#EAE7D8',
            }}>
              Da fare ({todo.length})
            </div>
            {todo.map(t => (
              <TaskRow key={t.id} task={t} assigneeName={getName(t.assignee)} onToggle={toggleDone} />
            ))}
          </div>
        )}

        {/* Fatte */}
        {done.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#999',
              padding: '6px 12px 2px',
              textTransform: 'uppercase',
              borderBottom: '1px solid #ccc',
              background: '#EAE7D8',
            }}>
              Fatte ({done.length})
            </div>
            {done.map(t => (
              <TaskRow key={t.id} task={t} assigneeName={getName(t.assignee)} onToggle={toggleDone} />
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
            Nessuna task. Aggiungine una!
          </div>
        )}
      </div>

      {/* FAB + */}
      <button
        onClick={() => setDialogOpen(true)}
        style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #2A5BA5 0%, #1E4380 100%)',
          border: '2px solid #1E4380',
          color: 'white',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
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
    </div>
  )
}
