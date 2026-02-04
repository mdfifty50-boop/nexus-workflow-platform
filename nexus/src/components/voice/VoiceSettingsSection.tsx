/**
 * VoiceSettingsSection Component
 *
 * Voice & AI settings section for the Settings page.
 * Provides global voice configuration that applies to all workflows.
 */

import { motion } from 'framer-motion'
import { VoiceConfigurationPanel } from './VoiceConfigurationPanel'
import { Mic, Info, ExternalLink, Phone } from 'lucide-react'

interface VoiceSettingsSectionProps {
  className?: string
}

export function VoiceSettingsSection({ className }: VoiceSettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {/* Header Info Card */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
            <Mic className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">
              Voice & AI Settings
            </h2>
            <p className="text-sm text-surface-400">
              Configure AI voice calls for your workflows. Choose voices, languages,
              and customize how Nexus sounds when making calls on your behalf.
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 bg-surface-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <span className="text-lg">🇬🇧</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">English Voices</p>
              <p className="text-xs text-surface-400">6+ professional voices</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-surface-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-lg">🇸🇦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Arabic Voices</p>
              <p className="text-xs text-surface-400">Gulf dialect support</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-surface-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-lg">🔄</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Auto-Detection</p>
              <p className="text-xs text-surface-400">Switches language automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Configuration Panel */}
      <VoiceConfigurationPanel
        showAdvanced={false}
        onSave={(preferences) => {
          console.log('[VoiceSettingsSection] Saved preferences:', preferences)
          // Could show a toast notification here
        }}
      />

      {/* Additional Info Cards */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {/* Domain Optimization Info */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Domain Optimization</h3>
          </div>
          <p className="text-xs text-surface-400 mb-3">
            Selecting your business domain automatically optimizes:
          </p>
          <ul className="space-y-1 text-xs text-surface-300">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Voice tone and speaking style
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Conversation prompts and responses
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Speaking speed and clarity
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              Cultural and regional context
            </li>
          </ul>
        </div>

        {/* Phone Number Setup */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-white">Phone Number Setup</h3>
          </div>
          <p className="text-xs text-surface-400 mb-3">
            To make outbound voice calls, you'll need a phone number from Telnyx.
          </p>
          <a
            href="https://telnyx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg text-sm text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Get a Phone Number
          </a>
          <p className="mt-2 text-xs text-surface-500">
            Recommended: Kuwait (+965) or UAE (+971) numbers for Gulf region
          </p>
        </div>
      </div>

      {/* Powered By */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-surface-500">
        <span>Powered by</span>
        <a
          href="https://elevenlabs.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-surface-300 transition-colors"
        >
          <span className="font-medium">ElevenLabs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <span>Voice AI</span>
      </div>
    </motion.div>
  )
}

export default VoiceSettingsSection
