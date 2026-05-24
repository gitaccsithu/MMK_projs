import { useAppStore } from '@/store/index'
import { useAuthStore } from '@/store/index'
import BarChartIcon from '@mui/icons-material/BarChart'
import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import DashboardIcon from '@mui/icons-material/Dashboard'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import GroupsIcon from '@mui/icons-material/Groups'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import LogoutIcon from '@mui/icons-material/Logout'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import ScheduleIcon from '@mui/icons-material/Schedule'
import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { SvgIconComponent } from '@mui/icons-material'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'

const NAV: { label: string; to: string; Icon: SvgIconComponent }[] = [
  { label: 'Dashboard', to: '/doctor', Icon: DashboardIcon },
  { label: 'Appointments', to: '/doctor/appointments', Icon: EventAvailableIcon },
  { label: 'Consultation', to: '/doctor/consultation', Icon: MedicalServicesIcon },
  { label: 'Patients', to: '/doctor/patients', Icon: GroupsIcon },
  { label: 'Prescriptions', to: '/doctor/prescriptions', Icon: LocalPharmacyIcon },
  { label: 'Availability', to: '/doctor/availability', Icon: ScheduleIcon },
  { label: 'Analytics', to: '/doctor/analytics', Icon: BarChartIcon },
  { label: 'Messages', to: '/doctor/messages', Icon: ChatBubbleOutlinedIcon },
  { label: 'Settings', to: '/doctor/settings', Icon: SettingsIcon },
]

/** MediCare+ doctor shell — layout, auth gate, and navigation. */
export function DoctorWorkspaceLayout() {
  const navigate = useNavigate()
  const { session, user, hydrate, logout, login, clearError } = useAuthStore()
  const initialize = useAppStore((s) => s.initialize)
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState('doctor@example.com')
  const [password, setPassword] = useState('password123')
  const [busy, setBusy] = useState(false)

  const { doctor, loading: doctorLoading, reload } = useDoctorWorkspace(session?.userId)

  useEffect(() => {
    void (async () => {
      await initialize().catch(() => {})
      await hydrate()
      setReady(true)
    })()
  }, [hydrate, initialize])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    clearError()
    const ok = await login(email, password, false)
    setBusy(false)
    if (!ok) return
    navigate('/doctor', { replace: true })
    await reload()
  }

  if (!ready || !session || !user) {
    return (
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          overflow: 'hidden',
          background: (theme) =>
            `radial-gradient(ellipse at top, ${theme.palette.action.hover} 0%, transparent 58%)`,
        }}
      >
        <Stack
          component="main"
          spacing={3}
          sx={{ mx: 'auto', maxWidth: 440, px: 2, py: 10, alignItems: 'center' }}
        >
          <Stack spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                boxShadow: 3,
              }}
            >
              <MonitorHeartIcon sx={{ fontSize: 32 }} aria-hidden />
            </Box>
            <Typography variant="h5" align="center" sx={{ fontWeight: 600 }}>
              MediCare+ Doctor Portal
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Clinical workspace — demo sign-in for physician tools.
            </Typography>
          </Stack>
          <Paper elevation={2} sx={{ width: '100%', p: 3, borderRadius: 2 }}>
            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={2}>
                <TextField id="doctor-email" label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" fullWidth />
                <TextField
                  id="doctor-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  fullWidth
                />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={busy}>
                  {busy ? 'Signing in…' : 'Continue to clinic'}
                </Button>
                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                  Demo Doctor: doctor@example.com / password123
                </Typography>
              </Stack>
            </Box>
          </Paper>
        </Stack>
      </Box>
    )
  }

  if (user.role !== 'doctor') {
    return (
      <Stack spacing={2} sx={{ px: 2, minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Paper sx={{ px: 2, py: 1, borderLeft: 4, borderColor: 'error.main', bgcolor: 'error.light' }}>
          <Typography color="error" variant="body2">
            This portal is restricted to clinician accounts.
          </Typography>
        </Paper>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 420 }}>
          Signed in as {user.name} ({user.role}).
        </Typography>
        <Button variant="outlined" onClick={() => logout()}>
          Sign out
        </Button>
      </Stack>
    )
  }

  const doctorLabel =
    doctor === null ? (doctorLoading ? 'Loading clinician…' : 'Profile not synced') : `Roster · ${doctor.specialty}`
  const displayName = user.name.includes('Dr.') ? user.name : `Dr. ${user.name}`

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', py: 2 }}>
      <Box sx={{ px: 2.5, pb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              borderRadius: 2,
              px: 1.5,
              py: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: 2,
            }}
          >
            <MedicalServicesIcon />
          </Box>
          <Box>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 700, letterSpacing: 2, display: 'block' }}>
              MediCare+
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Clinical workspace
            </Typography>
          </Box>
        </Stack>
        <Typography variant="caption" sx={{ mt: 3, fontWeight: 700, display: 'block' }} noWrap title={displayName}>
          {displayName}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {doctorLabel}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        <Stack component="nav" spacing={0.25}>
          {NAV.map(({ label, to, Icon }) => (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              end={to === '/doctor'}
              sx={{
                borderRadius: 1,
                '&.active': {
                  borderLeft: 4,
                  borderColor: 'primary.main',
                  bgcolor: (theme) => `${theme.palette.primary.main}22`,
                  fontWeight: 600,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={label} slotProps={{ primary: { variant: 'body2' } }} />
            </ListItemButton>
          ))}
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ px: 1, pt: 2 }}>
        <Button fullWidth variant="text" color="inherit" startIcon={<LogoutIcon />} onClick={() => logout()} sx={{ justifyContent: 'flex-start' }}>
          Sign out
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.success.dark}33 100%)`
            : `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.success.light}44 100%)`,
      }}
    >
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 224,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: 224, boxSizing: 'border-box', borderRight: 1, borderColor: 'success.light', bgcolor: 'background.paper' },
          }}
          open
        >
          {drawer}
        </Drawer>

        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            elevation={0}
            square
            sx={{
              display: { xs: 'block', md: 'none' },
              position: 'sticky',
              top: 0,
              zIndex: (t) => t.zIndex.drawer + 1,
              borderBottom: 1,
              borderColor: 'success.light',
              px: 2,
              py: 1.5,
              bgcolor: (t) => `${t.palette.background.default}ee`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box sx={{ borderRadius: 1, p: 1, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <MedicalServicesIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {doctorLabel}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', pb: 0.5 }}>
              {NAV.map(({ label, to, Icon }) => (
                <Button
                  key={to}
                  component={NavLink}
                  to={to}
                  end={to === '/doctor'}
                  size="small"
                  variant="outlined"
                  startIcon={<Icon sx={{ fontSize: 14 }} />}
                  sx={{
                    flexShrink: 0,
                    borderRadius: 99,
                    textTransform: 'none',
                    fontSize: 12,
                    '&.active': {
                      borderColor: 'primary.main',
                      bgcolor: (theme) => `${theme.palette.primary.main}22`,
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </Paper>

          <Box sx={{ px: { xs: 2, md: 5, lg: 7 }, py: 4, maxWidth: 1280, mx: 'auto' }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
