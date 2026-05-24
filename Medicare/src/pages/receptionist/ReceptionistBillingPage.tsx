import { useEffect, useMemo, useState } from 'react'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import SearchIcon from '@mui/icons-material/Search'
import TuneIcon from '@mui/icons-material/Tune'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { parseISO } from 'date-fns'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import * as api from '@/services/mockApi'
import type { Invoice, PaymentStatus } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/cn'

function statusChip(status: PaymentStatus): { label: PaymentStatus; color: 'success' | 'default' | 'warning' | 'error' | 'primary' } {
  switch (status) {
    case 'paid':
      return { label: status, color: 'primary' }
    case 'pending':
      return { label: status, color: 'default' }
    case 'partial':
      return { label: status, color: 'warning' }
    case 'failed':
      return { label: status, color: 'error' }
    default:
      return { label: status, color: 'default' }
  }
}

export function ReceptionistBillingPage() {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [dialogOpenId, setDialogOpenId] = useState<string | null>(null)
  const [rows, setRows] = useState<(Invoice & { patientName?: string })[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<PaymentStatus | 'any'>('any')

  async function hydrate() {
    setLoading(true)
    const invoices = await api.getInvoices()
    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const pt = await api.getPatientById(inv.patientId)
        const u = pt ? await api.getUserById(pt.userId) : undefined
        return { ...inv, patientName: u?.name ?? 'Patient' }
      })
    )
    enriched.sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime())
    setRows(enriched.slice(0, 120))
    setLoading(false)
  }

  useEffect(() => {
    void hydrate()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((inv) => {
      const passesStatus = status === 'any' || inv.status === status
      const text = `${inv.patientName ?? ''} ${inv.id}`.toLowerCase()
      const passesSearch = q ? text.includes(q) : true
      return passesStatus && passesSearch
    })
  }, [rows, query, status])

  const summary = useMemo(() => {
    const paid = rows.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
    const owing = rows.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.patientPay, 0)
    return { paid, owing }
  }, [rows])

  async function markPaid(inv: Invoice) {
    await api.updateInvoice(inv.id, { status: 'paid', method: 'card' })
    await hydrate()
  }

  const onStatusChange = (e: SelectChangeEvent<string>) =>
    setStatus(e.target.value as PaymentStatus | 'any')

  return (
    <AnimatedPage>
      <PageHeader
        title="Reception billing"
        description="Copays flowing through the kiosk, partial payments surfaced for friendly follow-ups."
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          mb: 4,
        }}
      >
        <Card
          sx={{
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.55),
            bgcolor: alpha(theme.palette.action.hover, 0.4),
          }}
        >
          <CardHeader sx={{ pb: 0.5 }}
            title={<Typography variant="caption" color="text.secondary">Collected (filtered window)</Typography>}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.dark' }}>
              {formatCurrency(summary.paid)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Totals roll up nightly in RCM mocks.
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            border: '1px solid',
            borderColor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.5 : 0.55),
            bgcolor: alpha(theme.palette.warning.light, theme.palette.mode === 'dark' ? 0.12 : 0.18),
          }}
        >
          <CardHeader sx={{ pb: 0.5 }}
            title={<Typography variant="caption" color="text.secondary">Patient-responsibility still open</Typography>}
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.dark' }}>
              {formatCurrency(summary.owing)}
            </Typography>
          </CardContent>
          <CardContent sx={{ pt: 0, display: 'flex', gap: 2 }}>
            <TuneIcon sx={{ mt: 0.5, flexShrink: 0, fontSize: 22, color: 'warning.main' }} aria-hidden />
            <Typography variant="body2" color="text.secondary">
              Encourage payment prior to clinician hand-off for shorter dwell times.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          mb: 3,
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ position: 'relative', flex: 1, maxWidth: { md: 480 } }}>
          <SearchIcon
            sx={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'primary.main',
              pointerEvents: 'none',
              zIndex: 1,
              fontSize: 20,
            }}
            aria-hidden
          />
          <TextField
            aria-label="Filter invoices"
            placeholder="Patient name · invoice reference…"
            fullWidth
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              htmlInput: { 'aria-label': 'Filter invoices' },
            }}
            sx={{ '& .MuiOutlinedInput-root': { pl: 4.75, py: 0.5 }, borderRadius: 1 }}
          />
        </Box>
        <FormControl sx={{ minWidth: { xs: '100%', md: 224 } }}>
          <InputLabel id="status-filter-label">Payment status</InputLabel>
          <Select labelId="status-filter-label" label="Payment status" value={status} onChange={onStatusChange}>
            <MenuItem value="any">Every status</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="partial">Partial</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card
        elevation={2}
        sx={{ border: '1px solid', borderColor: alpha(theme.palette.primary.dark, 0.25), overflow: 'hidden' }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLongIcon sx={{ color: 'teal' }} />
              <Typography sx={{ fontWeight: 600 }}>Invoice runway</Typography>
            </Box>
          }
        />
        <CardContent sx={{ px: 0, pb: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 3 }}>
              {[1, 2, 3].map((k) => (
                <Skeleton key={k} variant="rounded" sx={{ height: 64 }} />
              ))}
            </Box>
          ) : (
            <Box sx={{ maxHeight: 'min(70vh, 760px)', overflow: 'auto' }}>
              <Table sx={{ minWidth: 720 }} size="small">
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.35 : 0.08) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                      Patient
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                      Created
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                      Patient pay
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.dark' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((invoice) => {
                    const chip = statusChip(invoice.status)
                    return (
                      <TableRow key={invoice.id} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                        <TableCell>{invoice.patientName}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{formatDateTime(invoice.createdAt)}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.patientPay)}</TableCell>
                        <TableCell>
                          <Chip label={chip.label} color={chip.color} size="small" variant="filled" />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
                            <Button size="small" variant="outlined" onClick={() => setDialogOpenId(invoice.id)}>
                              Lines
                            </Button>
                            <Dialog
                              open={dialogOpenId === invoice.id}
                              onClose={() => setDialogOpenId(null)}
                              maxWidth="sm"
                              fullWidth
                            >
                              <DialogTitle>{invoice.id}</DialogTitle>
                              <DialogContent>
                                <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
                                  {(invoice.lineItems ?? []).map((line, idx) => (
                                    <Box
                                      component="li"
                                      key={`${invoice.id}_${idx}`}
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        borderRadius: 1,
                                        bgcolor: (t) => alpha(t.palette.action.hover, 0.5),
                                        px: 2,
                                        py: 1,
                                        mb: 1,
                                        fontSize: 14,
                                      }}
                                    >
                                      <span>{line.description}</span>
                                      <Typography component="span" sx={{ fontWeight: 700 }}>
                                        {formatCurrency(line.amount)}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              </DialogContent>
                            </Dialog>
                            {invoice.status !== 'paid' && (
                              <Button size="small" variant="contained" onClick={() => void markPaid(invoice)}>
                                Mark collected
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
          {!loading && filtered.length === 0 && (
            <Typography sx={{ px: 3, py: 8, textAlign: 'center' }} variant="body2" color="text.secondary">
              Nothing matches filters yet.
            </Typography>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  )
}
