import { useState } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPInput } from '@/components/xp/XPInput'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}

export const NewFolderDialog = ({ open, onClose, onCreate }: Props) => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOk = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Inserisci un nome per la cartella.'); return }
    if (trimmed.length > 60) { setError('Massimo 60 caratteri.'); return }
    setLoading(true)
    setError('')
    try {
      await onCreate(trimmed)
      playSound('open')
      setName('')
      onClose()
    } catch {
      setError('Errore nella creazione della cartella.')
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => { setName(''); setError(''); onClose() }

  return (
    <XPDialog
      title="📁 Nuova cartella"
      open={open}
      onClose={handleClose}
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
        placeholder="Nome cartella..."
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{name.length}/60</div>
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
