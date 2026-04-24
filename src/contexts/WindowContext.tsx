import { createContext, useContext, useState, ReactNode } from 'react'
import { MinimizedWindow } from '@/types'

interface WindowContextValue {
  minimized: MinimizedWindow[]
  startMenuOpen: boolean
  addMinimized: (win: MinimizedWindow) => void
  removeMinimized: (id: string) => void
  toggleStartMenu: () => void
  closeStartMenu: () => void
}

const WindowContext = createContext<WindowContextValue | null>(null)

export const WindowProvider = ({ children }: { children: ReactNode }) => {
  const [minimized, setMinimized] = useState<MinimizedWindow[]>([])
  const [startMenuOpen, setStartMenuOpen] = useState(false)

  const addMinimized = (win: MinimizedWindow) => {
    setMinimized(prev => {
      if (prev.find(w => w.id === win.id)) return prev
      return [...prev, win]
    })
  }

  const removeMinimized = (id: string) => {
    setMinimized(prev => prev.filter(w => w.id !== id))
  }

  const toggleStartMenu = () => setStartMenuOpen(v => !v)
  const closeStartMenu = () => setStartMenuOpen(false)

  return (
    <WindowContext.Provider value={{ minimized, startMenuOpen, addMinimized, removeMinimized, toggleStartMenu, closeStartMenu }}>
      {children}
    </WindowContext.Provider>
  )
}

export const useWindows = () => {
  const ctx = useContext(WindowContext)
  if (!ctx) throw new Error('useWindows deve essere usato dentro WindowProvider')
  return ctx
}
