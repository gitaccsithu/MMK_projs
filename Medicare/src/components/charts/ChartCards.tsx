import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'

const COLORS = ['#00796B', '#4DB6AC', '#80CBC4', '#26A69A', '#00897B', '#004D40']
const CHART_COLOR = '#00796B'

interface ChartCardProps {
  title: string
  description?: string
  data: Record<string, unknown>[]
  loading?: boolean
  height?: number
}

export function LineChartCard({ title, description, data, dataKey, xKey = 'name', loading, height = 280 }: ChartCardProps & { dataKey: string; xKey?: string }) {
  return (
    <Card>
      <CardHeader title={title} subheader={description} titleTypographyProps={{ variant: 'subtitle1' }} />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" height={height} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke={CHART_COLOR} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function AreaChartCard({ title, description, data, dataKey, xKey = 'name', loading, height = 280 }: ChartCardProps & { dataKey: string; xKey?: string }) {
  return (
    <Card>
      <CardHeader title={title} subheader={description} titleTypographyProps={{ variant: 'subtitle1' }} />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" height={height} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey={dataKey} stroke={CHART_COLOR} fill={CHART_COLOR} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function BarChartCard({ title, description, data, dataKey, xKey = 'name', loading, height = 280 }: ChartCardProps & { dataKey: string; xKey?: string }) {
  return (
    <Card>
      <CardHeader title={title} subheader={description} titleTypographyProps={{ variant: 'subtitle1' }} />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" height={height} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={dataKey} fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function PieChartCard({ title, description, data, dataKey, nameKey = 'name', loading, height = 280 }: ChartCardProps & { dataKey: string; nameKey?: string }) {
  return (
    <Card>
      <CardHeader title={title} subheader={description} titleTypographyProps={{ variant: 'subtitle1' }} />
      <CardContent>
        {loading ? (
          <Skeleton variant="rectangular" height={height} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={90} label>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function StatCard({ title, value, change, icon }: { title: string; value: string; change?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h5" fontWeight={600} sx={{ mt: 0.5 }}>{value}</Typography>
            {change && (
              <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                {change}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'primary.main', color: 'primary.contrastText', opacity: 0.9 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
