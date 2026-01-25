import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AgentAvatar } from '@/components/icons/AgentAvatars'
import { Volume2, VolumeX, Mic } from 'lucide-react'

export interface Agent {
  id: string
  name: string
  role: string
  color?: string
}

export interface AgentVoiceCardProps {
  agent: Agent
  isActive?: boolean
  isSpeaking?: boolean
  onMuteToggle?: (agentId: string, muted: boolean) => void
  onVolumeChange?: (agentId: string, volume: number) => void
  initialVolume?: number
}

const DEFAULT_AGENTS: Agent[] = [
  { id: 'zara', name: 'Zara', role: 'Project Lead' },
  { id: 'ava', name: 'Ava', role: 'Design Lead' },
  { id: 'winston', name: 'Winston', role: 'Tech Lead' },
  { id: 'larry', name: 'Larry', role: 'Developer' },
  { id: 'mary', name: 'Mary', role: 'Developer' },
  { id: 'alex', name: 'Alex', role: 'QA Engineer' },
  { id: 'sam', name: 'Sam', role: 'DevOps' },
  { id: 'emma', name: 'Emma', role: 'Product Manager' },
  { id: 'david', name: 'David', role: 'Architect' },
  { id: 'olivia', name: 'Olivia', role: 'Data Scientist' },
  { id: 'nexus', name: 'Nexus', role: 'AI Coordinator' },
]

export function AgentVoiceCard({
  agent,
  isActive = false,
  isSpeaking = false,
  onMuteToggle,
  onVolumeChange,
  initialVolume = 75,
}: AgentVoiceCardProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(initialVolume)

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
    onMuteToggle?.(agent.id, !isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10)
    setVolume(newVolume)
    onVolumeChange?.(agent.id, newVolume)
  }

  return (
    <div
      className={`relative group p-4 rounded-lg border transition-all duration-200 ${
        isActive
          ? 'border-primary/50 bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-border/80'
      }`}
    >
      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
            <Mic className="w-3 h-3" />
            Speaking
          </div>
        </div>
      )}

      {/* Avatar and Info Section */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`relative flex-shrink-0 ${
            isSpeaking ? 'ring-2 ring-green-500 ring-offset-2 rounded-full' : ''
          }`}
        >
          <AgentAvatar agentId={agent.id} size={56} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {agent.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {agent.role}
          </p>
          {isActive && (
            <span className="inline-block mt-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Voice Controls Section */}
      <div className="space-y-3">
        {/* Mute Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant={isMuted ? 'destructive' : 'ghost'}
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="flex-shrink-0"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {isMuted ? 'Muted' : 'Active'}
          </span>
        </div>

        {/* Volume Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Volume
            </label>
            <span className="text-xs font-semibold text-foreground">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            disabled={isMuted}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: isMuted
                ? 'var(--color-muted)'
                : `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${isMuted ? 0 : volume}%, var(--color-muted) ${isMuted ? 0 : volume}%, var(--color-muted) 100%)`,
            }}
          />
        </div>
      </div>

      {/* Optional: Show speaking waveform animation */}
      {isSpeaking && (
        <div className="mt-3 flex items-center justify-center gap-1 h-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-green-500 rounded-full animate-pulse"
              style={{
                height: `${20 + i * 8}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Preset Agent Collection Component
interface AgentVoiceGridProps {
  agents?: Agent[]
  activeAgentId?: string
  speakingAgentIds?: string[]
  onMuteToggle?: (agentId: string, muted: boolean) => void
  onVolumeChange?: (agentId: string, volume: number) => void
  columns?: number
}

export function AgentVoiceGrid({
  agents = DEFAULT_AGENTS,
  activeAgentId,
  speakingAgentIds = [],
  onMuteToggle,
  onVolumeChange,
  columns = 3,
}: AgentVoiceGridProps) {
  return (
    <div
      className="grid gap-3 w-full"
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${columns === 2 ? '250px' : '280px'}, 1fr))`,
      }}
    >
      {agents.map((agent) => (
        <AgentVoiceCard
          key={agent.id}
          agent={agent}
          isActive={activeAgentId === agent.id}
          isSpeaking={speakingAgentIds.includes(agent.id)}
          onMuteToggle={onMuteToggle}
          onVolumeChange={onVolumeChange}
        />
      ))}
    </div>
  )
}

// Meeting Room Voice Panel Component
interface MeetingRoomVoicePanelProps {
  activeAgentId?: string
  speakingAgentIds?: string[]
  onMuteToggle?: (agentId: string, muted: boolean) => void
  onVolumeChange?: (agentId: string, volume: number) => void
  columns?: number
}

export function MeetingRoomVoicePanel({
  activeAgentId,
  speakingAgentIds = [],
  onMuteToggle,
  onVolumeChange,
  columns = 3,
}: MeetingRoomVoicePanelProps) {
  return (
    <div className="space-y-4">
      <div className="px-1">
        <h2 className="text-lg font-semibold">AI Team Voice Controls</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage voice for each AI employee in the meeting room
        </p>
      </div>
      <AgentVoiceGrid
        agents={DEFAULT_AGENTS}
        activeAgentId={activeAgentId}
        speakingAgentIds={speakingAgentIds}
        onMuteToggle={onMuteToggle}
        onVolumeChange={onVolumeChange}
        columns={columns}
      />
    </div>
  )
}
