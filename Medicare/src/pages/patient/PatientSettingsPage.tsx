import { useEffect, useState } from 'react'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LanguageIcon from '@mui/icons-material/Language'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import { useAuthStore, useSettingsStore } from '@/store'
import type { User, AppSettings } from '@/types'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'

export function PatientSettingsPage() {
  const user = useAuthStore((s) => s.user)
  const hydrate = useAuthStore((s) => s.hydrate)
  const { theme, setTheme, language, setLanguage } = useSettingsStore()
  const [prefs, setPrefs] = useState<User['notificationPrefs'] | null>(user?.notificationPrefs ?? null)

  useEffect(() => {
    setPrefs(user?.notificationPrefs ?? null)
  }, [user?.notificationPrefs])

  useEffect(() => {
    applyThemeClass(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyThemeClass('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const syncPrefsUi = async (partial: Partial<User['notificationPrefs']>) => {
    if (!user?.id) return
    const latest = await api.getUserById(user.id)
    if (!latest) return
    await api.updateUser(user.id, { notificationPrefs: { ...latest.notificationPrefs, ...partial } })
    await hydrate()
    const refreshed = await api.getUserById(user.id)
    if (refreshed?.notificationPrefs) setPrefs(refreshed.notificationPrefs)
    toast.success('Communication preferences patched')
  }

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Patient settings" description="Theme, multilingual mock rails, HIPAA-friendly notification knobs." />

        <AnimatedCard>
          <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
            <CardHeader
              avatar={<DarkModeIcon color="success" />}
              title="Appearance"
              subheader="Select how MediCare+ tints emerald surfaces locally."
            />
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {(
                  [
                    { id: 'system' as const, label: 'System', caption: 'Respect OS dusk/dawn curves' },
                    { id: 'light' as const, label: 'Radiant clinic', caption: 'Bright exam lighting' },
                    { id: 'dark' as const, label: 'Night shift', caption: 'Low glare reading' },
                  ] as const
                ).map((opt) => (
                  <Card
                    key={opt.id}
                    component="button"
                    type="button"
                    onClick={() => {
                      setTheme(opt.id)
                      applyThemeClass(opt.id)
                      toast.success(`${opt.label} palette`)
                    }}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      cursor: 'pointer',
                      textAlign: 'left',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: theme === opt.id ? (t) => (t.palette.mode === 'dark' ? 'rgba(16,185,129,0.12)' : 'rgba(236,253,245,1)') : 'transparent',
                      borderColor: theme === opt.id ? 'success.main' : 'divider',
                      '&:hover': { boxShadow: 2 },
                      font: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{opt.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {opt.caption}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
            <CardHeader
              avatar={<LanguageIcon color="success" />}
              title="Language mockup"
              subheader="Switch staged copy bundles between EN + MM UI rails."
            />
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'flex-end' } }}>
                <FormControl fullWidth sx={{ flex: 1 }}>
                  <InputLabel id="locale-label">Locale</InputLabel>
                  <Select
                    labelId="locale-label"
                    label="Locale"
                    value={language}
                    onChange={(e) => {
                      const lang = e.target.value as 'en' | 'mm'
                      setLanguage(lang)
                      toast.success(lang === 'en' ? 'Locale → English UX lab' : 'Locale → မြန်မာမူကြမ်း')
                    }}
                  >
                    <MenuItem value="en">English clinical copy</MenuItem>
                    <MenuItem value="mm">မြန်မာဘာသာ အစမ်းကြည့်ခြင်း</MenuItem>
                  </Select>
                </FormControl>
                <Chip
                  sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, height: 40, px: 1 }}
                  variant="outlined"
                  label={language === 'en' ? 'LTR · Inter' : 'Myanmar glyphs · staged'}
                />
              </Stack>
            </CardContent>
          </Card>
        </AnimatedCard>

        <AnimatedCard>
          <Card variant="outlined" sx={{ borderColor: 'rgba(6, 78, 59, 0.15)' }}>
            <CardHeader
              avatar={<SmartphoneIcon color="success" />}
              title="Notification channels"
              subheader="Push + SMS ladders mirror account-level consent."
            />
            <CardContent>
              <Stack spacing={2}>
                {prefs && user && (
                  <>
                    <ChannelRow label="Email visits" hint="appointment PDFs · lab drops" checked={prefs.email} onChange={(v) => void syncPrefsUi({ email: v })} />
                    <ChannelRow label="SMS nudges" hint="OTP + clinic arrival" checked={prefs.sms} onChange={(v) => void syncPrefsUi({ sms: v })} />
                    <ChannelRow label="Care mobile push" hint="native shell integration" checked={prefs.push} onChange={(v) => void syncPrefsUi({ push: v })} />
                    <ChannelRow label="Business WhatsApp" hint="sandbox Business API mock" checked={prefs.whatsapp} onChange={(v) => void syncPrefsUi({ whatsapp: v })} />
                  </>
                )}
                {!user?.notificationPrefs && (
                  <Typography variant="body2" color="text.secondary">
                    Authenticate to hydrate communication rails.
                  </Typography>
                )}
                <Button type="button" variant="outlined" fullWidth onClick={() => toast.success('Reminder cadence audited (stub)')}>
                  Audit notification trail
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </AnimatedCard>
      </Stack>
    </AnimatedPage>
  )
}

function applyThemeClass(next: AppSettings['theme']) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (next === 'dark') {
    root.classList.add('dark')
    return
  }
  if (next === 'light') {
    root.classList.remove('dark')
    return
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  root.classList.toggle('dark', prefersDark)
}

function ChannelRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <Box sx={{ borderRadius: 3, border: 1, borderColor: 'divider', bgcolor: 'action.hover', p: 2 }}>
      <FormControlLabel
        sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
        control={<Switch checked={checked} onChange={(_, v) => onChange(v)} sx={{ mr: 1 }} />}
        label={
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{label}</Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {hint}
              </Typography>
            )}
          </Box>
        }
      />
    </Box>
  )
}
