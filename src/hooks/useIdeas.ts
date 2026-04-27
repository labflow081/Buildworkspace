import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Idea } from '@/types'

export const useIdeas = (projectId: string) => {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setIdeas((data as Idea[]) ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`ideas:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ideas',
        filter: `project_id=eq.${projectId}`
      }, payload => {
        setIdeas(prev => {
          if (prev.find(i => i.id === payload.new.id)) return prev
          return [payload.new as Idea, ...prev]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ideas',
        filter: `project_id=eq.${projectId}`
      }, payload => {
        setIdeas(prev => prev.map(i => i.id === payload.new.id ? payload.new as Idea : i))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, fetch])

  const createIdea = async (
    text: string,
    userId: string,
    tag: string | null = null,
    priority: string | null = null,
    folder_id: string | null = null,
  ) => {
    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({ text, project_id: projectId, created_by: userId, tag, priority, folder_id })
      .select()
      .single()
    if (error) throw error
    setIdeas(prev => [idea as Idea, ...prev])
    return idea as Idea
  }

  const deleteIdea = async (ideaId: string) => {
    await supabase.from('ideas').delete().eq('id', ideaId)
    setIdeas(prev => prev.filter(i => i.id !== ideaId))
  }

  const updateIdea = async (
    ideaId: string,
    data: { text: string; tag?: string | null; priority?: string | null; folder_id?: string | null },
  ) => {
    const { error } = await supabase.from('ideas').update(data).eq('id', ideaId)
    if (error) throw error
    setIdeas(prev => prev.map(i => i.id === ideaId ? { ...i, ...data } as Idea : i))
  }

  const moveIdeas = async (ideaIds: string[], folder_id: string | null) => {
    const { error } = await supabase
      .from('ideas')
      .update({ folder_id })
      .in('id', ideaIds)
    if (error) throw error
    setIdeas(prev => prev.map(i => ideaIds.includes(i.id) ? { ...i, folder_id } : i))
  }

  return { ideas, loading, createIdea, deleteIdea, updateIdea, moveIdeas }
}
