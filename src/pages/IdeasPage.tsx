import { useState } from 'react'
import { useIdeas } from '@/hooks/useIdeas'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks/useProfiles'
import { NewIdeaDialog } from '@/components/dialogs/NewIdeaDialog'
import { Idea } from '@/types'

const IdeaCard = ({ idea, authorName }: { idea: Idea; authorName: string }) => {
  return (
    <div
      style={{
        margin: '8px 12px',
        padding: '8px 10px',
        background: 'white',
        border: '1px solid #c8c5b8',
        borderRadius: 3,
        boxShadow: '1px 1px 3px rgba(0,0,0,0.1)',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <p style={{ fontSize: 12, color: '#1A1828', margin: 0, wordBreak: 'break-word', lineHeight: 1.5 }}>
        {idea.text}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span style={{ fontSize: 10, color: '#999' }}>💡 {authorName}</span>
        <span style={{ fontSize: 10, color: '#bbb' }}>
          {new Date(idea.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

interface Props {
  projectId: string
}

export const IdeasPage = ({ projectId }: Props) => {
  const { user } = useAuth()
  const { ideas, loading, createIdea } = useIdeas(projectId)
  const { profiles } = useProfiles()
  const [dialogOpen, setDialogOpen] = useState(false)

  const getName = (id: string) => {
    const p = profiles.find(p => p.id === id)
    return p?.display_name ?? id.slice(0, 8)
  }

  const handleCreate = async (text: string) => {
    if (!user) return
    await createIdea(text, user.id)
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 12, color: '#666' }}>Caricamento idee...</div>
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 64 }}>
        {ideas.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 12 }}>
            Nessuna idea. Aggiungine una!
          </div>
        )}
        {ideas.map(idea => (
          <IdeaCard key={idea.id} idea={idea} authorName={getName(idea.created_by)} />
        ))}
      </div>

      {/* FAB + */}
      <button
        onClick={() => setDialogOpen(true)}
        style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 48, height: 48,
          borderRadius: '50%',
          background: 'linear-gradient(180deg, #6FAB47 0%, #4A8B2C 100%)',
          border: '2px solid #4A8B2C',
          color: 'white',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Nuova idea"
      >
        +
      </button>

      <NewIdeaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
