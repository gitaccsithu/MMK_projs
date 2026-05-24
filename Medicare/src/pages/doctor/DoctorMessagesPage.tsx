import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import type { Appointment, Message, Patient, User } from '@/types'
import * as api from '@/services/mockApi'
import { useAuthStore } from '@/store/index'
import { formatDistanceToNow } from 'date-fns'
import { useDoctorWorkspace } from '@/pages/doctor/useDoctorWorkspace'
import SendIcon from '@mui/icons-material/Send'
import Avatar from '@mui/material/Avatar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

/** Threaded PHI-aware chat façade (demo transport). */
export function DoctorMessagesPage() {
  const userId = useAuthStore((s) => s.session?.userId)
  const { doctor, loading: wsLoad } = useDoctorWorkspace(userId)
  const [busy, setBusy] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activePatientUserId, setActivePatientUserId] = useState<string | undefined>()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const loadThreads = async () => {
    if (!userId) return
    setBusy(true)
    try {
      const [appts, patt, usr, msgs] = await Promise.all([
        doctor ? api.getAppointments(userId, 'doctor') : [],
        api.getPatients(),
        api.getUsers(),
        api.getMessages(userId),
      ])
      const ordered = msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      setAppointments(appts as Appointment[])
      setPatients(patt)
      setUsers(usr)
      setMessages(ordered)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadThreads()
  }, [doctor, userId])

  const peerOptions = useMemo(() => {
    const map = new Map<string, User>()
    const patientSeen = new Set<string>()
    appointments.forEach((a) => patientSeen.add(a.patientId))
    patients.forEach((p) => {
      if (!patientSeen.has(p.id)) return
      const u = users.find((x) => x.id === p.userId)
      if (u?.role === 'patient') map.set(u.id, u)
    })
    messages.forEach((msg) => {
      const counterpart = msg.senderId === userId ? msg.receiverId : msg.senderId
      const u = users.find((x) => x.id === counterpart)
      if (u?.role === 'patient') map.set(u.id, u)
    })
    return [...map.values()]
  }, [appointments, messages, patients, userId, users])

  useEffect(() => {
    if (!activePatientUserId && peerOptions[0]) setActivePatientUserId(peerOptions[0].id)
  }, [activePatientUserId, peerOptions])

  const thread = messages.filter((m) =>
    userId &&
    activePatientUserId &&
    ((m.senderId === userId && m.receiverId === activePatientUserId) ||
      (m.receiverId === userId && m.senderId === activePatientUserId))
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, activePatientUserId])

  const sendChat = async () => {
    if (!userId || !activePatientUserId || !draft.trim()) return
    setBusy(true)
    const res = await api.sendMessage({
      senderId: userId,
      receiverId: activePatientUserId,
      content: draft.trim(),
    })
    setBusy(false)
    if (res.error) toast.error(res.error)
    else {
      setDraft('')
      await loadThreads()
      toast.success('Message delivered.')
    }
  }

  if (!wsLoad && doctor === null) {
    return (
      <AnimatedPage>
        <EmptyState title="Messaging unavailable" description="No clinician context." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <PageHeader title="Patient messages" description="Quick coordination without leaving the clinician shell." />
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' },
        }}
      >
        <Card variant="outlined" sx={{ borderColor: 'success.light' }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ maxHeight: 560, overflow: 'auto' }}>
              <Divider />
              {peerOptions.map((peer) => {
                const unread = messages.filter((m) => m.receiverId === userId && m.senderId === peer.id && !m.read).length
                const scoped = messages.filter(
                  (m) =>
                    (m.senderId === peer.id && m.receiverId === userId) || (m.receiverId === peer.id && m.senderId === userId)
                )
                const last =
                  [...scoped].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                const active = activePatientUserId === peer.id
                return (
                  <Box key={peer.id} component="button" type="button" onClick={() => setActivePatientUserId(peer.id)} sx={{ all: 'unset', width: '100%', cursor: 'pointer' }}>
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderLeft: 4,
                        borderColor: active ? 'primary.main' : 'transparent',
                        bgcolor: active ? (theme) => `${theme.palette.primary.main}22` : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Avatar src={peer.avatar ?? undefined} sx={{ width: 44, height: 44, border: 1, borderColor: 'primary.light' }}>
                        {peer.name.slice(0, 2)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Typography noWrap sx={{ fontWeight: 700 }}>
                            {peer.name}
                          </Typography>
                          {unread > 0 && <Chip label={unread} size="small" color="primary" sx={{ height: 20, minWidth: 28, '& .MuiChip-label': { px: 0.75, fontSize: 10 } }} />}
                        </Stack>
                        {last ? (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {last.content}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                            No chatter yet · say hello
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                )
              })}
              {peerOptions.length === 0 && <EmptyState title="Quiet inbox" description="Booked patients populate here automatically." />}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderColor: 'success.light', boxShadow: 1 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0, p: 0, height: 560 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'success.light', px: 3, py: 2 }}>
              {activePatientUserId ? (
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Badge overlap="circular" variant="dot" color="success">
                    <Avatar src={users.find((u) => u.id === activePatientUserId)?.avatar} sx={{ width: 48, height: 48, border: 1, borderColor: 'success.light' }}>
                      {(users.find((u) => u.id === activePatientUserId)?.name ?? 'Pt').slice(0, 2)}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{users.find((u) => u.id === activePatientUserId)?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Secure clinician ↔ patient corridor
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a peer to collaborate.
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
              <Stack spacing={2} sx={{ pb: 2 }}>
                {thread.map((msg) => {
                  const outbound = msg.senderId === userId
                  return (
                    <Stack key={msg.id} direction="row" sx={{ justifyContent: outbound ? 'flex-end' : 'flex-start' }}>
                      <Box
                        sx={{
                          maxWidth: '80%',
                          borderRadius: 4,
                          border: 1,
                          px: 2,
                          py: 1.5,
                          boxShadow: 1,
                          borderColor: outbound ? 'primary.main' : 'divider',
                          bgcolor: outbound ? 'primary.main' : 'action.hover',
                          color: outbound ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: outbound ? 0.85 : 0.75 }}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                    </Stack>
                  )
                })}
                <div ref={bottomRef} />
              </Stack>
            </Box>
            <Divider />
            <Box sx={{ px: 3, py: 2 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end' }}>
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  placeholder="Clinical updates, clarification, reassurance…"
                  value={draft}
                  disabled={busy}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button variant="contained" size="large" disabled={busy || !draft.trim()} sx={{ alignSelf: 'stretch' }} startIcon={<SendIcon />} onClick={() => void sendChat()}>
                  Send
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </AnimatedPage>
  )
}
