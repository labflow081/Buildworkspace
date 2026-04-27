import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPInput } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  initialName: string
  onSave: (name: string) => Promise<void>
}

export const RenameFolderDialog = ({ open, onClose, initialName, onSave }: Props) => {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) { setName(initialName); setError('') }
  }, [open, initialName])

  const handleOk = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Il nome non può essere vuoto.'); return }
    if (trimmed.length > 60) { setError('Massimo 60 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onSave(trimmed)
      playSound('open')
      onClose()
    } catch {
      setError('Errore nel salvataggio.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <XPDialog
      title="📁 Rinomina cartella"
      open={open}
      onClose={onClose}
      onOk={handleOk}
      okDisabled={loading || !name.trim()}
    >
      <XPInput
        label="Nome:"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleOk()}
        maxLength={60}
        autoFocus
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{name.length}/60</div>
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
