import { useState } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useProfiles } from '@/hooks/useProfiles'
import { useAuth } from '@/contexts/AuthContext'
import { NewTaskDialog } from '@/components/dialogs/NewTaskDialog'
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog'
import { useLongPress } from '@/hooks/useLongPress'
import { Task } from '@/types'
import { playSound } from '@/lib/sounds'

interface Props {
  projectId: string
}

const TaskRow = ({
  task,
  assigneeName,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task
  assigneeName: string
  onToggle: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}) => {
  const [animating, setAnimating] = useState(false)
  const longPress = useLongPress(() => onEdit(task))

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
        transition: 'opacity 0.15s',
        minHeight: 44,
        background: task.done ? 'rgba(0,0,0,0.02)' : 'transparent',
        paddingTop: 6, paddingBottom: 6,
      }}
    >
      {/* Checkbox — stopPropagation per non triggerare il long-press */}
      <input
        type="checkbox"
        checked={task.done}
        onChange={handleToggle}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{ width: 16, height: 16, marginTop: 2, cursor: 'pointer', accentColor: '#2A5BA5', flexShrink: 0 }}
      />

      {/* Area long-pressabile (testo + metadati) */}
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
      </div>

      {/* Tasto elimina — stopPropagation per non triggerare il long-press */}
      <button
        onClick={handleDelete}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        title="Elimina task"
        style={{
          width: 22, height: 22,
          borderRadius: 3,
          border: '1px solid #ccc',
          background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
          color: '#999',
          fontSize: 11, fontWeight: 700,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
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

export const TasksPage = ({ projectId }: Props) => {
  const { user } = useAuth()
  const { tasks, loading, createTask, toggleDone, deleteTask, updateTask } = useTasks(projectId)
  const { profiles } = useProfiles()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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

  const handleSaveEdit = async (data: { text: string; assignee: string | null; due_date: string | null }) => {
    if (!editingTask) return
    await updateTask(editingTask.id, data)
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 12, color: '#666' }}>Caricamento task...</div>
  }

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
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 64 }}>
        {todo.length > 0 && (
          <div>
            <SectionHeader label={`Da fare (${todo.length})`} />
            {todo.map(t => (
              <TaskRow key={t.id} task={t} assigneeName={getName(t.assignee)} onToggle={toggleDone} onDelete={deleteTask} onEdit={setEditingTask} />
            ))}
          </div>
        )}
        {done.length > 0 && (
          <div>
            <SectionHeader label={`Fatte (${done.length})`} />
            {done.map(t => (
              <TaskRow key={t.id} task={t} assigneeName={getName(t.assignee)} onToggle={toggleDone} onDelete={deleteTask} onEdit={setEditingTask} />
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
    </div>
  )
}
