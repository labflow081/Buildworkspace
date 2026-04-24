import { ReactNode, useEffect } from 'react'
import { XPButton } from './XPButton'

interface XPDialogProps {
  title: string
  open: boolean
  onClose: () => void
  onOk?: () => void
  okLabel?: string
  cancelLabel?: string
  children: ReactNode
  leftAction?: ReactNode
  okDisabled?: boolean
}

export const XPDialog = ({
  title,
  open,
  onClose,
  onOk,
  okLabel = 'OK',
  cancelLabel = 'Annulla',
  children,
  leftAction,
  okDisabled = false,
}: XPDialogProps) => {
  // Blocca scroll body quando aperto
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="xp-window w-full max-w-sm animate-xp-open" style={{ borderRadius: '8px 8px 4px 4px' }}>
        {/* Title bar */}
        <div className="xp-titlebar" style={{ borderRadius: '6px 6px 0 0' }}>
          <div className="w-4 h-4 flex-shrink-0">
            <svg viewBox="0 0 16 16" width="14" height="14">
              <rect x="2" y="2" width="12" height="12" rx="1" fill="#FFD700" stroke="#B8860B" strokeWidth="0.5"/>
              <text x="8" y="11" fontSize="8" textAnchor="middle" fill="#1A1828">!</text>
            </svg>
          </div>
          <span className="xp-titlebar-title">{title}</span>
          <button className="xp-window-btn xp-window-btn-close" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3" style={{ background: '#ECE9D8' }}>
          {children}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 pb-4"
          style={{ background: '#ECE9D8', borderTop: '1px solid #ccc', paddingTop: '8px' }}
        >
          <div>{leftAction}</div>
          <div className="flex gap-2">
            {onOk && (
              <XPButton variant="primary" onClick={onOk} disabled={okDisabled}>
                {okLabel}
              </XPButton>
            )}
            <XPButton onClick={onClose}>{cancelLabel}</XPButton>
          </div>
        </div>
      </div>
    </div>
  )
}
