import { useEffect, useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import * as api from '@/services/mockApi'
import type { VitalReading } from '@/types'
import { useAuthStore } from '@/store'
import { AnimatedCard, AnimatedPage } from '@/components/shared/AnimatedPage'
import { PageHeader } from '@/components/shared/PageHeader'
import { AreaChartCard, LineChartCard } from '@/components/charts/ChartCards'

export function HealthMetricsPage() {
  const user = useAuthStore((s) => s.user)
  const [vitals, setVitals] = useState<VitalReading[]>([])

  useEffect(() => {
    async function hydrate() {
      if (!user?.id) return
      const patient = await api.getPatientByUserId(user.id)
      setVitals(patient?.vitals ?? [])
    }
    void hydrate()
  }, [user?.id])

  const heart = useMemo(() => seriesFor(vitals, 'heart_rate', 'bpm'), [vitals])
  const glucose = useMemo(() => seriesFor(vitals, 'blood_sugar', 'mg'), [vitals])
  const weight = useMemo(() => seriesFor(vitals, 'weight', 'kg'), [vitals])
  const systolicBp = useMemo(() => bpSystolicSeries(vitals), [vitals])

  return (
    <AnimatedPage>
      <Stack spacing={3}>
        <PageHeader title="Health metrics" description="Recharts visualizations synthesized from biometric baselines." />

        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <AnimatedCard>
              <LineChartCard title="Heart rate cadence" description="Rolling 14 mornings · BPM" data={heart.points} dataKey="value" xKey="name" height={260} loading={false} />
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} lg={6}>
            <AnimatedCard>
              <AreaChartCard title="Blood glucose" description="Breakfast window · demo variance" data={glucose.points} dataKey="value" xKey="name" height={260} loading={false} />
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} lg={6}>
            <AnimatedCard>
              <AreaChartCard title="Weight stewardship" description="Posture-corrected scale feed" data={weight.points} dataKey="value" xKey="name" height={260} loading={false} />
            </AnimatedCard>
          </Grid>
          <Grid item xs={12} lg={6}>
            <AnimatedCard>
              <LineChartCard title="Systolic spotlight" description="Taken from seated BP cuffs" data={systolicBp.points} dataKey="value" xKey="name" height={260} loading={false} />
            </AnimatedCard>
          </Grid>
        </Grid>
      </Stack>
    </AnimatedPage>
  )
}

function numericFrom(vitals: VitalReading[], type: VitalReading['type']) {
  const latest = vitals.find((z) => z.type === type)
  const raw = latest?.value ?? '0'
  if (type === 'blood_pressure') {
    const [sys] = String(raw).split('/')
    return Number.parseFloat(sys ?? '118') || 118
  }
  return Number.parseFloat(String(raw)) || 72
}

function seriesFor(vitals: VitalReading[], type: VitalReading['type'], label: string) {
  const base = numericFrom(vitals, type)
  const points = [...Array(14)].map((_, i) => {
    const jitter = Math.sin(i * 0.6) * (type === 'weight' ? 0.05 : type === 'blood_sugar' ? 3 : type === 'heart_rate' ? 6 : 2)
    const drift = i * (type === 'blood_sugar' ? 1.8 : type === 'heart_rate' ? 2.6 : type === 'weight' ? 0.04 : 0.8)
    return {
      name: format(subDays(new Date(), 13 - i), 'MMM d'),
      value: Number((base + jitter + drift - (type === 'weight' ? 0.3 : 0)).toFixed(1)),
      unit: label,
    }
  })
  return { points }
}

function bpSystolicSeries(vitals: VitalReading[]) {
  const systolicBase = numericFrom(vitals, 'blood_pressure')
  const points = [...Array(14)].map((_, i) => ({
    name: format(subDays(new Date(), 13 - i), 'MMM d'),
    value: Math.round(systolicBase + Math.sin(i * 0.5) * 3 + i * 0.5),
    unit: 'mmHg systolic',
  }))
  return { points }
}
