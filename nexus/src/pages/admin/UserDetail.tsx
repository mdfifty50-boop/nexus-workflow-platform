import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Zap, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UserDetailData {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
  lastActive: string
  avatarUrl?: string
  businessProfile?: {
    industry: string
    companySize: string
    role: string
    priorities: string[]
  }
}

interface Conversation {
  id: string
  title: string
  messageCount: number
  createdAt: string
  messages?: { role: string; content: string; timestamp: string }[]
}

interface Workflow {
  id: string
  name: string
  status: 'active' | 'paused' | 'draft'
  executionCount: number
  lastExecuted: string
}

interface UserError {
  id: string
  workflowName: string
  error: string
  timestamp: string
}

const roleStyle: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  user: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserDetailData | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [errors, setErrors] = useState<UserError[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedConvo, setExpandedConvo] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      fetch(`/api/admin-analytics/users/${id}`, { headers: { 'Content-Type': 'application/json' } }).then((r) => r.json()),
      fetch(`/api/admin-analytics/users/${id}/conversations`, { headers: { 'Content-Type': 'application/json' } }).then((r) => r.json()),
      fetch(`/api/admin-analytics/users/${id}/workflows`, { headers: { 'Content-Type': 'application/json' } }).then((r) => r.json()),
      fetch(`/api/admin-analytics/users/${id}/errors`, { headers: { 'Content-Type': 'application/json' } }).then((r) => r.json()),
    ])
      .then(([userData, convoData, wfData, errData]) => {
        if (userData.success) setUser(userData.data)
        if (convoData.success) setConversations(convoData.data)
        if (wfData.success) setWorkflows(wfData.data)
        if (errData.success) setErrors(errData.data)
      })
      .catch((e) => console.error('Failed to load user detail:', e))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">User not found</p>
        <button
          onClick={() => navigate('/admin')}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Back to Admin
        </button>
      </div>
    )
  }

  const stats = [
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-cyan-400' },
    { label: 'Workflows', value: workflows.length, icon: Zap, color: 'text-purple-400' },
    { label: 'Executions', value: workflows.reduce((s, w) => s + w.executionCount, 0), icon: Zap, color: 'text-blue-400' },
    { label: 'Errors', value: errors.length, icon: AlertTriangle, color: 'text-red-400' },
  ]

  const wfStatusStyle: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    draft: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>

        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xl font-bold shrink-0">
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="text-slate-400">{user.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={roleStyle[user.role] || roleStyle.user}>{user.role}</Badge>
              <span className="text-xs text-slate-500">Joined {formatDate(user.createdAt)}</span>
              <span className="text-xs text-slate-500">Last active {formatDate(user.lastActive)}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Business Profile */}
        {user.businessProfile && (
          <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Business Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Industry:</span>
                <span className="text-white ml-2">{user.businessProfile.industry}</span>
              </div>
              <div>
                <span className="text-slate-400">Company Size:</span>
                <span className="text-white ml-2">{user.businessProfile.companySize}</span>
              </div>
              <div>
                <span className="text-slate-400">Role:</span>
                <span className="text-white ml-2">{user.businessProfile.role}</span>
              </div>
            </div>
            {user.businessProfile.priorities.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-slate-400">Priorities: </span>
                {user.businessProfile.priorities.map((p) => (
                  <Badge key={p} className="mr-1 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Conversations */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Conversations</h2>
          {conversations.length === 0 ? (
            <p className="text-slate-500 text-sm">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <div key={c.id} className="rounded-lg border border-white/10 bg-white/5">
                  <button
                    onClick={() => setExpandedConvo(expandedConvo === c.id ? null : c.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
                  >
                    {expandedConvo === c.id ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="flex-1 text-sm text-white truncate">{c.title}</span>
                    <span className="text-xs text-slate-500">{c.messageCount} messages</span>
                    <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                  </button>
                  {expandedConvo === c.id && c.messages && (
                    <div className="border-t border-white/5 p-4 space-y-3 max-h-80 overflow-y-auto">
                      {c.messages.map((m, i) => (
                        <div key={i} className={`text-sm ${m.role === 'user' ? 'text-cyan-300' : 'text-slate-300'}`}>
                          <span className="font-medium">{m.role === 'user' ? 'User' : 'Nexus'}:</span>{' '}
                          {m.content}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Workflows */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Workflows</h2>
          {workflows.length === 0 ? (
            <p className="text-slate-500 text-sm">No workflows created</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Name</th>
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Executions</th>
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Last Executed</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((wf) => (
                    <tr key={wf.id} className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-white">{wf.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={wfStatusStyle[wf.status]}>{wf.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">{wf.executionCount}</td>
                      <td className="px-4 py-2.5 text-slate-400">{wf.lastExecuted ? formatDate(wf.lastExecuted) : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Errors */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Errors</h2>
          {errors.length === 0 ? (
            <p className="text-slate-500 text-sm">No errors recorded</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Workflow</th>
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Error</th>
                    <th className="px-4 py-2.5 text-left text-slate-400 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err) => (
                    <tr key={err.id} className="border-b border-white/5">
                      <td className="px-4 py-2.5 text-white">{err.workflowName}</td>
                      <td className="px-4 py-2.5 text-red-400 max-w-md truncate">{err.error}</td>
                      <td className="px-4 py-2.5 text-slate-400">{formatDate(err.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
