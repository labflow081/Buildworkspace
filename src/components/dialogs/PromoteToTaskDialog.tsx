import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea, XPInput } from '@/components/xp/XPInput'
import { XPCheckbox } from '@/components/xp/XPCheckbox'
import { Profile, Idea } from '@/types'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/logActivity'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  idea: Idea | null
  profiles: Profile[]
  currentUserId: string | null
  projectName?: string
  onDeleteIdea: (id: string) => Promise<void>
  onSuccess: () => void
}

export const PromoteToTaskDialog = ({
  open, onClose, idea, profiles, currentUserId, projectName, onDeleteIdea, onSuccess,
}: Props) => {
  const [text, setText] = useState('')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [deleteOriginal, setDeleteOriginal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && idea) {
      setText(idea.text)
      setAssignee(currentUserId ?? '')
      setDueDate('')
      setDeleteOriginal(false)
      setError('')
    }
  }, [open, idea, currentUserId])

  const handleCreate = async () => {
    if (!idea || !currentUserId) return
    const trimmed = text.trim()
    if (!trimmed) { setError('Descrivi la task.'); return }
    if (trimmed.length > 500) { setError('Massimo 500 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      const { data: newTask, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          project_id: idea.project_id,
          text: trimmed,
          assignee: assignee || null,
          due_date: dueDate || null,
          done: false,
          created_by: currentUserId,
        })
        .select()
        .single()
      if (taskErr) throw taskErr

      if (deleteOriginal) await onDeleteIdea(idea.id)

      await logActivity({
        userId: currentUserId,
        action_type: 'promoted_idea_to_task',
        target_type: 'task',
        target_id: newTask.id,
        project_id: idea.project_id,
        metadata: { original_idea_text: idea.text, new_task_text: trimmed, project_name: projectName ?? '' },
      })

      sessionStorage.setItem('promotedTaskId', newTask.id)
      playSound('open')
      onSuccess()
      onClose()
    } catch {
      setError('Errore nella creazione della task.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <XPDialog
      title="Trasforma in task"
      open={open}
      onClose={onClose}
      onOk={handleCreate}
      okLabel="Crea task"
      okDisabled={loading}
    >
      <XPTextarea
        label="Testo task:"
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={500}
        rows={4}
        autoFocus
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{text.length}/500</div>

      <div className="flex flex-col gap-1">
        <label style={{ fontSize: 11, color: '#1A1828' }}>Assegna a:</label>
        <select
          className="xp-input w-full"
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
        >
          <option value="">(nessuno)</option>
          {profiles.map(p => (
            <option key={p.id} value={p.id}>{p.display_name ?? p.id.slice(0, 8)}</option>
          ))}
        </select>
      </div>

      <XPInput
        label="Scadenza (opzionale):"
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />

      <XPCheckbox
        checked={deleteOriginal}
        onChange={e => setDeleteOriginal(e.target.checked)}
        label="Elimina l'idea originale dopo la creazione"
      />

      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
