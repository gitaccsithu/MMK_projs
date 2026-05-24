import { useCallback, useEffect, useMemo, useState } from 'react'
import { FolderTree, PencilLine, Trash2 } from 'lucide-react'
import type { ServiceCategory } from '@/types'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceCategory | null>(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    icon: '📁',
    description: '',
  })

  const reload = useCallback(async () => setCategories(await api.getCategories()), [])

  useEffect(() => {
    reload()
  }, [reload])

  const grouped = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories])

  function resetForm() {
    setForm({ name: '', slug: '', icon: '✨', description: '' })
  }

  function openCreate() {
    setEditing(null)
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(cat: ServiceCategory) {
    setEditing(cat)
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description })
    setDialogOpen(true)
  }

  async function save() {
    if (editing) {
      const res = await api.updateCategory(editing.id, form)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Category saved')
        setDialogOpen(false)
        reload()
      }
    } else {
      const res = await api.createCategory({
        ...form,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Category added')
        setDialogOpen(false)
        reload()
      }
    }
  }

  async function remove(cat: ServiceCategory) {
    const ok = window.confirm(`Archive ${cat.name}? This cannot undo linked services guard.`)
    if (!ok) return
    const res = await api.deleteCategory(cat.id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Category removed')
      reload()
    }
  }

  return (
    <AnimatedPage>
      <PageHeader title="Category taxonomy" description="Shape discovery navigation — mirrored across SEO slugs & AI ranking signals.">
        <Button type="button" className="gap-2" onClick={openCreate}>
          <FolderTree className="h-4 w-4" />
          Create category
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col justify-between rounded-2xl border bg-gradient-to-b from-muted/70 to-transparent p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-4xl leading-none">{cat.icon}</div>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      /{cat.slug}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                  <Badge variant="secondary" className="w-fit text-[11px]">
                    Legacy id <span className="font-mono ml-1">{cat.id}</span>
                  </Badge>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(cat)}>
                    <PencilLine className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => remove(cat)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit "${editing.name}"` : 'New category'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Slug (optional)</Label>
              <Input
                placeholder="auto from name when empty"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Emoji / glyph</Label>
              <Input value={form.icon} maxLength={4} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Description</Label>
              <textarea
                className="min-h-[92px] w-full resize-none rounded-lg border px-3 py-2 text-sm"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={!form.name.trim()} onClick={save}>
              Save taxonomy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
