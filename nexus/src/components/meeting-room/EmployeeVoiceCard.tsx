import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from '@/components/icons/AgentAvatars'
import { Volume2, VolumeX, Mic, MicOff, Radio } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmployeeVoiceCardProps {
  agentId: string
  name: string
  role: string
  isActive?: boolean
  isSpeaking?: boolean
  isMuted?: boolean
  volume?: number
  onMuteToggle?: (agentId: string, muted: boolean) => void
  onVolumeChange?: (agentId: string, volume: number) => void
  onVoiceToggle?: (agentId: string, enabled: boolean) => void
  className?: string
}

export function EmployeeVoiceCard({
  agentId,
  name,
  role,
  isActive = false,
  isSpeaking = false,
  isMuted: externalMuted = false,
  volume: externalVolume = 75,
  onMuteToggle,
  onVolumeChange,
  onVoiceToggle,
  className,
}: EmployeeVoiceCardProps) {
  const [isMuted, setIsMuted] = useState(externalMuted)
  const [volume, setVolume] = useState(externalVolume)
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  // Sync external state
  useEffect(() => {
    setIsMuted(externalMuted)
  }, [externalMuted])

  useEffect(() => {
    setVolume(externalVolume)
  }, [externalVolume])

  const handleMuteToggle = () => {
    const newMuted = !isMuted
    setIsMuted(newMuted)
    onMuteToggle?.(agentId, newMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
    onVolumeChange?.(agentId, newVolume)
  }

  const handleVoiceToggle = () => {
    const newEnabled = !voiceEnabled
    setVoiceEnabled(newEnabled)
    onVoiceToggle?.(agentId, newEnabled)
  }

  return (
    <div
      className={cn(
        'relative group p-5 rounded-xl border-2 transition-all duration-300 backdrop-blur-sm',
        isActive
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800/70',
        isSpeaking && 'ring-2 ring-green-500 ring-offset-2 ring-offset-slate-900',
        className
      )}
    >
      {/* Speaking Indicator Badge */}
      {isSpeaking && (
        <div className="absolute -top-3 -right-3 z-20">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg animate-pulse">
            <Radio className="w-3.5 h-3.5 animate-ping" />
            <span>Speaking</span>
          </div>
        </div>
      )}

      {/* Active Indicator Badge */}
      {isActive && !isSpeaking && (
        <div className="absolute -top-3 -right-3 z-20">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      )}

      {/* Avatar and Info Section */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className={cn(
            'relative flex-shrink-0 transition-all duration-300',
            isSpeaking && 'ring-4 ring-green-500/50 rounded-full scale-105'
          )}
        >
          <AgentAvatar agentId={agentId} size={64} />

          {/* Speaking pulse effect */}
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full animate-ping bg-green-500/30" />
          )}

          {/* Voice status indicator */}
          <div
            className={cn(
              'absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center transition-all',
              voiceEnabled
                ? 'bg-green-500'
                : 'bg-slate-600'
            )}
          >
            {voiceEnabled ? (
              <Mic className="w-3 h-3 text-white" />
            ) : (
              <MicOff className="w-3 h-3 text-slate-300" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-white truncate mb-1">
            {name}
          </h3>
          <p className="text-sm text-slate-400 truncate mb-2">
            {role}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={voiceEnabled ? 'default' : 'outline'}
              onClick={handleVoiceToggle}
              className={cn(
                'h-7 px-2.5 text-xs font-medium transition-all',
                voiceEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              )}
            >
              {voiceEnabled ? (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  Voice On
                </>
              ) : (
                <>
                  <MicOff className="w-3 h-3 mr-1" />
                  Voice Off
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Voice Controls Section */}
      <div className="space-y-4 pt-4 border-t border-slate-700/50">
        {/* Mute Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant={isMuted ? 'destructive' : 'ghost'}
              onClick={handleMuteToggle}
              title={isMuted ? 'Unmute' : 'Mute'}
              className={cn(
                'w-9 h-9 transition-all',
                isMuted
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-slate-700 hover:bg-slate-600'
              )}
              disabled={!voiceEnabled}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <span className="text-sm font-medium text-slate-300">
              {isMuted ? 'Muted' : 'Unmuted'}
            </span>
          </div>
          <span className="text-sm font-bold text-white tabular-nums">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>

        {/* Volume Slider */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Volume Level
          </label>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={isMuted || !voiceEnabled}
              className="w-full h-2.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              style={{
                background: isMuted || !voiceEnabled
                  ? '#334155'
                  : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #334155 ${volume}%, #334155 100%)`,
              }}
            />
            {/* Volume level markers */}
            <div className="flex justify-between mt-1 px-0.5">
              {[0, 25, 50, 75, 100].map((mark) => (
                <span
                  key={mark}
                  className="text-[10px] text-slate-600 font-medium"
                >
                  {mark}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Speaking Waveform Animation */}
      {isSpeaking && voiceEnabled && (
        <div className="mt-5 pt-4 border-t border-green-500/20">
          <div className="flex items-center justify-center gap-1 h-12 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-lg">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-green-500 to-emerald-400 rounded-full shadow-lg shadow-green-500/50"
                style={{
                  height: `${12 + Math.sin(i * 0.7) * 20}px`,
                  animation: `pulse 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
          <p className="text-center text-xs font-medium text-green-400 mt-2">
            Audio Active
          </p>
        </div>
      )}

      {/* Voice Disabled Overlay */}
      {!voiceEnabled && (
        <div className="mt-5 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-center gap-2 p-3 bg-slate-700/50 rounded-lg">
            <MicOff className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-medium text-slate-400">
              Voice Disabled
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Grid Layout Component
interface EmployeeVoiceGridProps {
  agents: Array<{
    id: string
    name: string
    role: string
  }>
  activeAgentId?: string
  speakingAgentIds?: string[]
  onMuteToggle?: (agentId: string, muted: boolean) => void
  onVolumeChange?: (agentId: string, volume: number) => void
  onVoiceToggle?: (agentId: string, enabled: boolean) => void
  columns?: 2 | 3 | 4
  className?: string
}

export function EmployeeVoiceGrid({
  agents,
  activeAgentId,
  speakingAgentIds = [],
  onMuteToggle,
  onVolumeChange,
  onVoiceToggle,
  columns = 3,
  className,
}: EmployeeVoiceGridProps) {
  const gridColsMap = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4 w-full', gridColsMap[columns], className)}>
      {agents.map((agent) => (
        <EmployeeVoiceCard
          key={agent.id}
          agentId={agent.id}
          name={agent.name}
          role={agent.role}
          isActive={activeAgentId === agent.id}
          isSpeaking={speakingAgentIds.includes(agent.id)}
          onMuteToggle={onMuteToggle}
          onVolumeChange={onVolumeChange}
          onVoiceToggle={onVoiceToggle}
        />
      ))}
    </div>
  )
}

// Export default
export default EmployeeVoiceCard
