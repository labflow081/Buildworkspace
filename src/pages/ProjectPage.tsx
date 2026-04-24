import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '@/hooks/useProjects'
import { XPWindow } from '@/components/xp/XPWindow'
import { TasksPage } from './TasksPage'
import { IdeasPage } from './IdeasPage'
import { FolderIcon } from '@/components/FolderIcon'
import { ChangeCoverDialog } from '@/components/dialogs/ChangeCoverDialog'
import { RenameProjectDialog } from '@/components/dialogs/RenameProjectDialog'
import { playSound } from '@/lib/sounds'

type Tab = 'tasks' | 'ideas'

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>()
  const { project, loading, updateCover, updateName } = useProject(id ?? '')
  const [tab, setTab] = useState<Tab>('tasks')
  const [coverOpen, setCoverOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)

  if (loading || !project) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECE9D8', fontSize: 12, color: '#666' }}>
        {loading ? 'Caricamento...' : 'Progetto non trovato.'}
      </div>
    )
  }

  const handleSwitchTab = (t: Tab) => {
    playSound('navigate')
    setTab(t)
  }

  return (
    <XPWindow windowId={project.id} title={project.name}>
      {/* Address bar / tab bar */}
      <div style={{
        background: '#D4D0C8',
        borderBottom: '2px inset #999',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px',
        flexShrink: 0,
      }}>
        {/* Tab Tasks */}
        <button
          onClick={() => handleSwitchTab('tasks')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px',
            background: tab === 'tasks' ? '#ECE9D8' : 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
            border: '1px solid #999',
            borderBottom: tab === 'tasks' ? 'none' : '1px solid #999',
            borderRadius: '3px 3px 0 0',
            cursor: 'pointer',
            fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828',
            fontWeight: tab === 'tasks' ? 600 : 400,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="#2A5BA5" strokeWidth="1.5"/>
            <line x1="3" y1="4" x2="9" y2="4" stroke="#2A5BA5" strokeWidth="1"/>
            <line x1="3" y1="6.5" x2="9" y2="6.5" stroke="#2A5BA5" strokeWidth="1"/>
            <line x1="3" y1="9" x2="7" y2="9" stroke="#2A5BA5" strokeWidth="1"/>
          </svg>
          Task
        </button>

        {/* Tab Idee */}
        <button
          onClick={() => handleSwitchTab('ideas')}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px',
            background: tab === 'ideas' ? '#ECE9D8' : 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
            border: '1px solid #999',
            borderBottom: tab === 'ideas' ? 'none' : '1px solid #999',
            borderRadius: '3px 3px 0 0',
            cursor: 'pointer',
            fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828',
            fontWeight: tab === 'ideas' ? 600 : 400,
          }}
        >
          <span style={{ fontSize: 12 }}>💡</span>
          Idee
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ background: '#ECE9D8' }}>
        {tab === 'tasks' ? (
          <TasksPage projectId={project.id} />
        ) : (
          <IdeasPage projectId={project.id} />
        )}
      </div>

      {/* Footer: copertina */}
      <div style={{
        borderTop: '1px solid #ccc',
        padding: '6px 12px',
        background: '#D4D0C8',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <FolderIcon coverUrl={project.cover_url} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="truncate" style={{ fontSize: 11, fontWeight: 600, color: '#1A1828' }}>{project.name}</div>
            <button
              onClick={() => setRenameOpen(true)}
              title="Rinomina progetto"
              style={{
                background: 'none', border: 'none', padding: '2px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="#777" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>
            {project.cover_url ? 'Copertina personalizzata' : 'Nessuna copertina'}
          </div>
        </div>
        <button
          onClick={() => setCoverOpen(true)}
          style={{
            background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
            border: '1px solid #555',
            borderRadius: 3,
            padding: '3px 10px',
            fontSize: 11, fontFamily: 'Tahoma', cursor: 'pointer',
            color: '#1A1828',
            minHeight: 28,
          }}
        >
          Cambia...
        </button>
      </div>

      <ChangeCoverDialog
        open={coverOpen}
        onClose={() => setCoverOpen(false)}
        projectId={project.id}
        currentCover={project.cover_url}
        onSaved={(url) => { updateCover(url); setCoverOpen(false) }}
      />

      <RenameProjectDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        initialName={project.name}
        onSave={updateName}
      />
    </XPWindow>
  )
}
