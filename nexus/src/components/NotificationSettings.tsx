import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type NotificationPreferences,
  type NotificationChannel,
  type NotificationType,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_TYPE_INFO,
} from '@/types/notification'
import { getPushNotificationService, type PushPermissionState } from '@/lib/push-notifications'

interface NotificationSettingsProps {
  preferences?: NotificationPreferences | null
  onSave: (preferences: Partial<NotificationPreferences>) => Promise<void>
  className?: string
}

export function NotificationSettings({ preferences, onSave, className = '' }: NotificationSettingsProps) {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<Partial<NotificationPreferences>>(
    preferences || DEFAULT_NOTIFICATION_PREFERENCES
  )
  const [saving, setSaving] = useState(false)
  const [pushPermission, setPushPermission] = useState<PushPermissionState>('default')
  const [requestingPush, setRequestingPush] = useState(false)

  useEffect(() => {
    const pushService = getPushNotificationService()
    setPushPermission(pushService.permissionState)
  }, [])

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleChannelToggle = (type: NotificationType, channel: NotificationChannel, enabled: boolean) => {
    setSettings(prev => {
      const currentChannels = prev.channels || DEFAULT_NOTIFICATION_PREFERENCES.channels
      const typeChannels = currentChannels[type] || []

      const newTypeChannels = enabled
        ? [...typeChannels.filter(c => c !== channel), channel]
        : typeChannels.filter(c => c !== channel)

      return {
        ...prev,
        channels: {
          ...currentChannels,
          [type]: newTypeChannels,
        },
      }
    })
  }

  const handleRequestPushPermission = async () => {
    setRequestingPush(true)
    try {
      const pushService = getPushNotificationService()
      const permission = await pushService.requestPermission()
      setPushPermission(permission)

      if (permission === 'granted') {
        await pushService.subscribe()
      }
    } catch (error) {
      console.error('Failed to request push permission:', error)
    } finally {
      setRequestingPush(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(settings)
    } finally {
      setSaving(false)
    }
  }

  const notificationTypes: NotificationType[] = [
    'workflow_complete',
    'workflow_error',
    'mention',
    'system',
    'achievement',
    'collaboration',
    'reminder',
  ]

  const channels = settings.channels || DEFAULT_NOTIFICATION_PREFERENCES.channels

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Global Toggle */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">
              {t('settings.notifications.enabled', 'Enable Notifications')}
            </h3>
            <p className="text-sm text-slate-400">
              {t('settings.notifications.enabledDesc', 'Master switch for all notifications')}
            </p>
          </div>
          <Toggle
            checked={settings.notifications_enabled ?? true}
            onChange={(v) => handleToggle('notifications_enabled', v)}
          />
        </div>
      </div>

      {/* Push Notification Permission */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">
              {t('settings.notifications.push', 'Push Notifications')}
            </h3>
            <p className="text-sm text-slate-400">
              {pushPermission === 'granted'
                ? t('settings.notifications.pushEnabled', 'Push notifications are enabled')
                : pushPermission === 'denied'
                ? t('settings.notifications.pushDenied', 'Push notifications were blocked. Enable them in browser settings.')
                : pushPermission === 'unsupported'
                ? t('settings.notifications.pushUnsupported', 'Push notifications are not supported in this browser')
                : t('settings.notifications.pushDesc', 'Receive notifications even when the app is closed')}
            </p>
          </div>
          {pushPermission === 'default' && (
            <button
              onClick={handleRequestPushPermission}
              disabled={requestingPush}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {requestingPush ? t('common.loading', 'Loading...') : t('settings.notifications.enable', 'Enable')}
            </button>
          )}
          {pushPermission === 'granted' && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              {t('common.enabled', 'Enabled')}
            </span>
          )}
          {pushPermission === 'denied' && (
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
              {t('common.blocked', 'Blocked')}
            </span>
          )}
        </div>
      </div>

      {/* Notification Channels per Type */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-white font-medium">
            {t('settings.notifications.channels', 'Notification Channels')}
          </h3>
          <p className="text-sm text-slate-400">
            {t('settings.notifications.channelsDesc', 'Choose how you want to be notified for each type')}
          </p>
        </div>

        <div className="divide-y divide-slate-700/50">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-slate-900/50 text-sm text-slate-400">
            <div>{t('settings.notifications.type', 'Type')}</div>
            <div className="text-center">{t('settings.notifications.inApp', 'In-App')}</div>
            <div className="text-center">{t('settings.notifications.pushLabel', 'Push')}</div>
            <div className="text-center">{t('settings.notifications.email', 'Email')}</div>
          </div>

          {/* Notification Type Rows */}
          {notificationTypes.map(type => {
            const typeInfo = NOTIFICATION_TYPE_INFO[type]
            const typeChannels = channels[type] || []

            return (
              <div key={type} className="grid grid-cols-4 gap-4 px-4 py-3 items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${typeInfo.color} bg-slate-700/50`}>
                    {typeInfo.icon}
                  </span>
                  <span className="text-sm text-slate-300">{typeInfo.label}</span>
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={typeChannels.includes('in_app')}
                    onChange={(v) => handleChannelToggle(type, 'in_app', v)}
                    size="sm"
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={typeChannels.includes('push')}
                    onChange={(v) => handleChannelToggle(type, 'push', v)}
                    size="sm"
                    disabled={pushPermission !== 'granted'}
                  />
                </div>
                <div className="flex justify-center">
                  <Toggle
                    checked={typeChannels.includes('email')}
                    onChange={(v) => handleChannelToggle(type, 'email', v)}
                    size="sm"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium">
              {t('settings.notifications.quietHours', 'Quiet Hours')}
            </h3>
            <p className="text-sm text-slate-400">
              {t('settings.notifications.quietHoursDesc', 'Pause notifications during specified hours')}
            </p>
          </div>
          <Toggle
            checked={settings.quiet_hours_enabled ?? false}
            onChange={(v) => handleToggle('quiet_hours_enabled', v)}
          />
        </div>

        {settings.quiet_hours_enabled && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{t('settings.notifications.from', 'From')}</span>
              <input
                type="time"
                value={settings.quiet_hours_start || '22:00'}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">{t('settings.notifications.to', 'To')}</span>
              <input
                type="time"
                value={settings.quiet_hours_end || '08:00'}
                onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Email Digest */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium">
              {t('settings.notifications.emailDigest', 'Email Digest')}
            </h3>
            <p className="text-sm text-slate-400">
              {t('settings.notifications.emailDigestDesc', 'Receive a summary of notifications via email')}
            </p>
          </div>
          <Toggle
            checked={settings.email_digest_enabled ?? true}
            onChange={(v) => handleToggle('email_digest_enabled', v)}
          />
        </div>

        {settings.email_digest_enabled && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <label className="text-sm text-slate-400 block mb-2">
              {t('settings.notifications.frequency', 'Frequency')}
            </label>
            <select
              value={settings.email_digest_frequency || 'daily'}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                email_digest_frequency: e.target.value as NotificationPreferences['email_digest_frequency']
              }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="realtime">{t('settings.notifications.realtime', 'Real-time')}</option>
              <option value="hourly">{t('settings.notifications.hourly', 'Hourly')}</option>
              <option value="daily">{t('settings.notifications.daily', 'Daily')}</option>
              <option value="weekly">{t('settings.notifications.weekly', 'Weekly')}</option>
            </select>
          </div>
        )}
      </div>

      {/* Sound Settings */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-4">
        <h3 className="text-white font-medium">
          {t('settings.notifications.sounds', 'Sound Settings')}
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">
            {t('settings.notifications.pushSound', 'Push notification sound')}
          </span>
          <Toggle
            checked={settings.push_sound_enabled ?? true}
            onChange={(v) => handleToggle('push_sound_enabled', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">
            {t('settings.notifications.inAppSound', 'In-app notification sound')}
          </span>
          <Toggle
            checked={settings.in_app_sound_enabled ?? false}
            onChange={(v) => handleToggle('in_app_sound_enabled', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">
            {t('settings.notifications.showPreview', 'Show notification preview')}
          </span>
          <Toggle
            checked={settings.show_preview ?? true}
            onChange={(v) => handleToggle('show_preview', v)}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg font-medium transition-all"
        >
          {saving ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
        </button>
      </div>
    </div>
  )
}

// Toggle Component
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md'
}

function Toggle({ checked, onChange, disabled = false, size = 'md' }: ToggleProps) {
  const sizeClasses = size === 'sm'
    ? 'w-8 h-4'
    : 'w-11 h-6'
  const dotClasses = size === 'sm'
    ? 'w-3 h-3'
    : 'w-5 h-5'
  const translateClasses = size === 'sm'
    ? (checked ? 'translate-x-4' : 'translate-x-0.5')
    : (checked ? 'translate-x-5' : 'translate-x-0.5')

  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-colors
        ${sizeClasses}
        ${checked ? 'bg-cyan-500' : 'bg-slate-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white transition-transform
          ${dotClasses}
          ${translateClasses}
        `}
      />
    </button>
  )
}

export default NotificationSettings
