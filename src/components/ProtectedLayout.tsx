import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Taskbar } from './Taskbar'
import { StartMenu } from './StartMenu'
import { useWindows } from '@/contexts/WindowContext'

export const ProtectedLayout = () => {
  const { user, loading } = useAuth()
  const { startMenuOpen } = useWindows()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#000' }}>
      {/* Area contenuto (sopra la taskbar) */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* Taskbar fissa */}
      <Taskbar />

      {/* Start Menu (sopra tutto) */}
      {startMenuOpen && <StartMenu />}
    </div>
  )
}
