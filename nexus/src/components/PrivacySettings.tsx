import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/ToastContext'

interface PrivacySettingsProps {
  className?: string
}

interface PrivacyPreferences {
  analytics: boolean
  crashReports: boolean
  usageData: boolean
  personalization: boolean
  marketing: boolean
  profileVisible: boolean
  activityVisible: boolean
  workflowsPublic: boolean
  showOnlineStatus: boolean
  allowDiscovery: boolean
}

export function PrivacySettings({ className }: PrivacySettingsProps) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)

  // Load saved preferences
  const [preferences, setPreferences] = useState<PrivacyPreferences>(() => {
    const saved = localStorage.getItem('nexus_privacy')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // Return defaults if parse fails
      }
    }
    return {
      analytics: true,
      crashReports: true,
      usageData: false,
      personalization: true,
      marketing: false,
      profileVisible: true,
      activityVisible: true,
      workflowsPublic: false,
      showOnlineStatus: true,
      allowDiscovery: true,
    }
  })

  // Auto-save preferences
  useEffect(() => {
    localStorage.setItem('nexus_privacy', JSON.stringify(preferences))
  }, [preferences])

  const updatePreference = (key: keyof PrivacyPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setSaving(false)
    toast.success('Privacy settings saved', 'Your privacy preferences have been updated')
  }

  const handleOptOutAll = () => {
    setPreferences({
      analytics: false,
      crashReports: false,
      usageData: false,
      personalization: false,
      marketing: false,
      profileVisible: false,
      activityVisible: false,
      workflowsPublic: false,
      showOnlineStatus: false,
      allowDiscovery: false,
    })
    toast.info('All sharing disabled', 'You have opted out of all data sharing')
  }

  const handleDownloadData = () => {
    toast.info('Export started', 'Your data export is being prepared. You will receive an email when ready.')
  }

  const handleDeleteData = () => {
    if (confirm('Are you sure you want to request deletion of all your data? This action cannot be undone.')) {
      toast.warning('Request submitted', 'Your data deletion request has been submitted. Processing may take up to 30 days.')
    }
  }

  const ToggleRow = ({
    label,
    description,
    checked,
    onChange
  }: {
    label: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="flex-1 pr-4">
        <Label className="font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </label>
    </div>
  )

  return (
    <div className={className}>
      <div className="space-y-8">
        {/* Data Sharing */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Data Sharing</h3>
            <Button variant="outline" size="sm" onClick={handleOptOutAll}>
              Opt Out of All
            </Button>
          </div>

          <div className="space-y-0">
            <ToggleRow
              label="Analytics"
              description="Help us improve by sharing anonymous usage statistics"
              checked={preferences.analytics}
              onChange={(checked) => updatePreference('analytics', checked)}
            />
            <ToggleRow
              label="Crash Reports"
              description="Automatically send crash reports to help us fix issues"
              checked={preferences.crashReports}
              onChange={(checked) => updatePreference('crashReports', checked)}
            />
            <ToggleRow
              label="Usage Data"
              description="Share detailed usage data to improve features"
              checked={preferences.usageData}
              onChange={(checked) => updatePreference('usageData', checked)}
            />
            <ToggleRow
              label="Personalization"
              description="Use your data to personalize your experience"
              checked={preferences.personalization}
              onChange={(checked) => updatePreference('personalization', checked)}
            />
            <ToggleRow
              label="Marketing Communications"
              description="Receive updates about new features and offers"
              checked={preferences.marketing}
              onChange={(checked) => updatePreference('marketing', checked)}
            />
          </div>
        </div>

        {/* Profile Visibility */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Visibility</h3>

          <div className="space-y-0">
            <ToggleRow
              label="Public Profile"
              description="Allow others to view your profile information"
              checked={preferences.profileVisible}
              onChange={(checked) => updatePreference('profileVisible', checked)}
            />
            <ToggleRow
              label="Activity Visibility"
              description="Show your recent activity on your profile"
              checked={preferences.activityVisible}
              onChange={(checked) => updatePreference('activityVisible', checked)}
            />
            <ToggleRow
              label="Public Workflows"
              description="Allow your workflows to appear in public galleries"
              checked={preferences.workflowsPublic}
              onChange={(checked) => updatePreference('workflowsPublic', checked)}
            />
            <ToggleRow
              label="Online Status"
              description="Show when you are online to other team members"
              checked={preferences.showOnlineStatus}
              onChange={(checked) => updatePreference('showOnlineStatus', checked)}
            />
            <ToggleRow
              label="Allow Discovery"
              description="Let others find you by email or username"
              checked={preferences.allowDiscovery}
              onChange={(checked) => updatePreference('allowDiscovery', checked)}
            />
          </div>
        </div>

        {/* Third-Party Integrations */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Connected Services</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Review and manage data sharing with connected third-party services
          </p>

          <div className="space-y-3">
            {[
              { name: 'Google Workspace', icon: '🔵', connected: true, sharing: 'Basic profile' },
              { name: 'Slack', icon: '💜', connected: true, sharing: 'Messages & activity' },
              { name: 'GitHub', icon: '⚫', connected: false, sharing: 'Not connected' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{service.icon}</span>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.sharing}</p>
                  </div>
                </div>
                {service.connected ? (
                  <Button variant="outline" size="sm">Manage</Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Not connected</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Data Rights */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Your Data Rights</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Under GDPR and other privacy regulations, you have the right to access, export, and delete your personal data.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Download Your Data</p>
                <p className="text-sm text-muted-foreground">Get a copy of all your data in machine-readable format</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadData}>
                Request Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div>
                <p className="font-medium text-destructive">Delete All Data</p>
                <p className="text-sm text-muted-foreground">Permanently delete all your personal data from our servers</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDeleteData}
              >
                Request Deletion
              </Button>
            </div>
          </div>
        </div>

        {/* Cookie Preferences */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Cookie Preferences</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Essential Cookies</p>
                <p className="text-xs text-muted-foreground">Required for the application to function</p>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Always On</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Functional Cookies</p>
                <p className="text-xs text-muted-foreground">Remember your preferences and settings</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Analytics Cookies</p>
                <p className="text-xs text-muted-foreground">Help us understand how you use the app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => updatePreference('analytics', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
