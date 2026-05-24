import type { ReactNode } from 'react'
import { useState } from 'react'
import MailIcon from '@mui/icons-material/Mail'
import SmartphoneIcon from '@mui/icons-material/Smartphone'
import WavesIcon from '@mui/icons-material/Waves'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import { toast } from 'sonner'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'

const emailTpl = `
Subject: {{title}}
Hi {{name}},

{{{body_text}}}

— MediCare Clinical Concierge`

const smsTpl = `{{{body_trim}}}

Replay STOP to mute`

export function AdminNotificationsPage() {
  const [broadcast, setBroadcast] = useState('New lobby protocol — ETA boards live at kiosks 2–5.')
  const [emailPreview, setEmailPreview] = useState({
    subject: 'Important update from MediCare+',
    name: '{{patient_name}}',
  })
  const [smsDigest, setSmsDigest] = useState(broadcast)

  function queueBroadcast() {
    toast.success(`Broadcast queued to ${(2841).toLocaleString()} recipients (sandbox)`)
  }

  return (
    <AnimatedPage>
      <PageHeader title="Audience studio" description="Draft lifecycle journeys with HIPAA-minded previews — nothing leaves localhost." />

      <Box
        sx={{
          display: 'grid',
          gap: 5,
          gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <Card
          variant="outlined"
          sx={(theme) => ({
            borderColor: `${theme.palette.primary.dark}26`,
            background: theme.palette.mode === 'dark' ? `${theme.palette.primary.dark}33` : `${theme.palette.primary.light}18`,
          })}
        >
          <CardHeader
            title={
              <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                <WavesIcon aria-hidden sx={{ color: 'primary.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6">Omnichannel broadcast mock</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Journey authoring with SES-like + SMS payloads
                  </Typography>
                </Box>
              </Stack>
            }
          />
          <CardContent>
            <Stack spacing={2}>
              <TextField multiline rows={8} value={broadcast} onChange={(e) => setBroadcast(e.target.value)} fullWidth aria-label="Broadcast body" />
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <LabelledInput
                  icon={<MailIcon sx={{ color: 'success.main', fontSize: 18 }} />}
                  label="Subject"
                  value={emailPreview.subject}
                  onChange={(value) =>
                    setEmailPreview((draft) => ({ ...draft, subject: value }))
                  }
                />
                <LabelledInput
                  icon={<SmartphoneIcon sx={{ color: 'success.main', fontSize: 18 }} />}
                  label="SMS digest variant"
                  value={smsDigest}
                  onChange={setSmsDigest}
                />
                <LabelledInput
                  icon={<MailIcon sx={{ opacity: 0, fontSize: 18 }} />}
                  label="Friendly token"
                  value={emailPreview.name}
                  onChange={(value) =>
                    setEmailPreview((draft) => ({ ...draft, name: value }))
                  }
                />
              </Box>
              <Button
                size="large"
                variant="contained"
                color="success"
                sx={{ mt: 1, boxShadow: 3 }}
                type="button"
                onClick={() => queueBroadcast()}
              >
                Queue broadcast rehearsal
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <RenderedPreviews broadcast={broadcast} emailPreview={emailPreview} smsDigest={smsDigest} />
      </Box>
    </AnimatedPage>
  )
}

function RenderedPreviews({
  broadcast,
  emailPreview,
  smsDigest,
}: {
  broadcast: string
  emailPreview: { subject: string; name: string }
  smsDigest: string
}) {
  const [tab, setTab] = useState<'email' | 'sms'>('email')

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden', boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}40` }}>
      <CardHeader title="Rendered previews" subheader="WYSIWYG fidelity only — payloads never egress this demo workspace" />
      <CardContent>
        <Tabs
          value={tab}
          onChange={(_, v: 'email' | 'sms') => setTab(v)}
          variant="fullWidth"
          sx={{
            mb: 3,
            minHeight: 48,
            '& .MuiTab-root': {
              borderRadius: 2,
            },
            bgcolor: 'action.hover',
            borderRadius: 2,
            p: 0.5,
          }}
        >
          <Tab label="Secure email shell" value="email" />
          <Tab label="SMS canvas" value="sms" />
        </Tabs>

        {tab === 'email' && (
          <Box
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              px: 4,
              py: 3,
              boxShadow: 1,
              typography: 'body1',
              lineHeight: 1.7,
            }}
          >
            <Typography variant="caption" sx={{ letterSpacing: '0.35em', textTransform: 'uppercase' }} color="text.secondary">
              MediCare+ · Clinical Cloud
            </Typography>
            <Typography variant="h5" sx={{ mt: 4, fontWeight: 600 }}>
              {emailPreview.subject}
            </Typography>
            <Box
              component="pre"
              sx={{
                mt: 3,
                fontFamily: 'inherit',
                whiteSpace: 'pre-wrap',
                color: 'text.secondary',
                m: 0,
              }}
            >
              {emailTpl
                .replace('{{title}}', emailPreview.subject)
                .replace('{{name}}', emailPreview.name)
                .replace('{{{body_text}}}', broadcast)}
            </Box>
          </Box>
        )}

        {tab === 'sms' && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ maxWidth: 360, width: '100%', borderRadius: '2.75rem', border: '12px solid', borderColor: 'success.dark', bgcolor: 'action.hover', px: 2, py: 3 }}>
              <Typography align="center" variant="caption" color="text.secondary">
                Messaging preview · carrier mock
              </Typography>
              <Box
                component="pre"
                sx={{
                  mt: 5,
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                  borderRadius: '1.65rem',
                  bgcolor: 'background.paper',
                  p: 3,
                  fontSize: '15px',
                  boxShadow: (theme) => `inset 0 0 12px ${theme.palette.success.main}40`,
                  m: 0,
                }}
              >
                {smsTpl.replace('{{{body_trim}}}', smsDigest.slice(0, 240))}
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function LabelledInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  icon: ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
      <Typography component="label" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontWeight: 500 }}>
        {icon}
        {label}
      </Typography>
      <TextField size="small" value={value} onChange={(e) => onChange(e.target.value)} fullWidth />
    </Box>
  )
}
