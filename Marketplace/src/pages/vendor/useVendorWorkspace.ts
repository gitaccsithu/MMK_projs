import { useCallback, useEffect, useState } from 'react'
import type { Vendor } from '@/types'
import * as api from '@/services/mockApi'

/** Resolves the Vendor row linked to the authenticated user (`userId`). */
export function useVendorForAuthUser(userId: string | undefined) {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setVendor(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const vendors = await api.getVendors()
      setVendor(vendors.find((v) => v.userId === userId) ?? null)
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
        setVendor(null)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const vendors = await api.getVendors()
        if (!active) return
        setVendor(vendors.find((v) => v.userId === userId) ?? null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  return { vendor, loading, reload }
}
