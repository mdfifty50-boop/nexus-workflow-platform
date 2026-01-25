import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter'
import { validatePassword, validatePasswordsMatch } from '@/lib/validation'
import OptimizedImage from '@/components/OptimizedImage'

interface AccountSettingsProps {
  className?: string
}

export function AccountSettings({ className }: AccountSettingsProps) {
  const { user } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: 'Mohammed',
    email: user?.email || '',
    phone: '',
    bio: ''
  })

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPassword: '',
    confirm: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [changingPassword, setChangingPassword] = useState(false)

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  // Saving state
  const [saving, setSaving] = useState(false)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please select an image file')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', 'Please select an image under 2MB')
      return
    }

    setUploadingAvatar(true)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUploadingAvatar(false)
    toast.success('Avatar updated', 'Your profile picture has been changed')
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    toast.success('Avatar removed', 'Your profile picture has been removed')
  }

  const handleProfileSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('nexus_profile', JSON.stringify(profileData))
    setSaving(false)
    toast.success('Profile updated', 'Your profile information has been saved')
  }

  const handlePasswordChange = async () => {
    const errors: Record<string, string> = {}

    if (!passwordForm.current) {
      errors.current = 'Current password is required'
    }

    const strength = validatePassword(passwordForm.newPassword)
    if (strength.score < 3) {
      errors.newPassword = 'Password is too weak. Add: ' + strength.feedback.join(', ')
    }

    const matchResult = validatePasswordsMatch(passwordForm.newPassword, passwordForm.confirm)
    if (!matchResult.valid) {
      errors.confirm = matchResult.error!
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordErrors({})
    setChangingPassword(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setChangingPassword(false)
    setShowPasswordForm(false)
    setPasswordForm({ current: '', newPassword: '', confirm: '' })
    toast.success('Password updated', 'Your password has been changed successfully')
  }

  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      toast.error('Missing fields', 'Please fill in all fields')
      return
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error('Invalid email', 'Please enter a valid email address')
      return
    }

    setChangingEmail(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setChangingEmail(false)
    setShowEmailForm(false)
    setNewEmail('')
    setEmailPassword('')
    setProfileData(prev => ({ ...prev, email: newEmail }))
    toast.success('Verification sent', 'Please check your new email to confirm the change')
  }

  return (
    <div className={className}>
      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
          <div className="flex items-center gap-6">
            <div
              className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer group overflow-hidden"
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <OptimizedImage
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={96}
                  height={96}
                  className="rounded-full"
                  priority
                />
              ) : (
                <span className="text-3xl">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploadingAvatar ? (
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleAvatarClick} disabled={uploadingAvatar}>
                  Upload new
                </Button>
                {avatarPreview && (
                  <Button variant="outline" size="sm" onClick={handleRemoveAvatar} className="text-destructive hover:text-destructive">
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB. Recommended 256x256px.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us a bit about yourself"
                rows={3}
                className="flex w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleProfileSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Email Address</h3>
          {!showEmailForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{profileData.email || 'No email set'}</p>
                <p className="text-sm text-muted-foreground">Your primary email for notifications and login</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowEmailForm(true)}>
                Change Email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emailPassword">Current Password</Label>
                <Input
                  id="emailPassword"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Verify your identity"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmailForm(false)
                    setNewEmail('')
                    setEmailPassword('')
                  }}
                  disabled={changingEmail}
                >
                  Cancel
                </Button>
                <Button onClick={handleEmailChange} disabled={changingEmail}>
                  {changingEmail ? 'Sending verification...' : 'Change Email'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Password Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Password</h3>
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, current: e.target.value }))
                    if (passwordErrors.current) setPasswordErrors(prev => ({ ...prev, current: '' }))
                  }}
                  placeholder="Enter current password"
                  className={passwordErrors.current ? 'border-destructive' : ''}
                />
                {passwordErrors.current && (
                  <p className="text-sm text-destructive">{passwordErrors.current}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                    if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: '' }))
                  }}
                  placeholder="Enter new password"
                  className={passwordErrors.newPassword ? 'border-destructive' : ''}
                />
                <PasswordStrengthMeter password={passwordForm.newPassword} />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => {
                    setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))
                    if (passwordErrors.confirm) setPasswordErrors(prev => ({ ...prev, confirm: '' }))
                  }}
                  placeholder="Confirm new password"
                  className={passwordErrors.confirm ? 'border-destructive' : ''}
                />
                {passwordErrors.confirm && (
                  <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false)
                    setPasswordForm({ current: '', newPassword: '', confirm: '' })
                    setPasswordErrors({})
                  }}
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button onClick={handlePasswordChange} disabled={changingPassword}>
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-card border border-destructive/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    toast.warning('Account deletion', 'This feature is not yet implemented')
                  }
                }}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
