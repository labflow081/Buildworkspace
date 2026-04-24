import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types'

export const useTasks = (projectId: string) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setTasks((data as Task[]) ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    fetch()

    // Realtime: nuove task aggiunte da altri
    const channel = supabase
      .channel(`tasks:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`
      }, payload => {
        setTasks(prev => {
          if (prev.find(t => t.id === payload.new.id)) return prev
          return [...prev, payload.new as Task]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`
      }, payload => {
        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, fetch])

  const createTask = async (data: {
    text: string
    assignee: string | null
    due_date: string | null
    created_by: string
  }) => {
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ ...data, project_id: projectId, done: false })
      .select()
      .single()
    if (error) throw error
    setTasks(prev => [...prev, task as Task])
    return task as Task
  }

  const toggleDone = async (taskId: string, done: boolean) => {
    const update: Partial<Task> = {
      done,
      completed_at: done ? new Date().toISOString() : null
    }
    await supabase.from('tasks').update(update).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...update } : t))
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  return { tasks, loading, createTask, toggleDone, deleteTask }
}
