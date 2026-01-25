import { motion } from 'framer-motion'
import {
  Award,
  Trophy,
  Flame,
  Target,
  Clock,
  Zap,
  Star,
  TrendingUp,
  Calendar,
  BarChart3,
  Medal,
  Crown,
  ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const stats = [
  { label: 'Workflows Created', value: '24', icon: Zap, color: 'text-blue-400' },
  { label: 'Total Executions', value: '45.2K', icon: TrendingUp, color: 'text-purple-400' },
  { label: 'Time Saved', value: '312h', icon: Clock, color: 'text-emerald-400' },
  { label: 'Active Streak', value: '28 days', icon: Flame, color: 'text-orange-400' },
]

const achievements = [
  {
    id: 1,
    name: 'Automation Pioneer',
    description: 'Created your first workflow',
    icon: Zap,
    date: 'Oct 15, 2024',
    rarity: 'Common',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    name: 'Time Wizard',
    description: 'Saved 100+ hours with automations',
    icon: Clock,
    date: 'Nov 20, 2024',
    rarity: 'Rare',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    name: 'Integration Master',
    description: 'Connected 10+ different apps',
    icon: Target,
    date: 'Dec 1, 2024',
    rarity: 'Epic',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 4,
    name: 'Streak Champion',
    description: 'Maintained 30-day active streak',
    icon: Flame,
    date: 'Dec 10, 2024',
    rarity: 'Legendary',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 5,
    name: 'Workflow Architect',
    description: 'Built 20+ complex workflows',
    icon: Trophy,
    date: 'Dec 15, 2024',
    rarity: 'Epic',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 6,
    name: 'Early Adopter',
    description: 'Joined during beta',
    icon: Crown,
    date: 'Sep 1, 2024',
    rarity: 'Legendary',
    color: 'from-indigo-500 to-purple-500',
  },
]

const activityData = [
  { month: 'Jul', executions: 1200 },
  { month: 'Aug', executions: 1800 },
  { month: 'Sep', executions: 2400 },
  { month: 'Oct', executions: 3200 },
  { month: 'Nov', executions: 4100 },
  { month: 'Dec', executions: 5200 },
]

const maxExecutions = Math.max(...activityData.map(d => d.executions))

const leaderboard = [
  { rank: 1, name: 'Sarah Chen', score: 52400, avatar: 'SC' },
  { rank: 2, name: 'Ahmed Al-Rashid', score: 48200, avatar: 'AR' },
  { rank: 3, name: 'John Doe', score: 45200, avatar: 'JD', isYou: true },
  { rank: 4, name: 'Maria Garcia', score: 42100, avatar: 'MG' },
  { rank: 5, name: 'James Wilson', score: 38900, avatar: 'JW' },
]

export function Profile() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-nexus-500/10 via-accent-500/10 to-transparent overflow-hidden relative"
      >
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-nexus-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-xl shadow-nexus-500/30">
              JD
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 sm:border-4 border-surface-900">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">John Doe</h1>
              <span className="badge text-xs sm:text-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30">
                <Crown className="w-3 h-3 mr-1" />
                Pro User
              </span>
            </div>
            <p className="text-sm sm:text-base text-surface-400 mb-3 sm:mb-4">Automating workflows since October 2024</p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-500" />
                <span className="text-surface-300">Joined Oct 2024</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-surface-300">Level 12</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                <span className="text-surface-300">6 Achievements</span>
              </div>
            </div>
          </div>

          {/* Level progress */}
          <div className="w-full md:w-48">
            <div className="flex justify-between md:justify-end mb-2">
              <span className="text-xs sm:text-sm text-surface-400">Level 12</span>
              <span className="text-xs sm:text-sm text-surface-500"> → </span>
              <span className="text-xs sm:text-sm text-white">Level 13</span>
            </div>
            <div className="h-2 sm:h-3 bg-surface-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '72%' }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-nexus-500 to-accent-500 rounded-full"
              />
            </div>
            <p className="text-[10px] sm:text-xs text-surface-500 text-right mt-1">2,800 / 4,000 XP</p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card py-3 sm:py-5"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <stat.icon className={clsx('w-6 h-6 sm:w-8 sm:h-8', stat.color)} />
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-surface-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Achievements */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              <h2 className="text-base sm:text-lg font-semibold text-white">Achievements</h2>
            </div>
            <button className="text-xs sm:text-sm text-nexus-400 hover:text-nexus-300 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-surface-800/50 hover:bg-surface-800 border border-transparent hover:border-surface-700 transition-all cursor-pointer"
              >
                <div className={clsx(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
                  `bg-gradient-to-br ${achievement.color}`
                )}>
                  <achievement.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <p className="text-sm sm:text-base font-medium text-white truncate">{achievement.name}</p>
                    <span className={clsx(
                      'text-[10px] sm:text-xs px-1.5 py-0.5 rounded flex-shrink-0',
                      achievement.rarity === 'Common' && 'bg-surface-700 text-surface-300',
                      achievement.rarity === 'Rare' && 'bg-blue-500/20 text-blue-400',
                      achievement.rarity === 'Epic' && 'bg-purple-500/20 text-purple-400',
                      achievement.rarity === 'Legendary' && 'bg-amber-500/20 text-amber-400'
                    )}>
                      {achievement.rarity}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-surface-400 truncate">{achievement.description}</p>
                  <p className="text-[10px] sm:text-xs text-surface-500 mt-1">{achievement.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            <h2 className="text-base sm:text-lg font-semibold text-white">Leaderboard</h2>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user.rank}
                className={clsx(
                  'flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all',
                  user.isYou
                    ? 'bg-gradient-to-r from-nexus-500/20 to-accent-500/20 border border-nexus-500/30'
                    : 'hover:bg-surface-800'
                )}
              >
                <div className={clsx(
                  'w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0',
                  user.rank === 1 && 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
                  user.rank === 2 && 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800',
                  user.rank === 3 && 'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
                  user.rank > 3 && 'bg-surface-700 text-surface-300'
                )}>
                  {user.rank}
                </div>
                <div className={clsx(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0',
                  user.isYou
                    ? 'bg-gradient-to-br from-nexus-500 to-accent-500 text-white'
                    : 'bg-surface-700 text-surface-300'
                )}>
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-white truncate">
                    {user.name}
                    {user.isYou && <span className="text-nexus-400 ml-1">(You)</span>}
                  </p>
                  <p className="text-xs sm:text-sm text-surface-400">{user.score.toLocaleString()} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-nexus-400" />
            <h2 className="text-base sm:text-lg font-semibold text-white">Activity Overview</h2>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {['6M', '1Y', 'All'].map((period) => (
              <button
                key={period}
                className={clsx(
                  'px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all',
                  period === '6M'
                    ? 'bg-nexus-500 text-white'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-2 sm:gap-4 h-36 sm:h-48">
          {activityData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(data.executions / maxExecutions) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="w-full rounded-t-lg bg-gradient-to-t from-nexus-600 to-nexus-400 relative group"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-surface-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {data.executions.toLocaleString()}
                </div>
              </motion.div>
              <span className="text-xs text-surface-400">{data.month}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
