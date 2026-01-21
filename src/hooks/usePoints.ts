'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePoints(userId: string | undefined) {
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchPoints() {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('points')
        .eq('user_id', userId)

      if (error) {
        // Failed to fetch points - silently fail
        setLoading(false)
        return
      }

      const total = data.reduce((sum, log) => sum + log.points, 0)
      setPoints(total)
      setLoading(false)
    }

    fetchPoints()

    // リアルタイム更新を購読
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchPoints()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { points, loading }
}
