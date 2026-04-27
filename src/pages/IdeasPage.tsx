import { useState, useEffect, useRef } from 'react'
import { useIdeas } from '@/hooks/useIdeas'
import { useIdeaFolders } from '@/hooks/useIdeaFolders'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks/useProfiles'
import { useWindows } from '@/contexts/WindowContext'
import { supabase } from '@/lib/supabase'
import { NewIdeaDialog } from '@/components/dialogs/NewIdeaDialog'
import { EditIdeaDialog } from '@/components/dialogs/EditIdeaDialog'
import { PromoteToTaskDialog } from '@/components/dialogs/PromoteToTaskDialog'
import { CommentsDialog } from '@/components/dialogs/CommentsDialog'
import { NewFolderDialog } from '@/components/dialogs/NewFolderDialog'
import { RenameFolderDialog } from '@/components/dialogs/RenameFolderDialog'
import { DeleteFolderDialog } from '@/components/dialogs/DeleteFolderDialog'
import { XpSelect } from '@/components/xp/XpSelect'
import { useLongPress } from '@/hooks/useLongPress'
import { logActivity } from '@/lib/logActivity'
import { TAGS, PRIORITIES } from '@/constants/taxonomy'
import { Idea, IdeaFolder } from '@/types'
import { playSound } from '@/lib/sounds'

// ── Badge helpers ─────────────────────────────────────────────

const PriorityBadge = ({ value }: { value: string }) => {
  const p = PRIORITIES.find(p => p.value === value)
  if (!p) return null
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: p.color, fontFamily: 'Tahoma' }}>
      ● {p.label}
    </span>
  )
}

const TagBadge = ({ value }: { value: string }) => {
  const t = TAGS.find(t => t.value === value)
  if (!t) return null
  return (
    <span style={{
      background: '#316AC5', color: 'white',
      fontFamily: 'Tahoma', fontSize: 10, fontWeight: 700,
      padding: '1px 6px', borderRadius: 2,
    }}>
      {t.label}
    </span>
  )
}

// ── FilterToolbar ─────────────────────────────────────────────

const FilterToolbar = ({
  filterTag, filterPriority,
  onTagChange, onPriorityChange, onReset,
}: {
  filterTag: string
  filterPriority: string
  onTagChange: (v: string) => void
  onPriorityChange: (v: string) => void
  onReset: () => void
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 8px',
    borderBottom: '1px solid #ACA899',
    background: '#ECE9D8',
    flexWrap: 'wrap', flexShrink: 0,
  }}>
    <label style={{ fontSize: 11, color: '#1A1828', whiteSpace: 'nowrap' }}>Tag:</label>
    <div style={{ minWidth: 100, flex: '1 1 100px' }}>
      <XpSelect options={TAGS} emptyLabel="Tutti" value={filterTag} onChange={e => onTagChange(e.target.value)} />
    </div>
    <label style={{ fontSize: 11, color: '#1A1828', whiteSpace: 'nowrap' }}>Priorità:</label>
    <div style={{ minWidth: 90, flex: '1 1 90px' }}>
      <XpSelect options={PRIORITIES} emptyLabel="Tutte" value={filterPriority} onChange={e => onPriorityChange(e.target.value)} />
    </div>
    {(filterTag || filterPriority) && (
      <button
        className="xp-button"
        onClick={onReset}
        style={{ whiteSpace: 'nowrap', padding: '3px 10px', minHeight: 24, minWidth: 0 }}
      >
        Reset
      </button>
    )}
  </div>
)

// ── IdeaCard ──────────────────────────────────────────────────

const IdeaCard = ({
  idea, authorName, commentCount,
  onDelete, onEdit, onPromote, onComment,
  selectionMode, selected, onSelect,
}: {
  idea: Idea
  authorName: string
  commentCount: number
  onDelete: (id: string) => void
  onEdit: (idea: Idea) => void
  onPromote: (idea: Idea) => void
  onComment: (idea: Idea) => void
  selectionMode: boolean
  selected: boolean
  onSelect: (id: string) => void
}) => {
  const longPress = useLongPress(() => { if (!selectionMode) onEdit(idea) })

  const handleDelete = () => {
    if (window.confirm('Eliminare questa idea?')) {
      onDelete(idea.id)
      playSound('navigate')
    }
  }

  return (
    <div
      onClick={selectionMode ? () => onSelect(idea.id) : undefined}
      style={{
        margin: '8px 12px',
        padding: '8px 10px',
        background: selected ? '#DDD8C4' : 'white',
        border: selected ? '2px solid #2A5BA5' : '1px solid #c8c5b8',
        borderRadius: 3,
        boxShadow: '1px 1px 3px rgba(0,0,0,0.1)',
        animation: 'fadeIn 0.3s ease',
        position: 'relative',
        cursor: selectionMode ? 'pointer' : 'default',
        display: 'flex', alignItems: 'flex-start',
        gap: selectionMode ? 8 : 0,
      }}
    >
      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(idea.id)}
          onMouseDown={e => e.stopPropagation()}
          style={{
            width: 13, height: 13, border: '1px solid #7F9DB9',
            background: 'white', accentColor: '#2A5BA5',
            cursor: 'pointer', flexShrink: 0, marginTop: 3,
          }}
        />
      )}

      {!selectionMode && (
        <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3, alignItems: 'center' }}>
          <button
            onClick={() => onComment(idea)}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            title="Commenti"
            style={{
              height: 22, minWidth: 22, padding: '0 4px', borderRadius: 3,
              border: '1px solid #ccc',
              background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
              fontSize: 10, fontFamily: 'Tahoma',
              color: commentCount > 0 ? '#2A5BA5' : '#999',
              fontWeight: commentCount > 0 ? 600 : 400,
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#2A5BA5'
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#ccc'
            }}
          >
            💬{commentCount > 0 ? ` ${commentCount}` : ''}
          </button>

          <button
            onClick={() => onPromote(idea)}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            title="Trasforma in task"
            style={{
              width: 22, height: 22, borderRadius: 3,
              border: '1px solid #ccc',
              background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
              color: '#888', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)'
              ;(e.currentTarget as HTMLElement).style.color = '#1A1828'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#2A5BA5'
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)'
              ;(e.currentTarget as HTMLElement).style.color = '#888'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#ccc'
            }}
          >
            ➜
          </button>

          <button
            onClick={handleDelete}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            title="Elimina idea"
            style={{
              width: 22, height: 22, borderRadius: 3,
              border: '1px solid #ccc',
              background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
              color: '#bbb', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #E84444 0%, #B81818 100%)'
              ;(e.currentTarget as HTMLElement).style.color = 'white'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#900'
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)'
              ;(e.currentTarget as HTMLElement).style.color = '#bbb'
              ;(e.currentTarget as HTMLElement).style.borderColor = '#ccc'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{ flex: 1, minWidth: 0, userSelect: 'none' }}
        {...(!selectionMode ? longPress : {})}
      >
        <p style={{
          fontSize: 12, color: '#1A1828', margin: 0,
          wordBreak: 'break-word', lineHeight: 1.5,
          paddingRight: selectionMode ? 0 : 90,
        }}>
          {idea.text}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: 10, color: '#999' }}>💡 {authorName}</span>
          <span style={{ fontSize: 10, color: '#bbb' }}>
            {new Date(idea.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
          </span>
        </div>
        {(idea.priority || idea.tag) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {idea.priority && <PriorityBadge value={idea.priority} />}
            {idea.tag && <TagBadge value={idea.tag} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ── FolderCard ────────────────────────────────────────────────

const FolderCard = ({
  folder, ideaCount, onOpen, onRename, onDelete,
}: {
  folder: IdeaFolder
  ideaCount: number
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}) => (
  <div
    style={{
      margin: '8px 12px',
      padding: '0 4px 0 12px',
      background: '#F5F0E0',
      border: '1px solid #c8c5b8',
      borderLeft: '3px solid #E8B947',
      borderRadius: 3,
      boxShadow: '1px 1px 3px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', gap: 4,
      minHeight: 52,
    }}
  >
    {/* Body (clickable) */}
    <div
      onClick={onOpen}
      style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 0' }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>📁</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1A1828', fontFamily: 'Tahoma' }}>
          {folder.name}
        </div>
        <div style={{ fontSize: 10, color: '#666', fontFamily: 'Tahoma' }}>
          {ideaCount} {ideaCount === 1 ? 'idea' : 'idee'}
        </div>
      </div>
    </div>

    {/* Azioni */}
    <button
      onClick={e => { e.stopPropagation(); onRename() }}
      title="Rinomina cartella"
      style={{
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0,
        borderRadius: 3,
      }}
      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#e0dcc8'}
      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}
    >
      ✏️
    </button>
    <button
      onClick={e => { e.stopPropagation(); onDelete() }}
      title="Elimina cartella"
      style={{
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0,
        borderRadius: 3,
      }}
      onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f5d0d0'}
      onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}
    >
      🗑
    </button>
  </div>
)

// ── PlusMenu ──────────────────────────────────────────────────

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '6px 14px', border: 'none', background: 'none',
  fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828',
  cursor: 'pointer', whiteSpace: 'nowrap',
}

// ── IdeasPage ─────────────────────────────────────────────────

interface Props {
  projectId: string
  projectName?: string
  onSwitchToTasks?: () => void
}

export const IdeasPage = ({ projectId, projectName, onSwitchToTasks }: Props) => {
  const { user } = useAuth()
  const { ideas, loading, createIdea, deleteIdea, updateIdea, moveIdeas } = useIdeas(projectId)
  const { folders, createFolder, renameFolder, deleteFolder } = useIdeaFolders(projectId)
  const { profiles } = useProfiles()
  const { addMinimized, minimized } = useWindows()

  // Dialog stato principale
  const [dialogOpen, setDialogOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)
  const [promotingIdea, setPromotingIdea] = useState<Idea | null>(null)
  const [commentingIdea, setCommentingIdea] = useState<Idea | null>(null)
  const [renamingFolder, setRenamingFolder] = useState<IdeaFolder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<IdeaFolder | null>(null)

  // Finestra cartella
  const [openFolder, setOpenFolder] = useState<IdeaFolder | null>(null)
  const [folderMinimized, setFolderMinimized] = useState(false)
  const prevMinimizedRef = useRef(minimized)

  // Detect ripristino cartella dalla taskbar
  useEffect(() => {
    if (!folderMinimized || !openFolder) return
    const wasIn = prevMinimizedRef.current.some(w => w.id === `folder-${openFolder.id}`)
    const isIn = minimized.some(w => w.id === `folder-${openFolder.id}`)
    if (wasIn && !isIn) setFolderMinimized(false)
    prevMinimizedRef.current = minimized
  }, [minimized, folderMinimized, openFolder])

  // Plus menu
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const [folderPlusMenuOpen, setFolderPlusMenuOpen] = useState(false)

  // Filtri vista principale
  const [filterTag, setFilterTag] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  // Filtri finestra cartella
  const [folderFilterTag, setFolderFilterTag] = useState('')
  const [folderFilterPriority, setFolderFilterPriority] = useState('')

  // Selezione multipla
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const [moveMenuOpen, setMoveMenuOpen] = useState(false)

  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!projectId) return
    supabase
      .from('comments')
      .select('target_id')
      .eq('project_id', projectId)
      .eq('target_type', 'idea')
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        data?.forEach(r => { counts[r.target_id] = (counts[r.target_id] ?? 0) + 1 })
        setCommentCounts(counts)
      })
  }, [projectId])

  const getName = (id: string) => {
    const p = profiles.find(p => p.id === id)
    return p?.display_name ?? id.slice(0, 8)
  }

  // ── Handlers idee ─────────────────────────────────────

  const handleCreate = async (data: { text: string; tag: string | null; priority: string | null }) => {
    if (!user) return
    const idea = await createIdea(data.text, user.id, data.tag, data.priority, null)
    logActivity({
      userId: user.id, action_type: 'created_idea', target_type: 'idea',
      target_id: idea.id, project_id: projectId,
      metadata: { project_name: projectName ?? '', ...(data.tag ? { tag: data.tag } : {}), ...(data.priority ? { priority: data.priority } : {}) },
    })
  }

  const handleCreateInFolder = async (data: { text: string; tag: string | null; priority: string | null }) => {
    if (!user || !openFolder) return
    const idea = await createIdea(data.text, user.id, data.tag, data.priority, openFolder.id)
    logActivity({
      userId: user.id, action_type: 'created_idea', target_type: 'idea',
      target_id: idea.id, project_id: projectId,
      metadata: { project_name: projectName ?? '', folder_id: openFolder.id, ...(data.tag ? { tag: data.tag } : {}), ...(data.priority ? { priority: data.priority } : {}) },
    })
  }

  const handleSaveEdit = async (data: { text: string; tag: string | null; priority: string | null; folder_id: string | null }) => {
    if (!editingIdea || !user) return
    await updateIdea(editingIdea.id, data)
    logActivity({
      userId: user.id, action_type: 'updated_idea', target_type: 'idea',
      target_id: editingIdea.id, project_id: projectId,
      metadata: { project_name: projectName ?? '', ...(data.tag ? { tag: data.tag } : {}), ...(data.priority ? { priority: data.priority } : {}) },
    })
  }

  // ── Handlers cartelle ─────────────────────────────────

  const handleCreateFolder = async (name: string) => {
    if (!user) return
    const folder = await createFolder(name, user.id)
    logActivity({
      userId: user.id, action_type: 'created_folder', target_type: 'folder',
      target_id: folder.id, project_id: projectId,
      metadata: { folder_name: name, project_name: projectName ?? '' },
    })
  }

  const handleRenameFolder = async (name: string) => {
    if (!renamingFolder || !user) return
    const oldName = renamingFolder.name
    await renameFolder(renamingFolder.id, name)
    if (openFolder?.id === renamingFolder.id) setOpenFolder(f => f ? { ...f, name } : f)
    logActivity({
      userId: user.id, action_type: 'renamed_folder', target_type: 'folder',
      target_id: renamingFolder.id, project_id: projectId,
      metadata: { old_name: oldName, new_name: name, project_name: projectName ?? '' },
    })
  }

  const handleDeleteFolder = async () => {
    if (!deletingFolder || !user) return
    await deleteFolder(deletingFolder.id)
    if (openFolder?.id === deletingFolder.id) {
      setOpenFolder(null)
      setFolderMinimized(false)
    }
    logActivity({
      userId: user.id, action_type: 'deleted_folder', target_type: 'folder',
      target_id: deletingFolder.id, project_id: projectId,
      metadata: { folder_name: deletingFolder.name, project_name: projectName ?? '' },
    })
  }

  // ── Finestra cartella ─────────────────────────────────

  const handleOpenFolder = (folder: IdeaFolder) => {
    setOpenFolder(folder)
    setFolderMinimized(false)
    setFolderFilterTag('')
    setFolderFilterPriority('')
  }

  const handleFolderMinimize = () => {
    if (!openFolder) return
    setFolderMinimized(true)
    addMinimized({
      id: `folder-${openFolder.id}`,
      title: `📁 ${openFolder.name}`,
      path: window.location.pathname,
    })
  }

  const handleFolderMaximize = () => {
    const el = document.getElementById('folder-window')
    if (!el) return
    el.style.transform = 'scale(0.97)'
    setTimeout(() => { el.style.transform = '' }, 150)
  }

  const handleFolderClose = () => {
    setOpenFolder(null)
    setFolderMinimized(false)
  }

  // ── Selezione multipla ────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setCopied(false)
    setMoveMenuOpen(false)
  }

  const handleMoveToFolder = async (folder_id: string | null) => {
    if (selectedIds.size === 0) return
    setMoveMenuOpen(false)
    await moveIdeas([...selectedIds], folder_id)
    playSound('navigate')
    exitSelectionMode()
  }

  const buildCopyText = (): string => {
    const name = projectName ?? 'questo progetto'
    const selected = ideas.filter(i => selectedIds.has(i.id))
    if (selected.length === 1)
      return `Aiutami a sviluppare un prompt per questa idea del progetto ${name}: "${selected[0].text}"`
    const lines = selected.map((idea, i) =>
      `${i + 1}. Aiutami a sviluppare un prompt per questa idea del progetto ${name}: "${idea.text}"`)
    return `Progetto: ${name}\n\nHo le seguenti idee su cui voglio lavorare:\n\n${lines.join('\n')}\n\nPer ogni idea genera un prompt dettagliato e actionable.`
  }

  const handleCopy = async () => {
    if (selectedIds.size === 0) return
    try {
      await navigator.clipboard.writeText(buildCopyText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silent */ }
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 12, color: '#666' }}>Caricamento idee...</div>
  }

  // ── Computed ──────────────────────────────────────────

  const freeIdeas = ideas.filter(i => !i.folder_id)
  const filteredFreeIdeas = freeIdeas.filter(i => {
    if (filterTag && i.tag !== filterTag) return false
    if (filterPriority && i.priority !== filterPriority) return false
    return true
  })

  const folderIdeas = openFolder ? ideas.filter(i => i.folder_id === openFolder.id) : []
  const filteredFolderIdeas = folderIdeas.filter(i => {
    if (folderFilterTag && i.tag !== folderFilterTag) return false
    if (folderFilterPriority && i.priority !== folderFilterPriority) return false
    return true
  })

  const selectedCount = selectedIds.size

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Vista principale ── */}

      {/* Barra controlli */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '3px 8px', borderBottom: '1px solid #ACA899',
        background: '#D4D0C8', flexShrink: 0,
      }}>
        <button
          onClick={() => { if (selectionMode) exitSelectionMode(); else setSelectionMode(true) }}
          style={{
            minWidth: 44, minHeight: 44, padding: '0 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            background: selectionMode
              ? 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)'
              : 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
            border: selectionMode ? '2px solid #2A5BA5' : '1px solid #555',
            borderRadius: 3, fontSize: 11, fontFamily: 'Tahoma',
            fontWeight: selectionMode ? 600 : 400, color: '#1A1828', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 12 }}>☑</span>
          {selectionMode ? 'Annulla' : 'Seleziona'}
        </button>
      </div>

      {/* Toolbar filtri */}
      <FilterToolbar
        filterTag={filterTag} filterPriority={filterPriority}
        onTagChange={setFilterTag} onPriorityChange={setFilterPriority}
        onReset={() => { setFilterTag(''); setFilterPriority('') }}
      />

      {/* Lista: cartelle + idee libere */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: selectionMode ? 72 : 64 }}>
        {folders.length === 0 && freeIdeas.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
            Nessuna idea. Aggiungine una!
          </div>
        )}

        {/* Cartelle */}
        {folders.map(folder => (
          <FolderCard
            key={folder.id}
            folder={folder}
            ideaCount={ideas.filter(i => i.folder_id === folder.id).length}
            onOpen={() => handleOpenFolder(folder)}
            onRename={() => setRenamingFolder(folder)}
            onDelete={() => setDeletingFolder(folder)}
          />
        ))}

        {/* Idee libere */}
        {filteredFreeIdeas.length === 0 && freeIdeas.length > 0 && (
          <div style={{ padding: '8px 12px', fontSize: 11, color: '#999' }}>
            Nessuna idea libera corrisponde ai filtri.
          </div>
        )}
        {filteredFreeIdeas.map(idea => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            authorName={getName(idea.created_by)}
            commentCount={commentCounts[idea.id] ?? 0}
            onDelete={deleteIdea}
            onEdit={setEditingIdea}
            onPromote={setPromotingIdea}
            onComment={setCommentingIdea}
            selectionMode={selectionMode}
            selected={selectedIds.has(idea.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>

      {/* FAB + con menu */}
      {!selectionMode && (
        <>
          {plusMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 8 }}
                onClick={() => setPlusMenuOpen(false)}
              />
              <div style={{
                position: 'absolute', bottom: 72, right: 16, zIndex: 9,
                background: '#ECE9D8', border: '1px solid #555',
                boxShadow: '2px 2px 6px rgba(0,0,0,0.35)',
                minWidth: 160,
              }}>
                <button
                  style={menuItemStyle}
                  onClick={() => { setPlusMenuOpen(false); setDialogOpen(true) }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
                >
                  📄 Nuova idea
                </button>
                <button
                  style={menuItemStyle}
                  onClick={() => { setPlusMenuOpen(false); setNewFolderOpen(true) }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
                >
                  📁 Nuova cartella
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setPlusMenuOpen(v => !v)}
            style={{
              position: 'absolute', bottom: 16, right: 16,
              width: 48, height: 48, borderRadius: '50%',
              background: 'linear-gradient(180deg, #6FAB47 0%, #4A8B2C 100%)',
              border: '2px solid #4A8B2C', color: 'white', fontSize: 24,
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 7,
            }}
            aria-label="Nuovo"
          >
            +
          </button>
        </>
      )}

      {/* Menu "Sposta in" — appare sopra la toolbar di selezione */}
      {selectionMode && moveMenuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 11 }}
            onClick={() => setMoveMenuOpen(false)}
          />
          <div style={{
            position: 'absolute', bottom: 58, left: 10, right: 10, zIndex: 12,
            background: '#ECE9D8', border: '1px solid #555',
            boxShadow: '2px 2px 6px rgba(0,0,0,0.35)',
          }}>
            <button
              style={menuItemStyle}
              onClick={() => handleMoveToFolder(null)}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
            >
              📄 Idee libere (nessuna cartella)
            </button>
            {folders.map(f => (
              <button
                key={f.id}
                style={menuItemStyle}
                onClick={() => handleMoveToFolder(f.id)}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
              >
                📁 {f.name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Toolbar selezione */}
      {selectionMode && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#ECE9D8', borderTop: '1px solid #ACA899',
          padding: '6px 10px 8px',
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828', flex: 1, minWidth: 80 }}>
            {selectedCount === 0
              ? 'Nessuna idea selezionata'
              : `${selectedCount} idea${selectedCount !== 1 ? ' selezionate' : ' selezionata'}`}
          </span>
          {folders.length > 0 && (
            <button
              onClick={() => setMoveMenuOpen(v => !v)}
              disabled={selectedCount === 0}
              style={{
                padding: '4px 10px', minHeight: 28,
                background: moveMenuOpen
                  ? 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)'
                  : 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
                border: moveMenuOpen ? '2px solid #2A5BA5' : '1px solid #555',
                borderRadius: 3, fontSize: 11, fontFamily: 'Tahoma',
                color: '#1A1828', cursor: selectedCount === 0 ? 'default' : 'pointer',
                opacity: selectedCount === 0 ? 0.5 : 1, whiteSpace: 'nowrap',
              }}
            >
              📁 Sposta in...
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={selectedCount === 0}
            style={{
              padding: '4px 10px', minHeight: 28,
              background: copied
                ? 'linear-gradient(180deg, #8CD45A 0%, #5A9A2A 100%)'
                : 'linear-gradient(180deg, #D0E8FF 0%, #7BB8FF 100%)',
              border: `2px solid ${copied ? '#4A8B2C' : '#2A5BA5'}`,
              borderRadius: 3, fontSize: 11, fontFamily: 'Tahoma', fontWeight: 600,
              color: '#1A1828', cursor: selectedCount === 0 ? 'default' : 'pointer',
              opacity: selectedCount === 0 ? 0.5 : 1, whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copiato!' : '📋 Copia per Claude'}
          </button>
          <button
            onClick={exitSelectionMode}
            style={{
              padding: '4px 10px', minHeight: 28,
              background: 'linear-gradient(180deg, #FAFAFA 0%, #DCDCDC 100%)',
              border: '1px solid #555', borderRadius: 3,
              fontSize: 11, fontFamily: 'Tahoma', color: '#1A1828', cursor: 'pointer',
            }}
          >
            Annulla
          </button>
        </div>
      )}

      {/* ── Finestra cartella (overlay) ── */}

      {openFolder && (
        <div
          id="folder-window"
          style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: folderMinimized ? 'none' : 'flex',
            flexDirection: 'column',
            background: '#ECE9D8',
            transition: 'transform 0.15s',
          }}
        >
          {/* Title bar */}
          <div className="xp-titlebar flex-shrink-0 select-none">
            <span style={{ fontSize: 14, marginRight: 4, flexShrink: 0 }}>📁</span>
            <span className="xp-titlebar-title">{openFolder.name}</span>
            <div className="flex gap-[2px] flex-shrink-0">
              <button
                className="xp-window-btn xp-window-btn-min"
                onClick={handleFolderMinimize}
                aria-label="Minimizza"
              >
                _
              </button>
              <button
                className="xp-window-btn xp-window-btn-max"
                onClick={handleFolderMaximize}
                aria-label="Ingrandisci"
              >
                □
              </button>
              <button
                className="xp-window-btn xp-window-btn-close"
                onClick={handleFolderClose}
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filtri cartella */}
          <FilterToolbar
            filterTag={folderFilterTag} filterPriority={folderFilterPriority}
            onTagChange={setFolderFilterTag} onPriorityChange={setFolderFilterPriority}
            onReset={() => { setFolderFilterTag(''); setFolderFilterPriority('') }}
          />

          {/* Lista idee nella cartella */}
          <div className="flex-1 overflow-y-auto relative" style={{ paddingBottom: 64 }}>
            {filteredFolderIdeas.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
                {folderIdeas.length === 0
                  ? 'Nessuna idea in questa cartella. Aggiungine una!'
                  : 'Nessuna idea corrisponde ai filtri.'}
              </div>
            )}
            {filteredFolderIdeas.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                authorName={getName(idea.created_by)}
                commentCount={commentCounts[idea.id] ?? 0}
                onDelete={deleteIdea}
                onEdit={setEditingIdea}
                onPromote={setPromotingIdea}
                onComment={setCommentingIdea}
                selectionMode={false}
                selected={false}
                onSelect={() => {}}
              />
            ))}
          </div>

          {/* FAB + nella cartella (solo "Nuova idea") */}
          <>
            {folderPlusMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 28 }}
                  onClick={() => setFolderPlusMenuOpen(false)}
                />
                <div style={{
                  position: 'absolute', bottom: 72, right: 16, zIndex: 29,
                  background: '#ECE9D8', border: '1px solid #555',
                  boxShadow: '2px 2px 6px rgba(0,0,0,0.35)',
                  minWidth: 160,
                }}>
                  <button
                    style={menuItemStyle}
                    onClick={() => { setFolderPlusMenuOpen(false); setFolderDialogOpen(true) }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#316AC5'; (e.currentTarget as HTMLElement).style.color = 'white' }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#1A1828' }}
                  >
                    📄 Nuova idea
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setFolderDialogOpen(true)}
              style={{
                position: 'absolute', bottom: 16, right: 16,
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(180deg, #6FAB47 0%, #4A8B2C 100%)',
                border: '2px solid #4A8B2C', color: 'white', fontSize: 24,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 27,
              }}
              aria-label="Nuova idea"
            >
              +
            </button>
          </>
        </div>
      )}

      {/* ── Dialogs ── */}

      <NewIdeaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />

      <NewIdeaDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onCreate={handleCreateInFolder}
      />

      <NewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      <EditIdeaDialog
        open={editingIdea !== null}
        onClose={() => setEditingIdea(null)}
        idea={editingIdea}
        folders={folders}
        onSave={handleSaveEdit}
      />

      <RenameFolderDialog
        open={renamingFolder !== null}
        onClose={() => setRenamingFolder(null)}
        initialName={renamingFolder?.name ?? ''}
        onSave={handleRenameFolder}
      />

      <DeleteFolderDialog
        open={deletingFolder !== null}
        onClose={() => setDeletingFolder(null)}
        folderName={deletingFolder?.name ?? ''}
        onConfirm={handleDeleteFolder}
      />

      <PromoteToTaskDialog
        open={promotingIdea !== null}
        onClose={() => setPromotingIdea(null)}
        idea={promotingIdea}
        profiles={profiles}
        currentUserId={user?.id ?? null}
        projectName={projectName}
        onDeleteIdea={deleteIdea}
        onSuccess={() => onSwitchToTasks?.()}
      />

      <CommentsDialog
        open={commentingIdea !== null}
        onClose={(finalCount) => {
          if (commentingIdea)
            setCommentCounts(prev => ({ ...prev, [commentingIdea.id]: finalCount }))
          setCommentingIdea(null)
        }}
        targetType="idea"
        targetId={commentingIdea?.id ?? ''}
        targetText={commentingIdea?.text ?? ''}
        projectId={projectId}
        projectName={projectName}
        currentUserId={user?.id ?? null}
        profiles={profiles}
      />
    </div>
  )
}
