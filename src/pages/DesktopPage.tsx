import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { FolderIcon } from '@/components/FolderIcon'
import { NewProjectDialog } from '@/components/dialogs/NewProjectDialog'
import { playSound } from '@/lib/sounds'

export const DesktopPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { projects, loading, createProject } = useProjects()
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  const handleOpenProject = (id: string) => {
    playSound('navigate')
    navigate(`/project/${id}`)
  }

  const handleCreate = async (name: string) => {
    if (!user) return
    const project = await createProject(name, user.id)
    navigate(`/project/${project.id}`)
  }

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #4A90D9 0%, #6BB6E8 38%, #8FCBF0 52%, #A8D88B 57%, #6FAB47 75%, #4A8B2C 100%)',
        paddingBottom: 56, // spazio taskbar
        paddingTop: 8,
      }}
    >
      <div
        className="grid px-4 py-2"
        style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 8px', maxWidth: 480, margin: '0 auto' }}
      >
        {/* Tile "Nuovo progetto" */}
        <div
          className="flex flex-col items-center gap-1 cursor-pointer select-none"
          onClick={() => setNewProjectOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setNewProjectOpen(true)}
        >
          <div style={{ width: 72, height: 66, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: 24, height: 6,
              background: '#6FAB47',
              borderRadius: '3px 3px 0 0',
              border: '1px dashed #4A8B2C',
            }} />
            <div style={{
              position: 'absolute', top: 6, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(135deg, rgba(245,215,122,0.3) 0%, rgba(106,171,71,0.3) 100%)',
              borderRadius: '2px 6px 4px 4px',
              border: '2px dashed #6FAB47',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 24, color: '#6FAB47', fontWeight: 700 }}>+</span>
            </div>
          </div>
          <span style={{
            fontSize: 11, color: 'white', fontFamily: 'Tahoma',
            textShadow: '1px 1px 2px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)',
            textAlign: 'center',
          }}>
            Nuovo progetto
          </span>
        </div>

        {/* Cartelle progetto */}
        {loading ? (
          <div style={{ fontSize: 11, color: 'white', textShadow: '1px 1px 2px black', padding: 8 }}>
            Caricamento...
          </div>
        ) : (
          projects.map(p => (
            <FolderIcon
              key={p.id}
              coverUrl={p.cover_url}
              label={p.name}
              size="sm"
              onClick={() => handleOpenProject(p.id)}
            />
          ))
        )}
      </div>

      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
