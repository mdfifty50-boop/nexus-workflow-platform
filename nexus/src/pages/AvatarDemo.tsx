/**
 * Avatar Demo Page
 * @NEXUS-FIX-090: Showcases all avatar roles, states, and animations
 *
 * This page demonstrates the full capabilities of the Nexus Avatar system.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Avatar, SmartAvatar, type AvatarRole, type AvatarState, type AvatarSize } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ROLES: AvatarRole[] = ['default', 'lawyer', 'doctor', 'sme', 'receptionist', 'assistant']
const STATES: AvatarState[] = ['idle', 'listening', 'thinking', 'speaking', 'celebrating']
const SIZES: AvatarSize[] = ['sm', 'md', 'lg', 'xl']

const ROLE_LABELS: Record<AvatarRole, string> = {
  default: 'Default',
  lawyer: 'Lawyer',
  doctor: 'Doctor',
  sme: 'SME Owner',
  receptionist: 'Receptionist',
  assistant: 'Assistant'
}

const STATE_LABELS: Record<AvatarState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  celebrating: 'Celebrating'
}

export function AvatarDemo() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<AvatarRole>('default')
  const [selectedState, setSelectedState] = useState<AvatarState>('idle')
  const [selectedSize, setSelectedSize] = useState<AvatarSize>('lg')
  const [isAnimating, setIsAnimating] = useState(true)

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Avatar Demo</h1>
            <p className="text-muted-foreground">
              Explore the Nexus Avatar system with different roles, states, and sizes
            </p>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Preview */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center min-h-[400px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Avatar
              role={selectedRole}
              size={selectedSize}
              state={isAnimating ? selectedState : 'idle'}
              showName
              showTitle
            />
          </motion.div>

          {/* Controls */}
          <motion.div
            className="bg-card rounded-2xl border border-border p-6 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Role Selection */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Role</h3>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(role)}
                    className="capitalize"
                  >
                    {ROLE_LABELS[role]}
                  </Button>
                ))}
              </div>
            </div>

            {/* State Selection */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">State</h3>
              <div className="flex flex-wrap gap-2">
                {STATES.map(state => (
                  <Button
                    key={state}
                    variant={selectedState === state ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedState(state)}
                    className="capitalize"
                  >
                    {STATE_LABELS[state]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                    className="uppercase"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Animation Toggle */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <Button
                variant={isAnimating ? 'default' : 'outline'}
                onClick={() => setIsAnimating(!isAnimating)}
                className="flex items-center gap-2"
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAnimating ? 'Pause Animation' : 'Play Animation'}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* All Roles Gallery */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold mb-6">All Roles</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {ROLES.map((role, index) => (
              <motion.div
                key={role}
                className="flex flex-col items-center p-4 rounded-xl bg-background/50 hover:bg-background transition-colors cursor-pointer"
                onClick={() => setSelectedRole(role)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar
                  role={role}
                  size="md"
                  state="idle"
                  showName
                  showTitle={false}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* All States Gallery */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold mb-6">Animation States</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {STATES.map((state, index) => (
              <motion.div
                key={state}
                className="flex flex-col items-center p-4 rounded-xl bg-background/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <Avatar
                  role="default"
                  size="md"
                  state={state}
                  showName={false}
                  showTitle={false}
                />
                <span className="mt-3 text-sm text-muted-foreground capitalize">
                  {STATE_LABELS[state]}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Smart Avatar Demo */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-bold mb-2">Smart Avatar</h2>
          <p className="text-muted-foreground mb-6">
            SmartAvatar automatically detects the user's industry and shows the appropriate role
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(['legal', 'healthcare', 'retail', 'tech'] as const).map((industry, index) => (
              <motion.div
                key={industry}
                className="flex flex-col items-center p-4 rounded-xl bg-background/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <SmartAvatar
                  size="md"
                  state="listening"
                  userIndustry={industry}
                  showName
                  showTitle={false}
                />
                <span className="mt-3 text-xs text-muted-foreground capitalize">
                  {industry} Industry
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Size Comparison */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-6">Size Comparison</h2>
          <div className="flex items-end justify-center gap-8 flex-wrap">
            {SIZES.map((size, index) => (
              <motion.div
                key={size}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <Avatar
                  role="default"
                  size={size}
                  state="idle"
                  showName={false}
                  showTitle={false}
                />
                <span className="mt-3 text-sm text-muted-foreground uppercase font-medium">
                  {size}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Code Usage */}
        <motion.div
          className="bg-card rounded-2xl border border-border p-8 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-bold mb-4">Usage</h2>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300">
{`import { Avatar, SmartAvatar } from '@/components/Avatar'

// Basic usage
<Avatar role="default" size="md" state="idle" />

// With name and title
<Avatar
  role="lawyer"
  size="lg"
  state="speaking"
  showName
  showTitle
/>

// Smart avatar (auto-detects role from user industry)
<SmartAvatar
  userIndustry="healthcare"
  size="md"
  state="thinking"
/>`}
            </pre>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AvatarDemo
