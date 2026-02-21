import { useState, useMemo } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastActive: string
  workflowsCreated: number
}

interface UserTableProps {
  users: AdminUser[]
  loading?: boolean
  onUserClick: (userId: string) => void
}

type SortKey = 'name' | 'email' | 'role' | 'status' | 'createdAt' | 'lastActive' | 'workflowsCreated'

const statusStyle: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const roleStyle: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  user: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function UserTable({ users, loading, onUserClick }: UserTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('lastActive')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
    list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return list
  }, [users, search, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const headers: { label: string; key: SortKey }[] = [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Role', key: 'role' },
    { label: 'Status', key: 'status' },
    { label: 'Joined', key: 'createdAt' },
    { label: 'Last Active', key: 'lastActive' },
    { label: 'Workflows', key: 'workflowsCreated' },
  ]

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  className="px-4 py-3 text-left text-slate-400 font-medium cursor-pointer select-none hover:text-white transition-colors"
                >
                  <span className="inline-flex items-center gap-1">
                    {h.label}
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onUserClick(user.id)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-slate-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge className={roleStyle[user.role]}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusStyle[user.status]}>{user.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(user.lastActive)}</td>
                  <td className="px-4 py-3 text-white">{user.workflowsCreated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
