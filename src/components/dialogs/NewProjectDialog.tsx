import { useState } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPInput } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export const NewProjectDialog = ({ open, onClose, onCreate }: Props) => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOk = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Il nome del progetto è obbligatorio.'); return }
    if (trimmed.length > 40) { setError('Massimo 40 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onCreate(trimmed)
      playSound('open')
      setName('')
      onClose()
    } catch {
      setError('Errore nella creazione del progetto.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setError('')
    onClose()
  }

  return (
    <XPDialog
      title="Nuovo progetto"
      open={open}
      onClose={handleClose}
      onOk={handleOk}
      okDisabled={loading}
    >
      <XPInput
        label="Nome del progetto:"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={40}
        autoFocus
        placeholder="es. App Mobile Q1"
        onKeyDown={e => { if (e.key === 'Enter') handleOk() }}
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{name.length}/40</div>
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
