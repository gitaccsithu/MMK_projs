import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import PresentToAllIcon from '@mui/icons-material/PresentToAll'
import VideocamIcon from '@mui/icons-material/Videocam'
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store'

type Quality = 'excellent' | 'good' | 'fair'

export function TeleconsultationPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const [seconds, setSeconds] = useState(0)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [quality, setQuality] = useState<Quality>('excellent')
  const [draft, setDraft] = useState('')
  const [chat, setChat] = useState<{ id: string; who: 'me' | 'host'; body: string; at: number }[]>([])
  const [meta, setMeta] = useState<{ reason?: string; when?: string; doctor?: string } | null>(null)
  const ticking = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    ticking.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => {
      if (ticking.current) clearInterval(ticking.current)
    }
  }, [])

  useEffect(() => {
    const mq = window.setInterval(() => {
      setQuality((prev) => (prev === 'excellent' ? 'good' : prev === 'good' ? 'fair' : 'excellent'))
    }, 6200)
    return () => window.clearInterval(mq)
  }, [])

  useEffect(() => {
    if (!user || !id) return
    const uid = user.id
    const apptId = id
    async function hydrate() {
      const patientRow = await api.getPatientByUserId(uid)
      const appt = await api.getAppointmentById(apptId)
      if (!appt || appt.patientId !== patientRow?.id) return
      const doc = await api.getDoctorById(appt.doctorId)
      const nu = doc ? await api.getUserById(doc.userId) : undefined
      setMeta({
        reason: appt.reason,
        when: format(parseISO(appt.scheduledAt), 'PP · p'),
        doctor: nu?.name,
      })
    }
    void hydrate()
  }, [id, user])

  const timerLabel = useMemo(() => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0')
    const s = String(seconds % 60).padStart(2, '0')
    return `${m}:${s}`
  }, [seconds])

  const send = () => {
    if (!draft.trim()) return
    setChat((c) => [...c, { id: crypto.randomUUID(), who: 'me', body: draft.trim(), at: Date.now() }])
    setDraft('')
    window.setTimeout(() => {
      setChat((c) => [
        ...c,
        { id: crypto.randomUUID(), who: 'host', body: mockReply(), at: Date.now() },
      ])
    }, 900)
  }

  return (
    <AnimatedPage>
      <Stack spacing={2}>
        <PageHeader
          title="Teleconsult session"
          description={meta?.when ? `${meta.reason} · ${meta.when}` : 'Connecting to clinician queue.'}
        >
          <Chip label={meta?.doctor ?? 'Unknown host'} variant="outlined" size="small" />
          <Button variant="outlined" size="small" component={Link} to="/patient/appointments">
            Leave lobby
          </Button>
        </PageHeader>

        <GridLike>
          <AnimatedCard>
            <Box
              sx={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'rgba(6, 78, 59, 0.35)',
                bgcolor: '#000',
                boxShadow: 6,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: 'linear-gradient(135deg, #022c22 0%, #065f46 45%, #0f766e 100%)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '12%',
                    borderRadius: '2rem',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25), transparent 65%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: '18%',
                    borderRadius: '30%',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    bgcolor: 'rgba(0,0,0,0.55)',
                    boxShadow: 'inset 0 0 80px rgba(16,185,129,0.25)',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 24,
                    left: 24,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: '999px',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    px: 2,
                    py: 1,
                    color: '#fff',
                    typography: 'caption',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.light', animation: 'pulse 2s infinite' }} />
                  Live mock feed · no camera access
                </Box>
                <Typography
                  sx={{
                    position: 'absolute',
                    right: 24,
                    top: 24,
                    borderRadius: '999px',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    px: 2,
                    py: 1,
                    fontFamily: 'monospace',
                    color: 'success.light',
                  }}
                >
                  {timerLabel}
                </Typography>
                <ConnectionPill quality={quality} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  borderTop: '1px solid rgba(6, 78, 59, 0.4)',
                  bgcolor: 'rgba(0,0,0,0.8)',
                  px: 2,
                  py: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <ControlButton active={micOn} onClick={() => setMicOn((v) => !v)} label="Mic" onIcon={<MicIcon />} offIcon={<MicOffIcon />} />
                  <ControlButton
                    active={camOn}
                    onClick={() => setCamOn((v) => !v)}
                    label="Camera"
                    onIcon={<VideocamIcon />}
                    offIcon={<VideocamIcon />}
                    dim
                  />
                  <ControlButton
                    active={sharing}
                    onClick={() => setSharing((v) => !v)}
                    label="Share"
                    onIcon={<PresentToAllIcon />}
                    offIcon={<PresentToAllIcon />}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(209, 250, 229, 0.75)' }}>
                  256-bit mock transport · latency 38ms
                </Typography>
              </Box>
            </Box>
          </AnimatedCard>

          <AnimatedCard>
            <Card variant="outlined" sx={{ height: '100%', borderColor: 'rgba(6, 78, 59, 0.2)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, minHeight: { xs: 400, lg: 'min(70vh, 640px)' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Private chat
                  </Typography>
                  <Chip label="E2E mock" size="small" />
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    borderRadius: 2,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    p: 1.5,
                  }}
                >
                  <Stack spacing={1.5}>
                    {chat.map((m) => (
                      <Box key={m.id} sx={{ display: 'flex', flexDirection: 'row', justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start' }}>
                        <Box
                          sx={{
                            maxWidth: '85%',
                            borderRadius: 4,
                            px: 1.5,
                            py: 1,
                            typography: 'body2',
                            bgcolor: m.who === 'me' ? 'primary.main' : 'background.paper',
                            color: m.who === 'me' ? 'primary.contrastText' : 'text.primary',
                            boxShadow: m.who === 'me' ? 0 : 1,
                          }}
                        >
                          {m.body}
                        </Box>
                      </Box>
                    ))}
                    {chat.length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
                        Say hi to your clinician.
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type securely…"
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                  />
                  <Button type="button" variant="contained" onClick={send} sx={{ flexShrink: 0 }}>
                    Send
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </AnimatedCard>
        </GridLike>
      </Stack>
    </AnimatedPage>
  )
}

function GridLike({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
      }}
    >
      {children}
    </Box>
  )
}

function ControlButton({
  active,
  onClick,
  label,
  onIcon,
  offIcon,
  dim,
}: {
  active: boolean
  onClick: () => void
  label: string
  onIcon: ReactNode
  offIcon: ReactNode
  dim?: boolean
}) {
  return (
    <IconButton
      type="button"
      color={active ? 'primary' : 'default'}
      onClick={onClick}
      aria-pressed={active}
      title={label}
      sx={{
        bgcolor: active ? 'primary.main' : 'grey.700',
        color: '#fff',
        opacity: active ? 1 : 0.75,
        ...(dim && !active ? { filter: 'brightness(1.15)' } : {}),
        '&:hover': { bgcolor: active ? 'primary.dark' : 'grey.600' },
      }}
    >
      {active ? onIcon : offIcon}
    </IconButton>
  )
}

function ConnectionPill({ quality }: { quality: Quality }) {
  const label = quality === 'excellent' ? 'Ultra HD' : quality === 'good' ? 'HD' : 'SD boost'
  return (
    <Box
      sx={{
        position: 'absolute',
        left: '50%',
        top: 24,
        transform: 'translateX(-50%)',
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.25)',
        bgcolor: 'rgba(0,0,0,0.45)',
        px: 2,
        py: 1,
        typography: 'caption',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#fff',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, color: quality === 'fair' ? 'warning.light' : 'inherit' }}>
        {quality === 'fair' ? <WifiOffIcon sx={{ fontSize: 16 }} /> : <WifiIcon sx={{ fontSize: 16, animation: 'pulse 2s infinite' }} />}
        {label}
      </Box>
      <Box component="span" sx={{ borderRadius: '999px', bgcolor: 'rgba(255,255,255,0.15)', px: 1, py: 0.25, fontSize: 10 }}>
        {quality}
      </Box>
    </Box>
  )
}

function mockReply() {
  return ['Sounds good.', 'Monitoring vitals remotely.', 'We can prescribe after this visit.', 'Sharing screen noted.'][Math.floor(Math.random() * 4)]!
}
