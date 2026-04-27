import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '@/hooks/useProjects'
import { useAuth } from '@/contexts/AuthContext'
import { logActivity } from '@/lib/logActivity'
import { XPWindow } from '@/components/xp/XPWindow'
import { TasksPage } from './TasksPage'
import { IdeasPage } from './IdeasPage'
import { FolderIcon } from '@/components/FolderIcon'
import { ChangeCoverDialog } from '@/components/dialogs/ChangeCoverDialog'
import { RenameProjectDialog } from '@/components/dialogs/RenameProjectDialog'
import { WebUrlDialog } from '@/components/dialogs/WebUrlDialog'
import { playSound } from '@/lib/sounds'

type Tab = 'tasks' | 'ideas' | 'link'

// Stile condiviso per i tab
const tabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '3px 10px',
  background: active ? '#ECE9D8' : 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
  border: '1px solid #999',
  borderBottom: active ? 'none' : '1px solid #999',
  borderRadius: '3px 3px 0 0',
  cursor: 'pointer',
  fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828',
  fontWeight: active ? 600 : 400,
})

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { project, loading, updateCover, updateName, updateWebUrl } = useProject(id ?? '')
  const [tab, setTab] = useState<Tab>('tasks')
  const [coverOpen, setCoverOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [webUrlOpen, setWebUrlOpen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

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

  const handleSaveWebUrl = async (url: string) => {
    await updateWebUrl(url)
    if (user) {
      logActivity({
        userId: user.id,
        action_type: 'set_project_url',
        target_type: 'project',
        target_id: project.id,
        project_id: project.id,
        metadata: { project_name: project.name, url },
      })
    }
  }

  const handleCopyUrl = async () => {
    if (!project.web_url) return
    try {
      await navigator.clipboard.writeText(project.web_url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // silent
    }
  }

  const hasUrl = !!project.web_url

  return (
    <XPWindow windowId={project.id} title={project.name}>
      {/* Tab bar */}
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
        <button onClick={() => handleSwitchTab('tasks')} style={tabStyle(tab === 'tasks')}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="#2A5BA5" strokeWidth="1.5"/>
            <line x1="3" y1="4" x2="9" y2="4" stroke="#2A5BA5" strokeWidth="1"/>
            <line x1="3" y1="6.5" x2="9" y2="6.5" stroke="#2A5BA5" strokeWidth="1"/>
            <line x1="3" y1="9" x2="7" y2="9" stroke="#2A5BA5" strokeWidth="1"/>
          </svg>
          Task
        </button>

        {/* Tab Idee */}
        <button onClick={() => handleSwitchTab('ideas')} style={tabStyle(tab === 'ideas')}>
          <span style={{ fontSize: 12 }}>💡</span>
          Idee
        </button>

        {/* Tab Link */}
        <button onClick={() => handleSwitchTab('link')} style={tabStyle(tab === 'link')}>
          <span style={{ fontSize: 12 }}>🌐</span>
          Link
          {hasUrl && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#6FAB47', flexShrink: 0,
              display: 'inline-block', marginLeft: 2,
            }} />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ background: '#ECE9D8' }}>
        {tab === 'tasks' && (
          <TasksPage projectId={project.id} projectName={project.name} />
        )}
        {tab === 'ideas' && (
          <IdeasPage projectId={project.id} projectName={project.name} onSwitchToTasks={() => setTab('tasks')} />
        )}
        {tab === 'link' && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '24px 20px', gap: 16,
          }}>
            {!hasUrl ? (
              /* Empty state */
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, lineHeight: 1 }}>🌐</div>
                  <div style={{ fontSize: 13, fontFamily: 'Tahoma', color: '#1A1828', marginTop: 10, fontWeight: 600 }}>
                    Nessun link impostato
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'Tahoma', color: '#666', marginTop: 4 }}>
                    Aggiungi il link della webapp di questo progetto
                  </div>
                </div>
                <button
                  onClick={() => setWebUrlOpen(true)}
                  style={{
                    padding: '5px 16px', minHeight: 28,
                    background: 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)',
                    border: '2px solid #2A5BA5', borderRadius: 3,
                    fontSize: 11, fontFamily: 'Tahoma', fontWeight: 600,
                    color: '#1A1828', cursor: 'pointer',
                  }}
                >
                  + Aggiungi link
                </button>
              </>
            ) : (
              /* Link presente */
              <>
                {/* Link cliccabile */}
                <div style={{
                  background: 'white', border: '1px solid #c8c5b8',
                  borderRadius: 3, padding: '8px 12px',
                  width: '100%', maxWidth: 360,
                  boxShadow: '1px 1px 3px rgba(0,0,0,0.08)',
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'Tahoma', color: '#666', marginBottom: 4 }}>
                    Link webapp:
                  </div>
                  <a
                    href={project.web_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11, fontFamily: 'Tahoma', color: '#2A5BA5',
                      textDecoration: 'underline', wordBreak: 'break-all',
                      display: 'block',
                    }}
                  >
                    {project.web_url}
                  </a>
                </div>

                {/* Bottoni azione */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={() => window.open(project.web_url!, '_blank', 'noopener,noreferrer')}
                    style={{
                      padding: '5px 12px', minHeight: 28,
                      background: 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)',
                      border: '2px solid #2A5BA5', borderRadius: 3,
                      fontSize: 11, fontFamily: 'Tahoma', fontWeight: 600,
                      color: '#1A1828', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    🌐 Apri webapp
                  </button>

                  <button
                    onClick={() => setWebUrlOpen(true)}
                    style={{
                      padding: '5px 12px', minHeight: 28,
                      background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
                      border: '1px solid #555', borderRadius: 3,
                      fontSize: 11, fontFamily: 'Tahoma',
                      color: '#1A1828', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    ✏️ Modifica
                  </button>

                  <button
                    onClick={handleCopyUrl}
                    style={{
                      padding: '5px 12px', minHeight: 28,
                      background: copiedUrl
                        ? 'linear-gradient(180deg, #8CD45A 0%, #5A9A2A 100%)'
                        : 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
                      border: copiedUrl ? '1px solid #4A8B2C' : '1px solid #555',
                      borderRadius: 3,
                      fontSize: 11, fontFamily: 'Tahoma',
                      color: '#1A1828', cursor: 'pointer',
                      transition: 'background 0.2s, border-color 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedUrl ? '✓ Copiato!' : '📋 Copia link'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #ccc',
        padding: '6px 12px',
        background: '#D4D0C8',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        flexWrap: 'wrap',
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

        {/* Bottone Link */}
        <button
          onClick={() => setWebUrlOpen(true)}
          title={hasUrl ? project.web_url! : 'Imposta link webapp'}
          style={{
            background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
            border: '1px solid #555',
            borderRadius: 3,
            padding: '3px 8px',
            fontSize: 11, fontFamily: 'Tahoma', cursor: 'pointer',
            color: '#1A1828',
            minHeight: 28,
            display: 'flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          🌐 Link
          {hasUrl && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#6FAB47', flexShrink: 0,
              display: 'inline-block',
            }} />
          )}
        </button>

        {/* Bottone Cambia copertina */}
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
        onSave={async (newName) => {
          const oldName = project.name
          await updateName(newName)
          if (user) {
            logActivity({
              userId: user.id,
              action_type: 'renamed_project',
              target_type: 'project',
              target_id: project.id,
              project_id: project.id,
              metadata: { old_name: oldName, new_name: newName },
            })
          }
        }}
      />

      <WebUrlDialog
        open={webUrlOpen}
        onClose={() => setWebUrlOpen(false)}
        initialUrl={project.web_url}
        onSave={handleSaveWebUrl}
      />
    </XPWindow>
  )
}
