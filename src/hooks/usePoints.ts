'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePoints(userId: string | undefined) {
  const [statusPoints, setStatusPoints] = useState(0)
  const [masuPoints, setMasuPoints] = useState(0)
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
        .select('points, type')
        .eq('user_id', userId)

      if (error) {
        setLoading(false)
        return
      }

      let status = 0
      let masu = 0
      for (const log of data) {
        masu += log.points
        if (log.type !== 'Point Exchange' && log.type !== 'Point Exchange Reversal') {
          status += log.points
        }
      }
      setStatusPoints(status)
      setMasuPoints(masu)
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

  return { statusPoints, masuPoints, loading }
}
