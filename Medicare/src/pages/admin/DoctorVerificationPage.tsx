import { useEffect, useState } from 'react'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Doctor, VerificationStatus } from '@/types'

const STATUS_THEME: Partial<Record<VerificationStatus, 'default' | 'secondary' | 'warning'>> = {
  pending: 'secondary',
  needs_info: 'warning',
}

type Row = Doctor & { displayName?: string }

export function DoctorVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [active, setActive] = useState<Row | null>(null)
  const [notes, setNotes] = useState('')

  async function refresh() {
    setLoading(true)
    const docs = await api.getDoctors()
    const enriched = await Promise.all(
      docs.map(async (d) => ({
        ...d,
        displayName: (await api.getUserById(d.userId))?.name ?? 'Doctor',
      }))
    )
    setRows(enriched.filter((x) => x.verificationStatus !== 'approved'))
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function decide(doctorId: string, status: VerificationStatus, adminNote?: string) {
    await api.updateDoctorVerification(doctorId, status, adminNote)
    toast.success(`Marked ${status.replace(/_/g, ' ')}`)
    await refresh()
  }

  async function pingMoreInfo(docId: string) {
    await api.updateDoctorVerification(docId, 'needs_info', 'Additional documentation requested.')
    toast.message('Reminder queued (sandbox)')
    await refresh()
  }

  return (
    <AnimatedPage>
      <PageHeader
        title="Clinician verification"
        description="Annotate dossiers before enabling patient-facing MediCare concierge slots."
      />
      <Stack spacing={3}>
        {loading &&
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rounded" sx={{ height: 160 }} />
          ))}
        {!loading &&
          rows.map((doc) => (
            <Card key={doc.id} variant="outlined" sx={(theme) => ({ overflow: 'hidden', borderColor: `${theme.palette.primary.dark}26` })}>
              <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 3, lg: 4 }, justifyContent: 'space-between' }}>
                <Box sx={{ flex: '1', minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1} useFlexGap>
                    <Typography variant="h6" component="h2">
                      {doc.displayName}
                    </Typography>
                    <Chip
                      size="small"
                      label={doc.verificationStatus}
                      color={doc.verificationStatus === 'needs_info' ? 'warning' : 'default'}
                      variant={STATUS_THEME[doc.verificationStatus] ? 'filled' : 'outlined'}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '1rem' }}>
                    Specialty ·{' '}
                    <Typography component="span" color="text.primary" fontWeight={600}>
                      {doc.specialty}
                    </Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                    {doc.bio}
                  </Typography>
                </Box>
                <Stack spacing={1} sx={{ flexShrink: 0, alignItems: { xs: 'stretch', lg: 'flex-end' } }}>
                  <Button size="small" variant="outlined" startIcon={<FactCheckIcon />} onClick={() => void pingMoreInfo(doc.id)}>
                    Request documentation
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => setActive(doc)}>
                    License mockup
                  </Button>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => void decide(doc.id, 'approved', notes)}>
                      Approve
                    </Button>
                    <Button size="small" variant="contained" color="error" onClick={() => void decide(doc.id, 'rejected')}>
                      Reject
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
      </Stack>
      {!loading && rows.length === 0 && (
        <Card variant="outlined" sx={{ borderColor: 'success.light', p: 7, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Every dossier verified — MediCare auditors can regenerate seed data anytime.
          </Typography>
        </Card>
      )}

      <Dialog open={Boolean(active)} onClose={() => setActive(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon aria-hidden fontSize="small" />
          License mock preview
        </DialogTitle>
        <DialogContent>
          {active && (
            <>
              <Box
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                  px: 2.5,
                  py: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  lineHeight: 1.6,
                }}
              >
                <div>Board · MediCare Accreditation Council · Class II</div>
                <div>License · {active.licenseNumber}</div>
                <div>Renewal · 2027-06-02</div>
              </Box>
              <TextField
                id="admin-notes-doctor"
                label="Administrative memo"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button variant="outlined" onClick={() => setActive(null)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void decide(active!.id, 'approved', notes)}>
            Commit approval
          </Button>
        </DialogActions>
      </Dialog>
    </AnimatedPage>
  )
}
