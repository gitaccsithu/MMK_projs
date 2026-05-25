import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, MessageSquare, BookOpen, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-indigo-400" />
          <span className="text-lg font-semibold">InsightFlow AI</span>
        </div>
        <Link to="/login"><Button>Sign in</Button></Link>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight md:text-6xl">
          Internal AI knowledge base for <span className="gradient-text">enterprise teams</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Upload documents, search company knowledge, and chat with an AI assistant powered by RAG and OpenRouter.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-10 flex justify-center gap-4">
          <Link to="/login"><Button size="lg">Get started <ArrowRight className="h-4 w-4" /></Button></Link>
        </motion.div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: MessageSquare, title: 'AI Chat', desc: 'RAG-powered answers with citations' },
          { icon: BookOpen, title: 'Knowledge Base', desc: 'Browse policies and internal docs' },
          { icon: BarChart3, title: 'Analytics', desc: 'Monitor usage and ingestion' },
        ].map(({ icon: Icon, title, desc }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="glass rounded-xl p-6">
            <Icon className="mb-3 h-8 w-8 text-indigo-400" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  )
}
