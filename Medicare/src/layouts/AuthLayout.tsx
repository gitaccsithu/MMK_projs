import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        bgcolor: '#ECEFF1',
        backgroundImage: 'linear-gradient(180deg, #E0F2F1 0%, #ECEFF1 40%, #ECEFF1 100%)',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#004D40',
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        <LocalHospitalIcon sx={{ fontSize: 32, color: '#00796B' }} />
        <Typography variant="h5" fontWeight={700} color="#004D40">
          MediCare+
        </Typography>
      </Link>

      <Paper
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {children}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
        © 2026 MediCare+. Demo application.
      </Typography>
    </Box>
  )
}
