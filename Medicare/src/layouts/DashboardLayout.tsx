import { Link, useLocation, Outlet } from 'react-router-dom'
import { useState } from 'react'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import { useAuthStore } from '@/store'
import { getNavForRole } from '@/routes/roleRoutes'
import { getInitials } from '@/utils/cn'
import { DRAWER_WIDTH } from '@/theme/muiTheme'
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { GlobalSearch } from '@/components/layout/GlobalSearch'
import { OfflineIndicator } from '@/components/layout/OfflineIndicator'

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAuthStore()
  const location = useLocation()
  const nav = session ? getNavForRole(session.role) : []

  return (
    <List sx={{ px: 1, py: 2 }}>
      {nav.map((item) => {
        const active =
          location.pathname === item.href ||
          (item.href !== `/${session?.role}` && location.pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <ListItemButton
            key={item.href}
            component={Link}
            to={item.href}
            selected={active}
            onClick={onNavigate}
            sx={{
              mb: 0.5,
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={item.title} primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        )
      })}
    </List>
  )
}

export function DashboardLayout() {
  const { session, user, logout } = useAuthStore()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const crumbs = location.pathname.split('/').filter(Boolean)

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <LocalHospitalIcon color="primary" />
        <Typography variant="h6" fontWeight={700} color="primary.dark">
          MediCare+
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <NavList onNavigate={() => setMobileOpen(false)} />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <OfflineIndicator />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Breadcrumbs
            sx={{ color: 'rgba(255,255,255,0.7)', flex: 1, display: { xs: 'none', sm: 'flex' } }}
            aria-label="breadcrumb"
          >
            {crumbs.map((c, i) => (
              <Typography
                key={i}
                color={i === crumbs.length - 1 ? 'inherit' : 'rgba(255,255,255,0.7)'}
                sx={{ textTransform: 'capitalize', fontSize: 14 }}
              >
                {c.replace(/-/g, ' ')}
              </Typography>
            ))}
          </Breadcrumbs>

          <Button
            color="inherit"
            startIcon={<SearchIcon />}
            onClick={() => setSearchOpen(true)}
            sx={{ display: { xs: 'none', sm: 'flex' }, textTransform: 'none' }}
          >
            Search
          </Button>
          <IconButton color="inherit" onClick={() => setSearchOpen(true)} sx={{ display: { sm: 'none' } }}>
            <SearchIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => setCommandOpen(true)} title="Cmd+K">
            <KeyboardIcon />
          </IconButton>
          <NotificationDropdown />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, pl: 1, borderLeft: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <Avatar src={user?.avatar} sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
              {getInitials(user?.name ?? 'U')}
            </Avatar>
            <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
              <Typography variant="body2" fontWeight={500} lineHeight={1.2}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ textTransform: 'capitalize', opacity: 0.8 }}>
                {session?.role}
              </Typography>
            </Box>
            <Button color="inherit" size="small" onClick={logout} sx={{ textTransform: 'none' }}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </Box>
  )
}
