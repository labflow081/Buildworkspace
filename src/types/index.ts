export type ActivityActionType =
  | 'created_idea'
  | 'updated_idea'
  | 'created_task'
  | 'completed_task'
  | 'assigned_task'
  | 'promoted_idea_to_task'
  | 'created_project'
  | 'renamed_project'
  | 'set_project_url'
  | 'commented'
  | 'created_folder'
  | 'renamed_folder'
  | 'deleted_folder'

export interface Activity {
  id: string
  user_id: string
  action_type: ActivityActionType
  target_type: 'idea' | 'task' | 'project' | 'folder'
  target_id: string
  project_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface IdeaFolder {
  id: string
  project_id: string
  name: string
  created_by: string
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_color: string | null
}

export interface Project {
  id: string
  name: string
  cover_url: string | null
  web_url?: string | null
  created_by: string
  created_at: string
  pinned?: boolean
  pinned_at?: string | null
}

export interface Task {
  id: string
  project_id: string
  text: string
  assignee: string | null
  due_date: string | null
  done: boolean
  created_by: string
  created_at: string
  completed_at: string | null
  updated_at?: string | null
  tag: string | null
  priority: 'p1' | 'p2' | 'p3' | null
}

export interface Idea {
  id: string
  project_id: string
  text: string
  created_by: string
  created_at: string
  updated_at?: string | null
  tag: string | null
  priority: 'p1' | 'p2' | 'p3' | null
  folder_id: string | null
}

export interface Comment {
  id: string
  target_type: 'task' | 'idea'
  target_id: string
  project_id: string
  text: string
  created_by: string
  created_at: string
}

export interface MinimizedWindow {
  id: string
  title: string
  path: string
}
