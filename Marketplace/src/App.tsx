import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { AppRouter } from '@/routes'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { useSettingsStore } from '@/store/settingsStore'
import { startSimulation } from '@/services/simulationService'
import { Button } from '@/components/ui/button'
import { Wrench } from 'lucide-react'
import { KeyboardShortcutsModal } from '@/components/layout/KeyboardShortcutsModal'

function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Wrench className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Under Maintenance</h1>
      <p className="max-w-md text-muted-foreground">
        ServiceHub is currently undergoing scheduled maintenance. Please check back soon.
      </p>
      <Button variant="outline" onClick={() => useSettingsStore.getState().setMaintenanceMode(false)}>
        Admin: Exit maintenance (demo)
      </Button>
    </div>
  )
}

function AppShell() {
  const { hydrate } = useAuthStore()
  const { initialize } = useAppStore()
  const maintenanceMode = useSettingsStore((s) => s.maintenanceMode)

  useEffect(() => {
    initialize()
    hydrate()
    startSimulation()
  }, [initialize, hydrate])

  if (maintenanceMode) {
    return <MaintenanceScreen />
  }

  return (
    <>
      <AppRouter />
      <KeyboardShortcutsModal />
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
