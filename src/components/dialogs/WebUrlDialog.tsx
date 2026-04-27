import { useState, useEffect } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { XPInput } from '@/components/xp/XPInput'

interface Props {
  open: boolean
  onClose: () => void
  initialUrl?: string | null
  onSave: (url: string) => Promise<void>
}

export const WebUrlDialog = ({ open, onClose, initialUrl, onSave }: Props) => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setUrl(initialUrl ?? '')
      setError('')
    }
  }, [open, initialUrl])

  const handleOk = async () => {
    const trimmed = url.trim()
    if (!trimmed) { setError('Inserisci un URL.'); return }
    if (trimmed.length > 500) { setError('Massimo 500 caratteri.'); return }
    if (!/^https?:\/\//i.test(trimmed)) {
      setError('Inserisci un URL valido (deve iniziare con https://)')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSave(trimmed)
      onClose()
    } catch {
      setError('Errore nel salvataggio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <XPDialog
      title="🌐 Link Webapp"
      open={open}
      onClose={onClose}
      onOk={handleOk}
      okDisabled={loading}
    >
      <XPInput
        label="URL della webapp:"
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        maxLength={500}
        placeholder="https://..."
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleOk() }}
      />
      <div style={{ fontSize: 10, color: '#666', textAlign: 'right' }}>{url.length}/500</div>
      {error && <div style={{ fontSize: 11, color: '#E84444' }}>{error}</div>}
    </XPDialog>
  )
}
