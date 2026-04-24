import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { WindowProvider } from '@/contexts/WindowContext'
import { BootScreen } from '@/components/BootScreen'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DesktopPage } from '@/pages/DesktopPage'
import { ProjectPage } from '@/pages/ProjectPage'
import { playSound } from '@/lib/sounds'

const BOOT_DURATION = 1500

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedLayout />}>
      <Route path="/desktop" element={<DesktopPage />} />
      <Route path="/project/:id" element={<ProjectPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/desktop" replace />} />
  </Routes>
)

export const App = () => {
  const [booting, setBooting] = useState(() => !sessionStorage.getItem('booted'))

  useEffect(() => {
    if (!booting) return
    const t = setTimeout(() => {
      sessionStorage.setItem('booted', '1')
      setBooting(false)
      playSound('boot')
    }, BOOT_DURATION)
    return () => clearTimeout(t)
  }, [booting])

  return (
    <AuthProvider>
      <WindowProvider>
        {booting ? <BootScreen /> : <AppRoutes />}
      </WindowProvider>
    </AuthProvider>
  )
}
