import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeyGenAvatar, HeyGenAvatarCompact } from '@/components/HeyGenAvatar'
import { Button } from '@/components/ui/button'
import { isHeyGenConfigured, HEYGEN_AVATAR_MAP } from '@/services/heygen'

const AGENTS = ['larry', 'mary', 'alex', 'sam', 'emma', 'olivia', 'david', 'nexus']

export function HeyGenDemo() {
  const navigate = useNavigate()
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const [speakingAgent, setSpeakingAgent] = useState<string | null>(null)
  const [speakText, setSpeakText] = useState('')

  const configured = isHeyGenConfigured()

  const handleSpeak = (agentId: string) => {
    if (speakText.trim()) {
      setSpeakingAgent(agentId)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/workflow-demo')}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold">HeyGen Avatar Demo</h1>
              <p className="text-sm text-slate-400">AI-powered streaming video avatars</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            configured
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {configured ? 'API Connected' : 'API Not Configured'}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Banner */}
        {!configured && (
          <div className="mb-8 p-4 rounded-xl bg-amber-900/30 border border-amber-500/30">
            <h3 className="font-semibold text-amber-400 mb-2">HeyGen API Key Required</h3>
            <p className="text-sm text-slate-300">
              Add your HeyGen API key to <code className="bg-slate-800 px-1 rounded">.env</code> as{' '}
              <code className="bg-slate-800 px-1 rounded">VITE_HEYGEN_API_KEY</code> to enable streaming avatars.
            </p>
          </div>
        )}

        {/* Agent Grid */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Agent Avatars</h2>
          <p className="text-sm text-slate-400 mb-6">
            Click on an agent to activate their streaming avatar. {configured ? 'HeyGen streaming is enabled!' : 'Currently showing SVG fallback avatars.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {AGENTS.map((agentId) => {
              const config = HEYGEN_AVATAR_MAP[agentId]
              const isActive = activeAgent === agentId

              return (
                <div
                  key={agentId}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}
                  onClick={() => setActiveAgent(isActive ? null : agentId)}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Large Avatar Display */}
                    <div className="mb-4">
                      <HeyGenAvatar
                        agentId={agentId}
                        size={120}
                        isActive={isActive}
                        isSpeaking={speakingAgent === agentId}
                        speakText={speakingAgent === agentId ? speakText : undefined}
                        onSpeakEnd={() => setSpeakingAgent(null)}
                      />
                    </div>

                    <h3 className="font-semibold text-white">{config?.name || agentId}</h3>
                    <p className="text-xs text-slate-400 mt-1">{config?.description}</p>

                    {isActive && (
                      <div className="mt-3 text-xs text-cyan-400">
                        {configured ? 'Streaming Active' : 'Selected'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Speak Controls */}
        {configured && activeAgent && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-4">Make {HEYGEN_AVATAR_MAP[activeAgent]?.name} Speak</h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={speakText}
                onChange={(e) => setSpeakText(e.target.value)}
                placeholder="Enter text for the avatar to speak..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Button
                onClick={() => handleSpeak(activeAgent)}
                disabled={!speakText.trim() || speakingAgent === activeAgent}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6"
              >
                {speakingAgent === activeAgent ? 'Speaking...' : 'Speak'}
              </Button>
            </div>
          </section>
        )}

        {/* Compact Avatar Showcase */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Compact Avatars (for UI)</h2>
          <p className="text-sm text-slate-400 mb-6">
            These compact versions are used in workflow nodes and chat messages.
          </p>

          <div className="flex flex-wrap gap-4">
            {AGENTS.map((agentId) => (
              <div
                key={agentId}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700"
              >
                <HeyGenAvatarCompact agentId={agentId} size={40} isActive={false} />
                <span className="text-sm font-medium">{HEYGEN_AVATAR_MAP[agentId]?.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Avatar States Showcase */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Avatar States</h2>
          <p className="text-sm text-slate-400 mb-6">
            HeyGen avatars with different active states.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(['larry', 'mary', 'alex', 'sam'] as const).map((agentId, i) => (
              <div
                key={agentId}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-700 text-center"
              >
                <HeyGenAvatar
                  agentId={agentId}
                  size={80}
                  isActive={i % 2 === 0}
                />
                <p className="mt-4 text-sm font-medium capitalize">{agentId}</p>
                <p className="text-xs text-slate-500">{i % 2 === 0 ? 'Active' : 'Idle'}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
