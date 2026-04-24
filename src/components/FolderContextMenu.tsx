import { useEffect, useRef } from 'react'
import { Project } from '@/types'

interface Props {
  project: Project
  x: number
  y: number
  onClose: () => void
  onOpen: () => void
  onLightbox: () => void
  onRename: () => void
  onPin: () => void
  onDelete: () => void
}

const MenuItem = ({
  label, onClick, danger = false, disabled = false,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '5px 14px',
      fontSize: 11, fontFamily: 'Tahoma',
      color: disabled ? '#aaa' : danger ? '#CC0000' : '#1A1828',
      background: 'none', border: 'none',
      cursor: disabled ? 'default' : 'pointer',
      whiteSpace: 'nowrap',
    }}
    onMouseOver={e => {
      if (!disabled)
        (e.currentTarget as HTMLElement).style.background = '#316AC5'
      ;(e.currentTarget as HTMLElement).style.color = disabled ? '#aaa' : 'white'
    }}
    onMouseOut={e => {
      (e.currentTarget as HTMLElement).style.background = 'none'
      ;(e.currentTarget as HTMLElement).style.color = disabled ? '#aaa' : danger ? '#CC0000' : '#1A1828'
    }}
  >
    {label}
  </button>
)

export const FolderContextMenu = ({
  project, x, y, onClose, onOpen, onLightbox, onRename, onPin, onDelete,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)

  // Chiude cliccando fuori
  useEffect(() => {
    const handle = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [onClose])

  // Aggiusta posizione per non uscire dallo schermo
  const menuW = 180
  const menuH = 200
  const adjustedX = Math.min(x, window.innerWidth - menuW - 8)
  const adjustedY = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        zIndex: 90,
        background: '#FFFFFF',
        border: '1px solid #7B9DD2',
        borderRadius: 2,
        boxShadow: '2px 2px 8px rgba(0,0,0,0.35)',
        minWidth: menuW,
        padding: '3px 0',
      }}
    >
      <MenuItem label="Apri" onClick={() => { onOpen(); onClose() }} />
      {project.cover_url && (
        <MenuItem label="Ingrandisci copertina" onClick={() => { onLightbox(); onClose() }} />
      )}
      <MenuItem label="Rinomina" onClick={() => { onRename(); onClose() }} />
      <MenuItem
        label={project.pinned ? 'Rimuovi pin' : 'Pinna in alto'}
        onClick={() => { onPin(); onClose() }}
      />
      {/* Separatore */}
      <div style={{ height: 1, background: '#D4D0C8', margin: '3px 0' }} />
      <MenuItem
        label="Elimina progetto"
        danger
        onClick={() => { onDelete(); onClose() }}
      />
    </div>
  )
}
