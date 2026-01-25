import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Play,
  Pause,
  MoreHorizontal,
  AlertCircle,
  ChevronRight,
  Zap,
  Edit,
} from 'lucide-react'
import clsx from 'clsx'

const workflows = [
  {
    id: 1,
    name: 'Email to Slack Notifier',
    description: 'Forwards important emails to Slack channel with AI summary',
    status: 'active',
    lastRun: '2 min ago',
    runs: 1245,
    successRate: 99.8,
    apps: ['📧', '💬'],
    trigger: 'New Email',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    name: 'Lead Scoring Pipeline',
    description: 'Automatically scores and routes incoming leads',
    status: 'active',
    lastRun: '15 min ago',
    runs: 892,
    successRate: 98.5,
    apps: ['🎯', '📊', '💬'],
    trigger: 'New Form Submission',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    name: 'Invoice Generator',
    description: 'Creates and sends invoices from completed projects',
    status: 'paused',
    lastRun: '1 day ago',
    runs: 156,
    successRate: 100,
    apps: ['📄', '💳', '📧'],
    trigger: 'Project Completed',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 4,
    name: 'Social Media Scheduler',
    description: 'Posts content across multiple social platforms',
    status: 'active',
    lastRun: '3 hours ago',
    runs: 2341,
    successRate: 97.2,
    apps: ['📱', '🐦', '📸'],
    trigger: 'Scheduled',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 5,
    name: 'Customer Onboarding',
    description: 'Sends welcome emails and creates user accounts',
    status: 'active',
    lastRun: '30 min ago',
    runs: 567,
    successRate: 99.5,
    apps: ['📧', '🗃️', '💬'],
    trigger: 'New Customer',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 6,
    name: 'Weekly Report Builder',
    description: 'Compiles data and generates weekly performance reports',
    status: 'error',
    lastRun: '2 hours ago',
    runs: 45,
    successRate: 88.9,
    apps: ['📊', '📄', '📧'],
    trigger: 'Every Monday 9am',
    color: 'from-amber-500 to-orange-500',
  },
]

const stats = [
  { label: 'Total Workflows', value: '24', icon: Zap },
  { label: 'Active', value: '18', icon: Play },
  { label: 'Paused', value: '4', icon: Pause },
  { label: 'Error', value: '2', icon: AlertCircle },
]

export function Workflows() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [, setSelectedWorkflow] = useState<number | null>(null)

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Workflows</h1>
          <p className="text-sm sm:text-base text-surface-400 mt-1">Manage and monitor your automations</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Workflow
        </motion.button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card py-3 sm:py-4"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-nexus-500/10 flex items-center justify-center">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-nexus-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-surface-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workflows..."
            className="input pl-12"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2 py-3">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <div className="flex items-center rounded-xl bg-surface-800 border border-surface-700 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'grid'
                  ? 'bg-surface-700 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-all',
                viewMode === 'list'
                  ? 'bg-surface-700 text-white'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workflow grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow, index) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="card-glow group cursor-pointer"
              onClick={() => setSelectedWorkflow(workflow.id)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center shadow-lg`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'badge',
                    workflow.status === 'active' && 'badge-success',
                    workflow.status === 'paused' && 'badge-warning',
                    workflow.status === 'error' && 'bg-red-500/20 text-red-400 border-red-500/30'
                  )}>
                    {workflow.status === 'active' && <Play className="w-3 h-3 mr-1" />}
                    {workflow.status === 'paused' && <Pause className="w-3 h-3 mr-1" />}
                    {workflow.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {workflow.status}
                  </span>
                  <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-700 transition-all">
                    <MoreHorizontal className="w-4 h-4 text-surface-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-nexus-400 transition-colors">
                {workflow.name}
              </h3>
              <p className="text-sm text-surface-400 mb-4 line-clamp-2">
                {workflow.description}
              </p>

              {/* Apps */}
              <div className="flex items-center gap-2 mb-4">
                {workflow.apps.map((app, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-lg"
                  >
                    {app}
                  </div>
                ))}
                <ChevronRight className="w-4 h-4 text-surface-500" />
              </div>

              {/* Footer stats */}
              <div className="pt-4 border-t border-surface-700/50 grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <p className="text-base sm:text-lg font-semibold text-white">{workflow.runs.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">Total runs</p>
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-emerald-400">{workflow.successRate}%</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">Success</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-surface-300">{workflow.lastRun}</p>
                  <p className="text-[10px] sm:text-xs text-surface-500">Last run</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left text-sm font-medium text-surface-400 p-4">Workflow</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">Status</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">Trigger</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">Runs</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">Success Rate</th>
                <th className="text-left text-sm font-medium text-surface-400 p-4">Last Run</th>
                <th className="text-right text-sm font-medium text-surface-400 p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkflows.map((workflow) => (
                <motion.tr
                  key={workflow.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-surface-800 hover:bg-surface-800/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${workflow.color} flex items-center justify-center`}>
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white group-hover:text-nexus-400 transition-colors">
                          {workflow.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {workflow.apps.map((app, i) => (
                            <span key={i} className="text-sm">{app}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={clsx(
                      'badge',
                      workflow.status === 'active' && 'badge-success',
                      workflow.status === 'paused' && 'badge-warning',
                      workflow.status === 'error' && 'bg-red-500/20 text-red-400 border-red-500/30'
                    )}>
                      {workflow.status}
                    </span>
                  </td>
                  <td className="p-4 text-surface-300 text-sm">{workflow.trigger}</td>
                  <td className="p-4 text-white">{workflow.runs.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                          style={{ width: `${workflow.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-emerald-400">{workflow.successRate}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-surface-400 text-sm">{workflow.lastRun}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-surface-700 text-surface-400 hover:text-white transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
