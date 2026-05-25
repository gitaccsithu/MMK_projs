import { useState } from 'react'
import { useSettingsStore } from '@/store'
import { streamChat } from '@/services/agentApi'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DEFAULT_SYSTEM_PROMPT } from '@/data/defaultPrompt'

export function PromptsPage() {
  const { promptSettings, setPromptSettings } = useSettingsStore()
  const [testQ, setTestQ] = useState('What is our remote work policy?')
  const [testOut, setTestOut] = useState('')

  async function runTest() {
    setTestOut('')
    try {
      for await (const e of streamChat({
        message: testQ,
        settings: {
          systemPrompt: promptSettings.systemPrompt,
          temperature: promptSettings.temperature,
          maxTokens: promptSettings.maxTokens,
        },
        model: promptSettings.model,
      })) {
        if (e.type === 'token') setTestOut((o) => o + e.content)
      }
    } catch (err) {
      setTestOut(err instanceof Error ? err.message : 'Test failed')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Prompt Management</h1>
      <Card className="space-y-4">
        <div>
          <label className="text-sm font-medium">System prompt</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-sm font-mono dark:border-zinc-700 min-h-[200px]"
            value={promptSettings.systemPrompt}
            onChange={(e) => setPromptSettings({ systemPrompt: e.target.value })}
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPromptSettings({ systemPrompt: DEFAULT_SYSTEM_PROMPT })}>Reset default</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm">Temperature</label>
            <input type="range" min="0" max="1" step="0.1" value={promptSettings.temperature} onChange={(e) => setPromptSettings({ temperature: Number(e.target.value) })} className="w-full" />
            <span className="text-xs text-zinc-500">{promptSettings.temperature}</span>
          </div>
          <div>
            <label className="text-sm">Max tokens</label>
            <input type="number" value={promptSettings.maxTokens} onChange={(e) => setPromptSettings({ maxTokens: Number(e.target.value) })} className="w-full rounded border px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
          <div>
            <label className="text-sm">Retrieval top-K</label>
            <input type="number" value={promptSettings.topK} onChange={(e) => setPromptSettings({ topK: Number(e.target.value) })} className="w-full rounded border px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
          </div>
        </div>
        <div>
          <label className="text-sm">Model</label>
          <select value={promptSettings.model} onChange={(e) => setPromptSettings({ model: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
            <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
            <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
          </select>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold">Playground</h3>
        <input value={testQ} onChange={(e) => setTestQ(e.target.value)} className="mt-2 w-full rounded border px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" />
        <Button className="mt-2" onClick={runTest}>Run test</Button>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{testOut || '—'}</pre>
      </Card>
    </div>
  )
}
