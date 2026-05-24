import { useEffect, useState } from 'react'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import StorageIcon from '@mui/icons-material/Storage'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import { useSettingsStore } from '@/store'

export function AdminSettingsPage() {
  const hydratedMaintenance = useSettingsStore((s) => s.maintenanceMode)
  const setGlobalMaintenance = useSettingsStore((s) => s.setMaintenanceMode)

  const [maintenanceLocal, setMaintenanceLocal] = useState(false)

  useEffect(() => {
    void (async () => {
      const settings = await api.getAppSettings()
      setMaintenanceLocal(settings.maintenanceMode)
      setGlobalMaintenance(settings.maintenanceMode)
    })()
  }, [setGlobalMaintenance])

  async function syncMaintenance(enabled: boolean) {
    await api.updateAppSettings({ maintenanceMode: enabled })
    setMaintenanceLocal(enabled)
    setGlobalMaintenance(enabled)
    toast.message(enabled ? 'Maintenance curtain raised' : 'Patients & clinicians routed normally')
  }

  async function handleResetSeed() {
    await api.resetDemoData()
    await api.updateAppSettings({ maintenanceMode: false })
    setMaintenanceLocal(false)
    setGlobalMaintenance(false)
    toast.success('Synthetic clinic data restored from MediCare blueprint.')
    window.location.reload()
  }

  const maintenanceActive = maintenanceLocal || hydratedMaintenance

  return (
    <AnimatedPage>
      <PageHeader title="Platform guardrails" description="Flip maintenance curtains or restore synthetic datasets for onboarding tours." />
      <Box
        sx={{
          display: 'grid',
          gap: 5,
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <Card
          variant="outlined"
          sx={(theme) => ({
            overflow: 'hidden',
            borderColor: `${theme.palette.warning.main}aa`,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(225deg, ${theme.palette.background.paper}, ${theme.palette.warning.dark}52)`
              : `linear-gradient(to bottom right, #fff, ${theme.palette.grey[100]}, ${theme.palette.warning.light}aa)`,
          })}
        >
          <CardHeader
            title={
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Box
                  sx={(theme) => ({
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    bgcolor: theme.palette.mode === 'dark' ? `${theme.palette.warning.dark}99` : theme.palette.warning.light,
                    color: theme.palette.mode === 'dark' ? theme.palette.warning.light : theme.palette.warning.dark,
                  })}
                >
                  <PowerSettingsNewIcon sx={{ fontSize: 36 }} aria-hidden />
                </Box>
                <Box>
                  <Typography variant="h6">Maintenance mode</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Suppress patient & clinician workspaces while patching integrations.
                  </Typography>
                </Box>
              </Box>
            }
          />
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                px: 2.5,
                py: 2,
                boxShadow: (theme) => (theme.palette.mode === 'dark' ? undefined : `inset 0 0 0 1px ${theme.palette.warning.light}`),
              }}
            >
              <Typography id="maint-toggle-desc" sx={{ typography: 'body1', flex: '1 1 220px', lineHeight: 1.6 }}>
                {maintenanceActive ? 'MediCare+ is cloaked · show splash only' : 'System operational · kiosk traffic allowed'}
              </Typography>
              <Switch
                id="maint-toggle"
                checked={maintenanceActive}
                color="success"
                inputProps={{ 'aria-labelledby': 'maint-toggle-desc' }}
                onChange={(_, next) => void syncMaintenance(next)}
              />
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={(theme) => ({ borderColor: `${theme.palette.primary.dark}26`, boxShadow: `0 12px 28px ${theme.palette.primary.main}22` })}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'success.contrastText',
                  }}
                >
                  <StorageIcon sx={{ fontSize: 36 }} aria-hidden />
                </Box>
                <Box>
                  <Typography variant="h6">Synthetic sandbox reset</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Wipes IndexedDB payloads and replays seeded clinics, personas, prescriptions.
                  </Typography>
                </Box>
              </Box>
            }
          />
          <CardContent>
            <Box
              sx={(theme) => ({
                borderRadius: 3,
                border: 1,
                borderColor: theme.palette.mode === 'dark' ? `${theme.palette.success.dark}` : `${theme.palette.success.light}`,
                bgcolor: theme.palette.mode === 'dark' ? `${theme.palette.success.dark}44` : `${theme.palette.success.light}90`,
                px: 2.5,
                py: 4,
              })}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Perfect for onboarding workshops — reception queue, clinician verification, Omni notifications all snap back instantly.
              </Typography>
              <Button type="button" variant="contained" color="error" onClick={() => void handleResetSeed()}>
                Reset MediCare sandbox
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AnimatedPage>
  )
}
