import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import * as api from '@/services/mockApi'
import type { Service } from '@/types'
import { formatCurrency } from '@/utils/cn'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const navigate = useNavigate()

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }
    setLoading(true)
    api.getServices({ search: debouncedQuery }).then((services) => {
      setResults(services.slice(0, 8))
      setLoading(false)
    })
  }, [debouncedQuery])

  const select = (serviceId: string) => {
    navigate(`/customer/marketplace/${serviceId}`)
    onOpenChange(false)
    setQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search Services</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search services, vendors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {loading && <p className="py-4 text-center text-sm text-muted-foreground">Searching...</p>}
          {!loading && debouncedQuery && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No results found</p>
          )}
          {results.map((s) => (
            <button
              key={s.id}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-accent"
              onClick={() => select(s.id)}
            >
              <img src={s.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{s.title}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(s.packages[0].price)} · ★ {s.rating}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
