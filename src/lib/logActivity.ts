import { supabase } from '@/lib/supabase'
import { ActivityActionType } from '@/types'

export const logActivity = async (params: {
  userId: string
  action_type: ActivityActionType
  target_type: 'idea' | 'task' | 'project' | 'folder'
  target_id: string
  project_id?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> => {
  try {
    await supabase.from('activities').insert({
      user_id: params.userId,
      action_type: params.action_type,
      target_type: params.target_type,
      target_id: params.target_id,
      project_id: params.project_id ?? null,
      metadata: params.metadata ?? {},
    })
  } catch {
    // Silent fail — non deve bloccare l'UI
  }
}
