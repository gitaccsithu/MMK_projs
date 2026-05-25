import { create } from 'zustand'
import type { ChatMessage, Conversation, DocumentMeta, IngestionJob, PromptSettings, User } from '@insightflow/shared'
import { getItem, setItem } from '@/services/storageService'
import { KNOWLEDGE_CATALOG } from '@/data/knowledgeCatalog'
import { buildAnalytics } from '@/services/mockData'
import { DEFAULT_SYSTEM_PROMPT } from '@/data/defaultPrompt'

interface AuthState {
  user: User | null
  login: (email: string) => boolean
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (email) => {
    const users = getItem<User[]>('users', [])
    const fromDemo = [
      { id: 'u1', name: 'Alex Morgan', email: 'alex@insightflow.example.com', role: 'member' as const, department: 'Engineering' },
      { id: 'u2', name: 'Jordan Lee', email: 'admin@insightflow.example.com', role: 'admin' as const, department: 'IT' },
    ]
    const user = [...fromDemo, ...users].find((u) => u.email === email) ?? fromDemo[0]
    setItem('session', user)
    set({ user })
    return true
  },
  logout: () => {
    setItem('session', null)
    set({ user: null })
  },
  hydrate: () => set({ user: getItem<User | null>('session', null) }),
}))

interface SettingsState {
  theme: 'light' | 'dark'
  promptSettings: PromptSettings
  agentOnline: boolean
  toggleTheme: () => void
  setPromptSettings: (s: Partial<PromptSettings>) => void
  setAgentOnline: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: getItem<'light' | 'dark'>('theme', 'dark'),
  promptSettings: getItem<PromptSettings>('promptSettings', {
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 2000,
    topK: 5,
    model: 'openai/gpt-4o-mini',
  }),
  agentOnline: false,
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    set({ theme: next })
  },
  setPromptSettings: (s) => {
    const merged = { ...get().promptSettings, ...s }
    setItem('promptSettings', merged)
    set({ promptSettings: merged })
  },
  setAgentOnline: (v) => set({ agentOnline: v }),
}))

interface ChatState {
  conversations: Conversation[]
  messages: Record<string, ChatMessage[]>
  activeId: string | null
  createConversation: (title?: string) => string
  setActive: (id: string) => void
  addMessage: (convId: string, msg: ChatMessage) => void
  updateMessage: (convId: string, msgId: string, patch: Partial<ChatMessage>) => void
  renameConversation: (id: string, title: string) => void
  deleteConversation: (id: string) => void
  togglePin: (id: string) => void
  hydrate: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeId: null,
  createConversation: (title = 'New chat') => {
    const id = `conv_${Date.now()}`
    const conv: Conversation = {
      id,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    }
    const conversations = [conv, ...get().conversations]
    setItem('conversations', conversations)
    setItem(`messages:${id}`, [])
    set({ conversations, activeId: id, messages: { ...get().messages, [id]: [] } })
    return id
  },
  setActive: (id) => set({ activeId: id }),
  addMessage: (convId, msg) => {
    const messages = { ...get().messages, [convId]: [...(get().messages[convId] ?? []), msg] }
    const conversations = get().conversations.map((c) =>
      c.id === convId ? { ...c, updatedAt: new Date().toISOString(), messageCount: (messages[convId]?.length ?? 0) } : c,
    )
    setItem('conversations', conversations)
    setItem(`messages:${convId}`, messages[convId])
    set({ messages, conversations })
  },
  updateMessage: (convId, msgId, patch) => {
    const list = (get().messages[convId] ?? []).map((m) => (m.id === msgId ? { ...m, ...patch } : m))
    const messages = { ...get().messages, [convId]: list }
    setItem(`messages:${convId}`, list)
    set({ messages })
  },
  renameConversation: (id, title) => {
    const conversations = get().conversations.map((c) => (c.id === id ? { ...c, title } : c))
    setItem('conversations', conversations)
    set({ conversations })
  },
  deleteConversation: (id) => {
    const conversations = get().conversations.filter((c) => c.id !== id)
    const messages = { ...get().messages }
    delete messages[id]
    setItem('conversations', conversations)
    set({ conversations, messages, activeId: get().activeId === id ? null : get().activeId })
  },
  togglePin: (id) => {
    const conversations = get().conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    setItem('conversations', conversations)
    set({ conversations })
  },
  hydrate: () => {
    let conversations = getItem<Conversation[]>('conversations', [])
    const messages: Record<string, ChatMessage[]> = {}
    if (conversations.length === 0) {
      const seeds: { conv: Conversation; msgs: ChatMessage[] }[] = [
        {
          conv: {
            id: 'conv_seed_remote',
            title: 'Remote work policy',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            messageCount: 2,
            pinned: true,
          },
          msgs: [
            { id: 'msg_s1', role: 'user', content: 'How many days per week can I work remotely?', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
            { id: 'msg_s2', role: 'assistant', content: 'Per our remote work policy, eligible employees may work remotely up to 3 days per week with manager approval.', createdAt: new Date(Date.now() - 86400000 * 2 + 60000).toISOString(), citations: [{ docSlug: 'remote-work-policy', docTitle: 'Remote Work Policy', excerpt: 'Up to 3 days per week...' }] },
          ],
        },
        {
          conv: {
            id: 'conv_seed_security',
            title: 'Security incident reporting',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            messageCount: 2,
          },
          msgs: [
            { id: 'msg_s3', role: 'user', content: 'How do I report a security incident?', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
            { id: 'msg_s4', role: 'assistant', content: 'Report incidents immediately via #security-incidents on Slack or email security@insightflow.example.com. See the incident response playbook for severity levels.', createdAt: new Date(Date.now() - 86400000 * 5 + 60000).toISOString(), citations: [{ docSlug: 'incident-response', docTitle: 'Incident Response', excerpt: 'Report immediately...' }] },
          ],
        },
        {
          conv: {
            id: 'conv_seed_onboarding',
            title: 'New hire onboarding',
            createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
            messageCount: 2,
          },
          msgs: [
            { id: 'msg_s5', role: 'user', content: 'What should I complete in my first week?', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
            { id: 'msg_s6', role: 'assistant', content: 'Your first week includes IT setup, HR orientation, buddy intro, and reviewing the employee handbook and engineering guidelines.', createdAt: new Date(Date.now() - 86400000 * 10 + 60000).toISOString(), citations: [{ docSlug: 'onboarding-guide', docTitle: 'Onboarding Guide', excerpt: 'First week checklist...' }] },
          ],
        },
      ]
      for (const { conv, msgs } of seeds) {
        conversations.push(conv)
        messages[conv.id] = msgs
        setItem(`messages:${conv.id}`, msgs)
      }
      setItem('conversations', conversations)
    }
    for (const c of conversations) {
      if (!messages[c.id]) messages[c.id] = getItem<ChatMessage[]>(`messages:${c.id}`, [])
    }
    set({ conversations, messages, activeId: conversations[0]?.id ?? null })
  },
}))

interface KnowledgeState {
  documents: DocumentMeta[]
  favorites: string[]
  recentSearches: string[]
  toggleFavorite: (slug: string) => void
  addSearch: (q: string) => void
  hydrate: () => void
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: KNOWLEDGE_CATALOG,
  favorites: [],
  recentSearches: [],
  toggleFavorite: (slug) => {
    const favorites = get().favorites.includes(slug)
      ? get().favorites.filter((s) => s !== slug)
      : [...get().favorites, slug]
    setItem('favorites', favorites)
    set({ favorites })
  },
  addSearch: (q) => {
    const recentSearches = [q, ...get().recentSearches.filter((s) => s !== q)].slice(0, 10)
    setItem('recentSearches', recentSearches)
    set({ recentSearches })
  },
  hydrate: () =>
    set({
      favorites: getItem<string[]>('favorites', []),
      recentSearches: getItem<string[]>('recentSearches', []),
    }),
}))

interface AppState {
  ingestionJobs: IngestionJob[]
  analytics: ReturnType<typeof buildAnalytics>
  addJob: (job: IngestionJob) => void
  updateJob: (id: string, patch: Partial<IngestionJob>) => void
  hydrate: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  ingestionJobs: [],
  analytics: buildAnalytics(),
  addJob: (job) => {
    const ingestionJobs = [job, ...get().ingestionJobs]
    setItem('ingestionJobs', ingestionJobs)
    set({ ingestionJobs })
  },
  updateJob: (id, patch) => {
    const ingestionJobs = get().ingestionJobs.map((j) => (j.id === id ? { ...j, ...patch } : j))
    setItem('ingestionJobs', ingestionJobs)
    set({ ingestionJobs })
  },
  hydrate: () => set({ ingestionJobs: getItem<IngestionJob[]>('ingestionJobs', []) }),
}))
