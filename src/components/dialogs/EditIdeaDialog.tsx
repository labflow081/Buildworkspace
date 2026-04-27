import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPTextarea } from '@/components/xp/XPInput'
import { XpSelect } from '@/components/xp/XpSelect'
import { TAGS, PRIORITIES } from '@/constants/taxonomy'
import { Idea, IdeaFolder } from '@/types'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  idea: Idea | null
  folders: IdeaFolder[]
  onSave: (data: {
    text: string
    tag: string | null
    priority: string | null
    folder_id: string | null
  }) => Promise<void>
}

const fieldRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}

const labelStyle: React.CSSProperties = {
  width: 70,
  minWidth: 70,
  fontSize: 11,
  color: '#1A1828',
  flexShrink: 0,
}

export const EditIdeaDialog = ({ open, onClose, idea, folders, onSave }: Props) => {
  const [text, setText] = useState('')
  const [tag, setTag] = useState('')
  const [priority, setPriority] = useState('')
  const [folderId, setFolderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && idea) {
      setText(idea.text)
      setTag(idea.tag ?? '')
      setPriority(idea.priority ?? '')
      setFolderId(idea.folder_id ?? '')
      setError('')
    }
  }, [open, idea])

  const handleOk = async () => {
    const trimmed = text.trim()
    if (!trimmed) { setError("L'idea non può essere vuota."); return }
    if (trimmed.length > 1000) { setError('Massimo 1000 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onSave({
        text: trimmed,
        tag: tag || null,
        priority: priority || null,
        folder_id: folderId || null,
      })
      playSound('open')
      onClose()
    } catch {
      setError('Errore nel salvataggio.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const folderOptions = folders.map(f => ({ value: f.id, label: f.name }))

  return (
    <XPDialog
      title="Modifica idea"
      open={open}
      onClose={onClose}
      onOk={handleOk}
      okDisabled={loading}
    >
      <XPTextarea
        label="Testo:"
        value={text}
        onChange={e => setText(e.target.value)}
        maxLength={1000}
        rows={5}
        autoFocus
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{text.length}/1000</div>

      <div style={fieldRow}>
        <label style={labelStyle}>Tag:</label>
        <div style={{ flex: 1 }}>
          <XpSelect
            options={TAGS}
            emptyLabel="— nessun tag —"
            value={tag}
            onChange={e => setTag(e.target.value)}
          />
        </div>
      </div>

      <div style={fieldRow}>
        <label style={labelStyle}>Priorità:</label>
        <div style={{ flex: 1 }}>
          <XpSelect
            options={PRIORITIES}
            emptyLabel="— nessuna priorità —"
            value={priority}
            onChange={e => setPriority(e.target.value)}
          />
        </div>
      </div>

      {folders.length > 0 && (
        <div style={fieldRow}>
          <label style={labelStyle}>Cartella:</label>
          <div style={{ flex: 1 }}>
            <XpSelect
              options={folderOptions}
              emptyLabel="— nessuna —"
              value={folderId}
              onChange={e => setFolderId(e.target.value)}
            />
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
