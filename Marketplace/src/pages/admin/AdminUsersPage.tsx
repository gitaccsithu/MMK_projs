import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserPlus, Pencil, Trash2 } from 'lucide-react'
import type { User, UserRole } from '@/types'
import * as api from '@/services/mockApi'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnimatedPage } from '@/components/shared/AnimatedPage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'customer' as UserRole,
    phone: '',
  })

  const reload = useCallback(async () => {
    setUsers(await api.getUsers())
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [search, users])

  function openCreate() {
    setEditUser(null)
    setForm({ name: '', email: '', password: 'password123', role: 'customer', phone: '' })
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone,
    })
    setDialogOpen(true)
  }

  async function saveUser() {
    if (editUser) {
      const updates: Partial<User> = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
      }
      if (form.password.trim()) updates.password = form.password.trim()
      const res = await api.updateUser(editUser.id, updates)
      if (res.error) toast.error(res.error)
      else {
        toast.success('User updated')
        setDialogOpen(false)
        reload()
      }
    } else {
      const res = await api.createUser({
        email: form.email.trim(),
        password: form.password.trim(),
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim(),
      })
      if (res.error) toast.error(res.error)
      else {
        toast.success('User created')
        setDialogOpen(false)
        reload()
      }
    }
  }

  async function remove(user: User) {
    const ok = window.confirm(`Permanently remove ${user.email}? Demo accounts can be regenerated via reset seed.`)
    if (!ok) return
    const res = await api.deleteUser(user.id)
    if (res.error) toast.error(res.error)
    else {
      toast.success('User removed')
      reload()
    }
  }

  return (
    <AnimatedPage>
      <PageHeader title="People directory" description="Provision roles, intervene on dormant accounts, and keep identity hygiene tight.">
        <Button type="button" onClick={openCreate} className="gap-2">
          <UserPlus className="h-4 w-4" /> Add operator
        </Button>
      </PageHeader>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <Input
              placeholder="Filter by email, phone, role…"
              className="max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Badge variant="outline">{filtered.length} visible</Badge>
          </div>
          <ScrollArea className="h-[min(70vh,640px)]">
            <table className="w-full caption-bottom text-sm">
              <thead className="sticky top-0 z-[1] border-b bg-card text-left font-medium">
                <tr>
                  <th className="p-4">User</th>
                  <th className="hidden md:table-cell p-4">Role</th>
                  <th className="hidden xl:table-cell p-4">Phone</th>
                  <th className="hidden xl:table-cell p-4">Since</th>
                  <th className="hidden lg:table-cell p-4">Loyalty</th>
                  <th className="p-4 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-background">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="p-4">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="hidden md:table-cell p-4 capitalize">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                    </td>
                    <td className="hidden xl:table-cell p-4 text-muted-foreground">{u.phone}</td>
                    <td className="hidden xl:table-cell p-4 text-muted-foreground">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="hidden lg:table-cell p-4">{u.loyaltyPoints.toLocaleString()} pts</td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <Button type="button" variant="outline" size="icon" aria-label={`Edit ${u.name}`} onClick={() => openEdit(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="ml-2"
                        aria-label={`Remove ${u.name}`}
                        onClick={() => remove(u)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? 'Edit user profile' : 'Create account'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="adm-name">Name</Label>
              <Input
                id="adm-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adm-email">Email</Label>
              <Input
                id="adm-email"
                type="email"
                disabled={Boolean(editUser)}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adm-pw">{editUser ? 'New password (leave blank)' : 'Password'}</Label>
              <Input
                id="adm-pw"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(r) => setForm({ ...form, role: r as UserRole })}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="adm-phone">Phone</Label>
              <Input id="adm-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => saveUser()} disabled={!form.name.trim() || !form.email.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  )
}
