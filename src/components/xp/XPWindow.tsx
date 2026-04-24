import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWindows } from '@/contexts/WindowContext'
import { playSound } from '@/lib/sounds'
import { MinimizedWindow } from '@/types'

interface XPWindowProps {
  windowId: string
  title: string
  children: ReactNode
  onClose?: () => void
  showIcon?: boolean
}

export const XPWindow = ({ windowId, title, children, onClose, showIcon = true }: XPWindowProps) => {
  const navigate = useNavigate()
  const { addMinimized } = useWindows()

  const handleClose = () => {
    playSound('navigate')
    if (onClose) onClose()
    else navigate('/desktop')
  }

  const handleMinimize = () => {
    const win: MinimizedWindow = { id: windowId, title, path: window.location.pathname }
    addMinimized(win)
    navigate('/desktop')
  }

  const handleMaximize = () => {
    // già full screen su mobile — effetto visivo
    const el = document.getElementById(`window-${windowId}`)
    if (!el) return
    el.style.transform = 'scale(0.97)'
    setTimeout(() => { el.style.transform = '' }, 150)
  }

  return (
    <div
      id={`window-${windowId}`}
      className="flex flex-col h-full transition-transform duration-150"
      style={{ background: '#ECE9D8' }}
    >
      {/* Title bar */}
      <div className="xp-titlebar flex-shrink-0 select-none">
        {showIcon && (
          <div className="w-4 h-4 flex-shrink-0 mr-1">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <rect x="1" y="5" width="9" height="7" fill="#F5D77A" stroke="#C99428" strokeWidth="0.5"/>
              <rect x="1" y="3" width="5" height="3" fill="#E8B947" stroke="#C99428" strokeWidth="0.5"/>
            </svg>
          </div>
        )}
        <span className="xp-titlebar-title truncate">{title}</span>
        <div className="flex gap-[2px] flex-shrink-0">
          <button
            className="xp-window-btn xp-window-btn-min"
            onClick={handleMinimize}
            aria-label="Minimizza"
          >
            _
          </button>
          <button
            className="xp-window-btn xp-window-btn-max"
            onClick={handleMaximize}
            aria-label="Ingrandisci"
          >
            □
          </button>
          <button
            className="xp-window-btn xp-window-btn-close"
            onClick={handleClose}
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )
}
