import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import GppGoodIcon from '@mui/icons-material/GppGood'
import CircularProgress from '@mui/material/CircularProgress'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import * as api from '@/services/mockApi'
import type { Message, UserRole } from '@/types'
import { useAuthStore } from '@/store'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

type ThreadPreview = {
  counterpartId: string
  counterpartName: string
  counterpartRole?: UserRole
  lastBody: string
  lastAt: string
}

function markInboundRead(counterpartId: string, userId: string) {
  const data = api.getAppDataSync()
  let changed = false
  data.messages.forEach((m) => {
    if (m.senderId === counterpartId && m.receiverId === userId && !m.read) {
      m.read = true
      changed = true
    }
  })
  if (changed) api.saveAppDataSync(data)
}

export function MessagesPage() {
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [composer, setComposer] = useState('')
  const [composerTyping, setComposerTyping] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [names, setNames] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!user?.id) return
    const list = await api.getMessages(user.id)
    setItems(list.sort((a, b) => parseISO(a.createdAt).getTime() - parseISO(b.createdAt).getTime()))
  }, [user?.id])

  useEffect(() => {
    async function bootstrap() {
      if (!user?.id) {
        setLoading(false)
        return
      }
      setLoading(true)
      await load()
      setLoading(false)
    }
    void bootstrap()
  }, [load, user?.id])

  useEffect(() => {
    async function hydrateNames(ids: string[]) {
      const next: Record<string, string> = {}
      await Promise.all(
        ids.map(async (id) => {
          const u = await api.getUserById(id)
          next[id] = u?.name ?? 'Care teammate'
        })
      )
      setNames(next)
    }
    const uniq = [...new Set(items.flatMap((m) => [m.senderId, m.receiverId]))]
    void hydrateNames(uniq)
  }, [items])

  const threads: ThreadPreview[] = useMemo(() => {
    if (!user?.id) return []
    const map = new Map<string, Message>()
    for (const msg of [...items].sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())) {
      const counterpart = msg.senderId === user.id ? msg.receiverId : msg.senderId
      if (!map.has(counterpart)) map.set(counterpart, msg)
    }
    return [...map.entries()].map(([counterpartId, latest]) => {
      const counterpartUser = api.getAppDataSync().users.find((u) => u.id === counterpartId)
      return {
        counterpartId,
        counterpartName: names[counterpartId] ?? 'Care teammate',
        counterpartRole: counterpartUser?.role,
        lastBody: latest.content,
        lastAt: latest.createdAt,
      }
    })
  }, [items, names, user?.id])

  const activeMsgs = useMemo(() => {
    if (!activeId || !user?.id) return []
    return items.filter((m) => m.senderId === activeId || m.receiverId === activeId)
  }, [activeId, items, user?.id])

  useEffect(() => {
    if (!user?.id || !activeId) return
    markInboundRead(activeId, user.id)
    void load()
  }, [activeId, load, user?.id])

  useEffect(() => {
    if (!composer.trim()) {
      setComposerTyping(false)
      return
    }
    setComposerTyping(true)
    const t = window.setTimeout(() => setComposerTyping(false), 1100)
    return () => window.clearTimeout(t)
  }, [composer])

  useEffect(() => {
    if (!activeId) return
    let alive = true
    let handle: ReturnType<typeof window.setTimeout> | undefined
    const ping = () => {
      handle = window.setTimeout(() => {
        if (!alive) return
        setPeerTyping(true)
        window.setTimeout(() => setPeerTyping(false), 1300)
        ping()
      }, 7600 + Math.random() * 3200)
    }
    ping()
    return () => {
      alive = false
      if (handle) window.clearTimeout(handle)
    }
  }, [activeId])

  async function attachMockFile() {
    const blob = new Blob(['HIPAA-friendly mock envelope'], { type: 'application/pdf' })
    const buf = await blob.arrayBuffer()
    const bytes = String.fromCharCode(...new Uint8Array(buf.slice(0, 48)))
    const b64 = typeof btoa !== 'undefined' ? btoa(bytes) : ''
    toast.success('Attachment staged', { description: `${b64.length} chars (preview)` })
    return `mock://${encodeURIComponent(composer.trim() || 'document.pdf')}#${b64.slice(0, 12)}`
  }

  const send = async (withAttach: boolean) => {
    if (!user?.id || !activeId) {
      toast.error('Pick someone to chat with.')
      return
    }
    if (!composer.trim() && !withAttach) return
    const attachment = withAttach ? await attachMockFile() : undefined
    const res = await api.sendMessage({
      senderId: user.id,
      receiverId: activeId,
      content: composer.trim() || 'Shared a document',
      ...(attachment ? { attachment } : {}),
    })
    if (res.error) {
      toast.error(res.error)
      return
    }
    setComposer('')
    await load()
  }

  if (!user) {
    return (
      <AnimatedPage>
        <PageHeader title="Messages" description="Secure threads require authentication." />
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage>
      <Stack spacing={2}>
        <PageHeader title="Secure messages" description="MediCare+ threads are encrypted-at-rest (mock) with read receipts & attachments.">
          <Chip variant="outlined" size="small" icon={<GppGoodIcon sx={{ color: 'success.main' }} />} label="SOC2-style mock posture" />
        </PageHeader>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' }, gap: 2 }}>
          <AnimatedCard>
            <Card variant="outlined" sx={{ height: '100%', borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardContent sx={{ p: 0 }}>
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : threads.length === 0 ? (
                  <EmptyState title="No conversations" description="When care teams ping you they land here instantly." />
                ) : (
                  <Box sx={{ height: 540, overflow: 'auto' }}>
                    {threads.map((t) => (
                      <Box
                        key={t.counterpartId}
                        component="button"
                        type="button"
                        onClick={() => setActiveId(t.counterpartId)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          width: '100%',
                          p: 2,
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: 0,
                          borderBottom: 1,
                          borderColor: 'divider',
                          bgcolor: activeId === t.counterpartId ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Avatar sx={{ width: 40, height: 40, border: 1, borderColor: 'success.light' }}>
                          {initials(t.counterpartName)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                            <Typography noWrap sx={{ flex: 1, fontWeight: 600 }}>
                              {t.counterpartName}
                            </Typography>
                            {t.counterpartRole === 'doctor' && <Chip label="Clinician" size="small" />}
                          </Box>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                            {t.lastBody}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                            {format(parseISO(t.lastAt), 'MMM d · p')}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 540, borderColor: 'rgba(6, 78, 59, 0.15)' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 1.5, p: 2 }}>
                {activeId ? (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                      <Avatar sx={{ width: 48, height: 48, border: 1, borderColor: 'success.light' }}>{initials(names[activeId] ?? '?')}</Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{names[activeId] ?? 'Peer'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Typing intelligence sim enabled
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1, overflow: 'auto', borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'action.hover', p: 1.5 }}>
                      <Stack spacing={2}>
                        {activeMsgs.map((m) => {
                          const outbound = m.senderId === user.id
                          const readBadge = outbound && m.read
                          return (
                            <Box key={m.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: outbound ? 'flex-end' : 'flex-start', gap: 0.5 }}>
                              <Box
                                sx={{
                                  maxWidth: '80%',
                                  borderRadius: 4,
                                  px: 1.5,
                                  py: 1,
                                  typography: 'body2',
                                  boxShadow: 1,
                                  ...(outbound
                                    ? { borderBottomRightRadius: 0, bgcolor: 'primary.main', color: 'primary.contrastText' }
                                    : { borderBottomLeftRadius: 0, bgcolor: 'background.paper' }),
                                }}
                              >
                                <Typography variant="body2" color="inherit">
                                  {m.content}
                                </Typography>
                                {m.attachment && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 1,
                                      mt: 1,
                                      borderRadius: 2,
                                      bgcolor: 'rgba(0,0,0,0.15)',
                                      px: 1.5,
                                      py: 1,
                                      typography: 'caption',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    <AttachFileIcon sx={{ fontSize: 16 }} />
                                    <span>{m.attachment.replace('mock://', '').slice(0, 24)} …</span>
                                  </Box>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, px: 1, typography: 'caption', fontSize: 10, color: 'text.secondary' }}>
                                <span>{format(parseISO(m.createdAt), 'p')}</span>
                                {readBadge ? (
                                  <Chip label="Seen" size="small" color="success" />
                                ) : outbound ? (
                                  <span>Delivered · mock</span>
                                ) : null}
                              </Box>
                            </Box>
                          )
                        })}
                        {(composerTyping || peerTyping) && (
                          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, color: 'text.secondary', typography: 'caption' }}>
                            <CircularProgress size={18} sx={{ color: 'success.main' }} />
                            Clinician drafting a reply…
                          </Box>
                        )}
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
                      <Button type="button" variant="outlined" aria-label="Mock attachment" onClick={() => void send(true)} sx={{ minWidth: 48 }}>
                        <AttachFileIcon />
                      </Button>
                      <TextField
                        fullWidth
                        size="small"
                        value={composer}
                        placeholder="HIPAA-aligned note"
                        onChange={(e) => setComposer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void send(false)
                        }}
                      />
                      <Button type="button" variant="contained" sx={{ flexShrink: 0 }} onClick={() => void send(false)}>
                        Send
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', typography: 'body2' }}>
                    Pick a clinician or coordinator on the left.
                  </Box>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>
        </Box>
      </Stack>
    </AnimatedPage>
  )
}

function SkeletonRow() {
  return <Skeleton variant="rectangular" height={56} sx={{ mx: 2, my: 1.5, borderRadius: 1 }} />
}

function initials(name: string) {
  const parts = name.split(' ')
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || '?'
}
