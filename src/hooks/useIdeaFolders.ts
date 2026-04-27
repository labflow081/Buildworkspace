import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { IdeaFolder } from '@/types'

export const useIdeaFolders = (projectId: string) => {
  const [folders, setFolders] = useState<IdeaFolder[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data } = await supabase
      .from('idea_folders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setFolders((data as IdeaFolder[]) ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`idea_folders:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'idea_folders',
        filter: `project_id=eq.${projectId}`,
      }, payload => {
        setFolders(prev => {
          if (prev.find(f => f.id === payload.new.id)) return prev
          return [...prev, payload.new as IdeaFolder]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'idea_folders',
        filter: `project_id=eq.${projectId}`,
      }, payload => {
        setFolders(prev => prev.map(f => f.id === payload.new.id ? payload.new as IdeaFolder : f))
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'idea_folders',
        filter: `project_id=eq.${projectId}`,
      }, payload => {
        setFolders(prev => prev.filter(f => f.id !== (payload.old as IdeaFolder).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, fetch])

  const createFolder = async (name: string, userId: string): Promise<IdeaFolder> => {
    const { data: folder, error } = await supabase
      .from('idea_folders')
      .insert({ name, project_id: projectId, created_by: userId })
      .select()
      .single()
    if (error) throw error
    setFolders(prev => [...prev, folder as IdeaFolder])
    return folder as IdeaFolder
  }

  const renameFolder = async (folderId: string, name: string) => {
    const { error } = await supabase.from('idea_folders').update({ name }).eq('id', folderId)
    if (error) throw error
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f))
  }

  const deleteFolder = async (folderId: string) => {
    const { error } = await supabase.from('idea_folders').delete().eq('id', folderId)
    if (error) throw error
    setFolders(prev => prev.filter(f => f.id !== folderId))
  }

  return { folders, loading, createFolder, renameFolder, deleteFolder }
}
