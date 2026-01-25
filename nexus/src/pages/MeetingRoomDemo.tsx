import { useState } from 'react'
import { EmployeeVoiceGrid } from '@/components/meeting-room/EmployeeVoiceCard'
import { Button } from '@/components/ui/button'

function MeetingRoomDemo() {
  const [activeAgentId, setActiveAgentId] = useState<string>('zara')
  const [speakingAgentIds, setSpeakingAgentIds] = useState<string[]>(['zara'])
  const [muteSettings, setMuteSettings] = useState<Record<string, boolean>>({})
  const [volumeSettings, setVolumeSettings] = useState<Record<string, number>>({})

  // Simulate agents speaking sequentially
  const agents = [
    { id: 'zara', name: 'Zara', role: 'Project Lead' },
    { id: 'ava', name: 'Ava', role: 'Design Lead' },
    { id: 'winston', name: 'Winston', role: 'Tech Lead' },
    { id: 'larry', name: 'Larry', role: 'Developer' },
    { id: 'mary', name: 'Mary', role: 'Developer' },
    { id: 'alex', name: 'Alex', role: 'QA Engineer' },
  ]

  const handleStartMeeting = () => {
    // Simulate conversation
    let speakingIndex = 0
    setSpeakingAgentIds([agents[0].id])

    const interval = setInterval(() => {
      speakingIndex++
      if (speakingIndex < agents.length) {
        setSpeakingAgentIds([agents[speakingIndex].id])
        setActiveAgentId(agents[speakingIndex].id)
      } else {
        clearInterval(interval)
        setSpeakingAgentIds([])
      }
    }, 3000)
  }

  const handleStopMeeting = () => {
    setSpeakingAgentIds([])
    setActiveAgentId('')
  }

  const handleMuteToggle = (agentId: string, isMuted: boolean) => {
    setMuteSettings((prev) => ({
      ...prev,
      [agentId]: isMuted,
    }))
  }

  const handleVolumeChange = (agentId: string, volume: number) => {
    setVolumeSettings((prev) => ({
      ...prev,
      [agentId]: volume,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Meeting Room</h1>
              <p className="text-slate-400 mt-1">
                AI Employee Voice Controls & Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="cta"
                onClick={handleStartMeeting}
                className="gap-2"
              >
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Start Meeting
              </Button>
              <Button
                variant="outline"
                onClick={handleStopMeeting}
              >
                End Meeting
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Meeting Status</p>
            <p className="text-2xl font-bold text-white mt-2">
              {speakingAgentIds.length > 0 ? 'In Progress' : 'Idle'}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Active Speaker</p>
            <p className="text-2xl font-bold text-white mt-2">
              {speakingAgentIds[0]
                ? agents.find((a) => a.id === speakingAgentIds[0])?.name
                : 'None'}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm">Participants</p>
            <p className="text-2xl font-bold text-white mt-2">{agents.length}</p>
          </div>
        </div>

        {/* Voice Controls Grid */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">AI Employee Voice Controls</h2>
          <EmployeeVoiceGrid
            agents={agents}
            activeAgentId={activeAgentId}
            speakingAgentIds={speakingAgentIds}
            onMuteToggle={handleMuteToggle}
            onVolumeChange={handleVolumeChange}
            columns={3}
          />
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Features */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">
                  Individual voice controls for each AI employee
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">
                  Real-time speaking indicators with waveform animation
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">
                  Per-agent volume control and mute toggles
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">
                  Active speaker highlighting
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-400 mt-1">✓</span>
                <span className="text-slate-300">
                  Clean, professional card-based layout
                </span>
              </li>
            </ul>
          </div>

          {/* Current Settings */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Current Settings
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-2">Muted Agents:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(muteSettings)
                    .filter(([, isMuted]) => isMuted)
                    .map(([agentId]) => (
                      <span
                        key={agentId}
                        className="px-3 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30"
                      >
                        {agents.find((a) => a.id === agentId)?.name}
                      </span>
                    ))}
                  {Object.values(muteSettings).filter((m) => m).length ===
                    0 && (
                    <span className="text-slate-400 text-sm">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Volume Levels:</p>
                <div className="space-y-1 text-xs">
                  {agents.slice(0, 3).map((agent) => (
                    <div
                      key={agent.id}
                      className="flex justify-between text-slate-300"
                    >
                      <span>{agent.name}:</span>
                      <span className="font-mono">
                        {muteSettings[agent.id]
                          ? '0%'
                          : `${volumeSettings[agent.id] || 75}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Usage Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div>
              <p className="font-medium text-blue-300 mb-2">Mute/Unmute</p>
              <p>
                Click the volume icon on any agent card to mute or unmute their
                voice
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-300 mb-2">Volume Control</p>
              <p>
                Use the slider to adjust the volume level for each agent
                independently
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-300 mb-2">Speaking Status</p>
              <p>
                Watch the green indicator and waveform animation when an agent
                is speaking
              </p>
            </div>
            <div>
              <p className="font-medium text-blue-300 mb-2">Active Speaker</p>
              <p>
                The highlighted card with blue border indicates the current
                active agent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { MeetingRoomDemo as default }
