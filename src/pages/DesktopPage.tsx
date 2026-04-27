import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { useWindows } from '@/contexts/WindowContext'
import { FolderIcon } from '@/components/FolderIcon'
import { FolderContextMenu } from '@/components/FolderContextMenu'
import { CoverLightbox } from '@/components/CoverLightbox'
import { ActivityFeed } from '@/components/ActivityFeed'
import { NewProjectDialog } from '@/components/dialogs/NewProjectDialog'
import { RenameProjectDialog } from '@/components/dialogs/RenameProjectDialog'
import { useLongPress } from '@/hooks/useLongPress'
import { logActivity } from '@/lib/logActivity'
import { playSound } from '@/lib/sounds'
import { Project } from '@/types'

// ID fisso per la finestra attività nel sistema di minimize
const FEED_WINDOW_ID = 'activity-feed'

// Componente wrapper per ogni cartella: gestisce long-press e click
const FolderItem = ({
  project,
  onOpen,
  onContextMenu,
}: {
  project: Project
  onOpen: (id: string) => void
  onContextMenu: (project: Project, x: number, y: number) => void
}) => {
  const wasFiredRef = useRef(false)
  const folderRef = useRef<HTMLDivElement>(null)

  const longPress = useLongPress(() => {
    wasFiredRef.current = true
    const rect = folderRef.current?.getBoundingClientRect()
    const x = rect ? rect.left : 80
    const y = rect ? rect.bottom + 4 : 80
    onContextMenu(project, x, y)
  })

  return (
    <div
      ref={folderRef}
      {...longPress}
      onClick={() => {
        if (wasFiredRef.current) { wasFiredRef.current = false; return }
        onOpen(project.id)
      }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <FolderIcon
        coverUrl={project.cover_url}
        label={project.name}
        size="sm"
        pinned={project.pinned}
      />
    </div>
  )
}

export const DesktopPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { minimized, addMinimized } = useWindows()
  const { projects, loading, createProject, updateName, pinProject, deleteProject } = useProjects()

  const [newProjectOpen, setNewProjectOpen] = useState(false)

  // Context menu
  const [contextMenu, setContextMenu] = useState<{
    project: Project; x: number; y: number
  } | null>(null)

  // Lightbox
  const [lightbox, setLightbox] = useState<{ coverUrl: string; name: string } | null>(null)

  // Rename dialog (dalla Home)
  const [renaming, setRenaming] = useState<Project | null>(null)

  // Conferma eliminazione
  const [deleting, setDeleting] = useState<Project | null>(null)

  // Feed attività
  const isFeedMinimized = minimized.some(w => w.id === FEED_WINDOW_ID)
  const showFeed = !isFeedMinimized

  const handleOpenProject = (id: string) => {
    playSound('navigate')
    navigate(`/project/${id}`)
  }

  const handleCreate = async (name: string) => {
    if (!user) return
    const project = await createProject(name, user.id)
    logActivity({
      userId: user.id,
      action_type: 'created_project',
      target_type: 'project',
      target_id: project.id,
      project_id: project.id,
      metadata: { project_name: name },
    })
    navigate(`/project/${project.id}`)
  }

  const handleContextMenu = (project: Project, x: number, y: number) => {
    playSound('navigate')
    setContextMenu({ project, x, y })
  }

  const handlePin = async () => {
    if (!contextMenu) return
    await pinProject(contextMenu.project.id, !contextMenu.project.pinned)
  }

  const handleRenameConfirm = async (newName: string) => {
    if (!renaming || !user) return
    const oldName = renaming.name
    await updateName(renaming.id, newName)
    logActivity({
      userId: user.id,
      action_type: 'renamed_project',
      target_type: 'project',
      target_id: renaming.id,
      project_id: renaming.id,
      metadata: { old_name: oldName, new_name: newName },
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    await deleteProject(deleting.id)
    setDeleting(null)
    playSound('navigate')
  }

  const handleFeedMinimize = () => {
    addMinimized({ id: FEED_WINDOW_ID, title: 'Attività recenti', path: '/desktop' })
  }

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #4A90D9 0%, #6BB6E8 38%, #8FCBF0 52%, #A8D88B 57%, #6FAB47 75%, #4A8B2C 100%)',
        paddingBottom: 56,
        paddingTop: 8,
      }}
      onClick={() => setContextMenu(null)}
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
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            <FolderItem
              key={p.id}
              project={p}
              onOpen={handleOpenProject}
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreate={handleCreate}
      />

      {/* Context menu cartella */}
      {contextMenu && (
        <FolderContextMenu
          project={contextMenu.project}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpen={() => handleOpenProject(contextMenu.project.id)}
          onLightbox={() => {
            if (contextMenu.project.cover_url) {
              setLightbox({ coverUrl: contextMenu.project.cover_url, name: contextMenu.project.name })
            }
          }}
          onRename={() => setRenaming(contextMenu.project)}
          onPin={handlePin}
          onDelete={() => setDeleting(contextMenu.project)}
        />
      )}

      {/* Dialog rinomina (dalla Home) */}
      <RenameProjectDialog
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        initialName={renaming?.name ?? ''}
        onSave={handleRenameConfirm}
      />

      {/* Dialog conferma eliminazione */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleting(null) }}
        >
          <div className="xp-window w-full max-w-xs animate-xp-open" style={{ borderRadius: '8px 8px 4px 4px' }}>
            <div className="xp-titlebar" style={{ borderRadius: '6px 6px 0 0' }}>
              <div className="w-4 h-4 flex-shrink-0">
                <svg viewBox="0 0 16 16" width="14" height="14">
                  <rect x="2" y="2" width="12" height="12" rx="1" fill="#E84444" stroke="#900" strokeWidth="0.5"/>
                  <text x="8" y="11" fontSize="9" textAnchor="middle" fill="white" fontWeight="700">!</text>
                </svg>
              </div>
              <span className="xp-titlebar-title">Elimina progetto</span>
              <button className="xp-window-btn xp-window-btn-close" onClick={() => setDeleting(null)}>✕</button>
            </div>
            <div className="p-4" style={{ background: '#ECE9D8' }}>
              <p style={{ fontSize: 12, color: '#1A1828', margin: '0 0 4px' }}>
                Sei sicuro di voler eliminare <strong>"{deleting.name}"</strong>?
              </p>
              <p style={{ fontSize: 11, color: '#666', margin: 0 }}>
                Tutte le task e le idee verranno eliminate.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4" style={{ background: '#ECE9D8', borderTop: '1px solid #ccc', paddingTop: 8 }}>
              <button
                onClick={handleDeleteConfirm}
                className="xp-button primary"
                style={{ borderColor: '#900', background: 'linear-gradient(180deg, #FF6666 0%, #CC0000 100%)' }}
              >
                Elimina
              </button>
              <button className="xp-button" onClick={() => setDeleting(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox copertina */}
      {lightbox && (
        <CoverLightbox
          open
          onClose={() => setLightbox(null)}
          coverUrl={lightbox.coverUrl}
          projectName={lightbox.name}
        />
      )}

      {/* Feed attività (fixed in basso a destra) */}
      {showFeed && (
        <ActivityFeed
          onMinimize={handleFeedMinimize}
          onClose={handleFeedMinimize}
        />
      )}
    </div>
  )
}
