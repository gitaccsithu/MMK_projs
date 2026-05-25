import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ChatPage } from '@/pages/ChatPage'
import { KnowledgePage } from '@/pages/KnowledgePage'
import { KnowledgeDetailPage } from '@/pages/KnowledgeDetailPage'
import { SearchPage } from '@/pages/SearchPage'
import { IngestPage } from '@/pages/IngestPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { PromptsPage } from '@/pages/PromptsPage'
import { MonitoringPage } from '@/pages/MonitoringPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useAuthStore, useChatStore, useKnowledgeStore, useAppStore, useSettingsStore } from '@/store'
import { fetchHealth } from '@/services/agentApi'

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrate)
  const hydrateChat = useChatStore((s) => s.hydrate)
  const hydrateKnowledge = useKnowledgeStore((s) => s.hydrate)
  const hydrateApp = useAppStore((s) => s.hydrate)
  const { theme, setAgentOnline } = useSettingsStore()

  useEffect(() => {
    hydrateAuth()
    hydrateChat()
    hydrateKnowledge()
    hydrateApp()
    document.documentElement.classList.toggle('dark', theme === 'dark')
    fetchHealth()
      .then(() => setAgentOnline(true))
      .catch(() => setAgentOnline(false))
  }, [hydrateAuth, hydrateChat, hydrateKnowledge, hydrateApp, theme, setAgentOnline])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:id" element={<ChatPage />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="knowledge/:slug" element={<KnowledgeDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="ingest" element={<IngestPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="prompts" element={<PromptsPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
