import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Key,
  Mail,
  Smartphone,
  Moon,
  Sun,
  Check,
  ChevronRight,
  Mic,
  Cloud,
} from 'lucide-react'
import clsx from 'clsx'
import { WhatsAppWebIntegrationPanel } from '../components/WhatsAppWebIntegration'
import { VoiceSettingsSection } from '../components/voice'
import { userPreferencesService } from '@/services'

const settingsSections = [
  { id: 'account', name: 'Account', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'voice', name: 'Voice & AI', icon: Mic },
  { id: 'integrations', name: 'API & Integrations', icon: Key },
]

export function Settings() {
  const [activeSection, setActiveSection] = useState('account')
  // Initialize state directly from service (lazy initialization for correct first render)
  const [darkMode, setDarkMode] = useState(() => userPreferencesService.get('theme') === 'dark')
  const [emailNotifications, setEmailNotifications] = useState(() => userPreferencesService.get('emailNotifications'))
  const [pushNotifications, setPushNotifications] = useState(() => userPreferencesService.get('pushNotifications'))
  const [weeklyDigest, setWeeklyDigest] = useState(() => userPreferencesService.get('weeklyDigest'))
  const [syncStatus, setSyncStatus] = useState<{ lastSync: Date | null; enabled: boolean }>(() =>
    userPreferencesService.getSyncStatus()
  )

  // Update sync status after async cloud check completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setSyncStatus(userPreferencesService.getSyncStatus())
    }, 1000) // Give time for cloud status check
    return () => clearTimeout(timer)
  }, [])

  // Subscribe to preference changes (cross-tab sync)
  useEffect(() => {
    return userPreferencesService.subscribe((prefs) => {
      setDarkMode(prefs.theme === 'dark')
      setEmailNotifications(prefs.emailNotifications)
      setPushNotifications(prefs.pushNotifications)
      setWeeklyDigest(prefs.weeklyDigest)
      setSyncStatus(userPreferencesService.getSyncStatus())
    })
  }, [])

  // Handlers that persist to UserPreferencesService
  const handleDarkModeChange = async (enabled: boolean) => {
    setDarkMode(enabled)
    await userPreferencesService.setTheme(enabled ? 'dark' : 'light')
  }

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    setEmailNotifications(enabled)
    await userPreferencesService.set('emailNotifications', enabled)
  }

  const handlePushNotificationsChange = async (enabled: boolean) => {
    setPushNotifications(enabled)
    await userPreferencesService.set('pushNotifications', enabled)
  }

  const handleWeeklyDigestChange = async (enabled: boolean) => {
    setWeeklyDigest(enabled)
    await userPreferencesService.set('weeklyDigest', enabled)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
            <p className="text-sm sm:text-base text-surface-400 mt-1">Manage your account preferences</p>
          </div>
          {syncStatus.enabled && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300">
                {syncStatus.lastSync
                  ? `Synced ${new Date(syncStatus.lastSync).toLocaleTimeString()}`
                  : 'Cloud sync enabled'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="card p-2 space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                  activeSection === section.id
                    ? 'bg-nexus-500/10 text-nexus-400'
                    : 'text-surface-300 hover:bg-surface-800 hover:text-white'
                )}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Account Section */}
          {activeSection === 'account' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Profile Information</h2>

                <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
                      <User className="w-8 h-8 sm:w-10 sm:h-10" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-700 border border-surface-600 flex items-center justify-center text-surface-300 hover:bg-surface-600 transition-colors">
                      <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Your Profile</h3>
                    <p className="text-sm sm:text-base text-surface-400">Update your personal information</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">First Name</label>
                      <input
                        type="text"
                        placeholder="Enter your first name"
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all"
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">Last Name</label>
                      <input
                        type="text"
                        placeholder="Enter your last name"
                        className="w-full px-4 py-3 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all"
                        style={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #475569'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all"
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Timezone</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569'
                      }}
                    >
                      <option>Asia/Kuwait (UTC+3)</option>
                      <option>America/New_York (UTC-5)</option>
                      <option>Europe/London (UTC+0)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-surface-700 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary"
                  >
                    Save Changes
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Notification Preferences</h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-800/50">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-white">Email Notifications</p>
                      <p className="text-xs sm:text-sm text-surface-400">Receive workflow updates via email</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEmailNotificationsChange(!emailNotifications)}
                    className="w-12 h-7 rounded-full transition-all relative border-2"
                    style={{
                      backgroundColor: emailNotifications ? '#0ea5e9' : '#334155',
                      borderColor: emailNotifications ? '#0ea5e9' : '#64748b'
                    }}
                  >
                    <motion.div
                      animate={{ x: emailNotifications ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-800/50">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-white">Push Notifications</p>
                      <p className="text-xs sm:text-sm text-surface-400">Get real-time alerts on your device</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePushNotificationsChange(!pushNotifications)}
                    className="w-12 h-7 rounded-full transition-all relative border-2"
                    style={{
                      backgroundColor: pushNotifications ? '#0ea5e9' : '#334155',
                      borderColor: pushNotifications ? '#0ea5e9' : '#64748b'
                    }}
                  >
                    <motion.div
                      animate={{ x: pushNotifications ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-800/50">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-white">Weekly Digest</p>
                      <p className="text-xs sm:text-sm text-surface-400">Receive a summary of your workflows</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWeeklyDigestChange(!weeklyDigest)}
                    className="w-12 h-7 rounded-full transition-all relative border-2"
                    style={{
                      backgroundColor: weeklyDigest ? '#0ea5e9' : '#334155',
                      borderColor: weeklyDigest ? '#0ea5e9' : '#64748b'
                    }}
                  >
                    <motion.div
                      animate={{ x: weeklyDigest ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Appearance</h2>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <p className="text-sm font-medium text-surface-300 mb-3 sm:mb-4">Theme</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button
                      onClick={() => handleDarkModeChange(false)}
                      className={clsx(
                        'p-3 sm:p-4 rounded-xl border-2 transition-all',
                        !darkMode
                          ? 'border-nexus-500 bg-nexus-500/10'
                          : 'border-surface-700 hover:border-surface-600'
                      )}
                    >
                      <div className="w-full h-16 sm:h-24 rounded-lg bg-white mb-2 sm:mb-3" />
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-400" />
                        <span className="text-sm sm:text-base text-white font-medium">Light</span>
                        {!darkMode && <Check className="w-4 h-4 text-nexus-400 ml-auto" />}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDarkModeChange(true)}
                      className={clsx(
                        'p-3 sm:p-4 rounded-xl border-2 transition-all',
                        darkMode
                          ? 'border-nexus-500 bg-nexus-500/10'
                          : 'border-surface-700 hover:border-surface-600'
                      )}
                    >
                      <div className="w-full h-16 sm:h-24 rounded-lg bg-surface-800 mb-2 sm:mb-3" />
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm sm:text-base text-white font-medium">Dark</span>
                        {darkMode && <Check className="w-4 h-4 text-nexus-400 ml-auto" />}
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-surface-300 mb-3 sm:mb-4">Accent Color</p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {['bg-nexus-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500'].map((color, i) => (
                      <button
                        key={i}
                        className={clsx(
                          'w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all',
                          color,
                          i === 0 && 'ring-2 ring-white ring-offset-2 ring-offset-surface-900'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card bg-gradient-to-r from-nexus-500/20 to-accent-500/20 border-nexus-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="badge-primary mb-2">Current Plan</span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">Free Plan</h3>
                    <p className="text-sm sm:text-base text-surface-400">Get started with basic features</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full sm:w-auto"
                  >
                    Upgrade Plan
                  </motion.button>
                </div>
              </div>

              <div className="card">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Payment Method</h2>
                <div className="p-6 text-center">
                  <CreditCard className="w-10 h-10 text-surface-500 mx-auto mb-3" />
                  <p className="text-sm text-surface-400 mb-4">No payment method on file</p>
                  <button className="btn-secondary text-sm">
                    Add Payment Method
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4">Billing History</h2>
                <div className="p-6 text-center">
                  <p className="text-sm text-surface-400">No billing history yet</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all"
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all"
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 transition-all"
                      style={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569'
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-surface-700 flex justify-end">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary">
                    Update Password
                  </motion.button>
                </div>
              </div>

              <div className="card">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Two-Factor Authentication</h2>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-surface-800/50">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-medium text-white">Authenticator App</p>
                      <p className="text-xs sm:text-sm text-surface-400">Not configured</p>
                    </div>
                  </div>
                  <button className="text-xs sm:text-sm text-surface-400 hover:text-white transition-colors flex items-center gap-1">
                    Manage <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Voice & AI Section */}
          {activeSection === 'voice' && (
            <VoiceSettingsSection />
          )}

          {/* API & Integrations Section */}
          {activeSection === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* WhatsApp Web Integration */}
              <WhatsAppWebIntegrationPanel />

              {/* API Keys */}
              <div className="card">
                <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">API Keys</h2>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-surface-800/50">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium text-white">Production API Key</p>
                      <p className="text-xs sm:text-sm text-surface-400 font-mono truncate">nx_prod_**********************</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="btn-ghost py-2 text-xs sm:text-sm">Copy</button>
                      <button className="btn-ghost py-2 text-xs sm:text-sm text-red-400 hover:text-red-300">Revoke</button>
                    </div>
                  </div>
                  <button className="w-full py-3 rounded-xl border border-dashed border-surface-600 text-surface-400 hover:border-nexus-500/50 hover:text-nexus-400 transition-all text-xs sm:text-sm">
                    + Generate New API Key
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
