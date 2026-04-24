import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setProjects((data as Project[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const createProject = async (name: string, userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, created_by: userId })
      .select()
      .single()
    if (error) throw error
    setProjects(prev => [data as Project, ...prev])
    return data as Project
  }

  const updateCover = async (projectId: string, coverUrl: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ cover_url: coverUrl })
      .eq('id', projectId)
    if (error) throw error
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, cover_url: coverUrl } : p))
  }

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId)
    if (error) throw error
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  return { projects, loading, error, createProject, updateCover, deleteProject, refetch: fetch }
}

export const useProject = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    supabase.from('projects').select('*').eq('id', projectId).single().then(({ data }) => {
      setProject(data as Project)
      setLoading(false)
    })
  }, [projectId])

  const updateCover = async (coverUrl: string) => {
    await supabase.from('projects').update({ cover_url: coverUrl }).eq('id', projectId)
    setProject(prev => prev ? { ...prev, cover_url: coverUrl } : prev)
  }

  return { project, loading, updateCover }
}
