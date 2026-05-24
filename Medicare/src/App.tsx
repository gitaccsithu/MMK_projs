import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { AppThemeProvider } from '@/components/theme-provider'
import { AppRouter } from '@/routes/index'
import { useAuthStore, useAppStore, useSettingsStore } from '@/store'
import { startSimulation } from '@/services/simulationService'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import BuildIcon from '@mui/icons-material/Build'

function MaintenanceScreen() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <BuildIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      <Typography variant="h5" fontWeight={500}>Under Maintenance</Typography>
      <Typography color="text.secondary">MediCare+ is temporarily unavailable.</Typography>
      <Button variant="outlined" onClick={() => useSettingsStore.getState().setMaintenanceMode(false)}>
        Exit maintenance (demo)
      </Button>
    </Box>
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

  if (maintenanceMode) return <MaintenanceScreen />

  return (
    <>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}

export default function App() {
  return (
    <AppThemeProvider>
      <AppShell />
    </AppThemeProvider>
  )
}
