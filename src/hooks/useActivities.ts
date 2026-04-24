import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Activity } from '@/types'

export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setActivities((data as Activity[]) ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel('activities:feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
      }, payload => {
        setActivities(prev => [payload.new as Activity, ...prev].slice(0, 10))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { activities, loading }
}
