import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { AdminUsageStats } from '@/components/AdminUsageStats'
import { AdminAuditLog } from '@/components/AdminAuditLog'
import { FeatureFlags } from '@/components/FeatureFlags'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

// =============================================================================
// MOCK DATA - Replace with real API calls
// =============================================================================

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastActive: string
  workflowsCreated: number
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@nexus.app',
    name: 'Admin User',
    role: 'admin',
    status: 'active',
    createdAt: '2025-11-01',
    lastActive: '2026-01-12',
    workflowsCreated: 47,
  },
  {
    id: '2',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'user',
    status: 'active',
    createdAt: '2025-11-15',
    lastActive: '2026-01-11',
    workflowsCreated: 23,
  },
  {
    id: '3',
    email: 'sarah.smith@company.org',
    name: 'Sarah Smith',
    role: 'user',
    status: 'active',
    createdAt: '2025-12-01',
    lastActive: '2026-01-10',
    workflowsCreated: 15,
  },
  {
    id: '4',
    email: 'mike.johnson@team.io',
    name: 'Mike Johnson',
    role: 'viewer',
    status: 'inactive',
    createdAt: '2025-12-10',
    lastActive: '2025-12-28',
    workflowsCreated: 3,
  },
  {
    id: '5',
    email: 'pending@newuser.com',
    name: 'Pending User',
    role: 'user',
    status: 'pending',
    createdAt: '2026-01-10',
    lastActive: '-',
    workflowsCreated: 0,
  },
]

// =============================================================================
// ADMIN PAGE COMPONENT
// =============================================================================

export function Admin() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'users' | 'usage' | 'audit' | 'features'>('users')
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'user' | 'viewer'>('user')
  const [inviting, setInviting] = useState(false)

  // Filter users based on search and filters
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)))
    }
  }

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    ))
    toast.success('Role updated', `User role changed to ${newRole}`)
  }

  const handleChangeStatus = (userId: string, newStatus: 'active' | 'inactive') => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: newStatus } : u
    ))
    toast.success('Status updated', `User is now ${newStatus}`)
  }

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    if (!confirm(`Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`)) {
      return
    }

    setUsers(prev => prev.filter(u => u.id !== userId))
    selectedUsers.delete(userId)
    setSelectedUsers(new Set(selectedUsers))
    toast.success('User deleted', `${userToDelete.name} has been removed`)
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.size === 0) {
      toast.warning('No users selected', 'Please select users to perform bulk actions')
      return
    }

    const selectedCount = selectedUsers.size

    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedCount} users? This action cannot be undone.`)) {
        return
      }
      setUsers(prev => prev.filter(u => !selectedUsers.has(u.id)))
      toast.success('Users deleted', `${selectedCount} users have been removed`)
    } else {
      const newStatus = action === 'activate' ? 'active' : 'inactive'
      setUsers(prev => prev.map(u =>
        selectedUsers.has(u.id) ? { ...u, status: newStatus as 'active' | 'inactive' } : u
      ))
      toast.success('Status updated', `${selectedCount} users are now ${newStatus}`)
    }

    setSelectedUsers(new Set())
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email required', 'Please enter an email address')
      return
    }

    setInviting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newUser: User = {
      id: String(Date.now()),
      email: inviteEmail.trim(),
      name: inviteEmail.split('@')[0],
      role: inviteRole,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: '-',
      workflowsCreated: 0,
    }

    setUsers(prev => [...prev, newUser])
    setInviting(false)
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteRole('user')
    toast.success('Invitation sent', `Invite sent to ${inviteEmail}`)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'user': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      case 'viewer': return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10'
      case 'inactive': return 'text-yellow-400 bg-yellow-500/10'
      case 'pending': return 'text-blue-400 bg-blue-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  const tabs = [
    { id: 'users', label: 'User Management', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    )},
    { id: 'usage', label: 'Usage Stats', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { id: 'audit', label: 'Audit Log', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { id: 'features', label: 'Feature Flags', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    )},
  ]

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Manage users, monitor usage, and configure features</p>
            </div>
            <div className="text-sm text-slate-500">
              Logged in as: {user?.email}
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="font-semibold text-amber-400">Admin Access Only</h3>
              <p className="text-sm text-amber-300/80">
                This area contains sensitive controls. Changes made here affect all users on the platform.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700/50 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>

              {/* Filters */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>

              {/* Bulk Actions */}
              {selectedUsers.size > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <span className="text-sm text-cyan-400">{selectedUsers.size} selected</span>
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="px-2 py-1 text-xs text-green-400 hover:bg-green-500/20 rounded"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="px-2 py-1 text-xs text-yellow-400 hover:bg-yellow-500/20 rounded"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 rounded"
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Invite Button */}
              <Button onClick={() => setShowInviteModal(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Invite User
              </Button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-slate-700/50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-600"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Workflows</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Active</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(u.id)}
                          onChange={() => handleSelectUser(u.id)}
                          className="rounded border-slate-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{u.name}</div>
                            <div className="text-sm text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as 'admin' | 'user' | 'viewer')}
                          className={`px-2 py-1 text-xs font-medium rounded-full border cursor-pointer ${getRoleColor(u.role)}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {u.workflowsCreated}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {u.lastActive}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleChangeStatus(u.id, 'inactive')}
                              className="p-1.5 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleChangeStatus(u.id, 'active')}
                              className="p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Activate"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No users found matching your filters</p>
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-slate-400">Total Users</div>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-green-400">{users.filter(u => u.status === 'active').length}</div>
                <div className="text-sm text-slate-400">Active Users</div>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-blue-400">{users.filter(u => u.status === 'pending').length}</div>
                <div className="text-sm text-slate-400">Pending Invites</div>
              </div>
              <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="text-2xl font-bold text-red-400">{users.filter(u => u.role === 'admin').length}</div>
                <div className="text-sm text-slate-400">Admins</div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && <AdminUsageStats />}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && <AdminAuditLog />}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && <FeatureFlags />}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Invite New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'user' | 'viewer')}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="user">User - Can create and edit workflows</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowInviteModal(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleInviteUser}
                disabled={inviting}
              >
                {inviting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : 'Send Invite'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
