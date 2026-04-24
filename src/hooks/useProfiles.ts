import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types'

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      setProfiles((data as Profile[]) ?? [])
    })
  }, [])

  const getProfile = (id: string) => profiles.find(p => p.id === id)

  return { profiles, getProfile }
}
