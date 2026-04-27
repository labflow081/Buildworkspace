import { useState } from 'react'
import { XPDialog } from '@/components/xp/XPDialog'
import { playSound } from '@/lib/sounds'

interface Props {
  open: boolean
  onClose: () => void
  folderName: string
  onConfirm: () => Promise<void>
}

export const DeleteFolderDialog = ({ open, onClose, folderName, onConfirm }: Props) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOk = async () => {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
      playSound('navigate')
      onClose()
    } catch {
      setError("Errore nell'eliminazione.")
      playSound('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <XPDialog
      title="Elimina cartella"
      open={open}
      onClose={onClose}
      onOk={handleOk}
      okLabel="Elimina"
      okDisabled={loading}
    >
      <p style={{ fontSize: 12, color: '#1A1828', margin: 0, lineHeight: 1.5 }}>
        Eliminando <strong>"{folderName}"</strong> le idee al suo interno
        rimarranno nel progetto senza cartella. Continuare?
      </p>
      {error && <div style={{ fontSize: 11, color: '#CC0000' }}>{error}</div>}
    </XPDialog>
  )
}
