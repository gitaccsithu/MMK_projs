import * as api from '@/services/mockApi'
import type { Doctor } from '@/types'
import { useCallback, useEffect, useState } from 'react'

/** MediCare+ doctor workspace: Doctor row keyed by `doctor.userId === auth userId`. */
export function useDoctorWorkspace(userId: string | undefined) {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setDoctor(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const row = await api.getDoctorByUserId(userId)
      setDoctor(row ?? null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let active = true
    void (async () => {
      await Promise.resolve()
      if (!active) return

      if (!userId) {
        setDoctor(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const row = await api.getDoctorByUserId(userId)
        if (!active) return
        setDoctor(row ?? null)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [userId])

  return { doctor, loading, reload }
}
