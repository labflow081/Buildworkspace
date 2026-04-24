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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, fetch])

  const createIdea = async (text: string, userId: string) => {
    const { data: idea, error } = await supabase
      .from('ideas')
      .insert({ text, project_id: projectId, created_by: userId })
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

  return { ideas, loading, createIdea, deleteIdea }
}
