import { useOnlineStatus } from '@/hooks/useDebounce'
import { WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export function OfflineIndicator() {
  const online = useOnlineStatus()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40 }}
          animate={{ y: 0 }}
          exit={{ y: -40 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 py-2 text-sm font-medium text-yellow-950"
        >
          <WifiOff className="h-4 w-4" />
          You are offline. Some features may be unavailable.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
