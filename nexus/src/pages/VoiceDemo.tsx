/**
 * Voice Demo Page
 *
 * Demonstrates the ContinuousMic component with dialect detection
 */

import { useState } from 'react'
import { ContinuousMic } from '@/components/voice/ContinuousMic'
import type { Dialect } from '@/lib/voice/dialect-detector'

export default function VoiceDemo() {
  const [transcripts, setTranscripts] = useState<
    Array<{
      text: string
      dialect: Dialect
      confidence: number
      timestamp: Date
    }>
  >([])
  const [dialectHistory, setDialectHistory] = useState<
    Array<{
      dialect: Dialect
      confidence: number
      patterns: string[]
      timestamp: Date
    }>
  >([])

  const handleTranscript = (text: string, dialect: Dialect, confidence: number) => {
    setTranscripts((prev) => [
      {
        text,
        dialect,
        confidence,
        timestamp: new Date(),
      },
      ...prev.slice(0, 9), // Keep last 10
    ])
  }

  const handleDialectDetected = (dialect: Dialect, confidence: number, patterns: string[]) => {
    setDialectHistory((prev) => [
      {
        dialect,
        confidence,
        patterns,
        timestamp: new Date(),
      },
      ...prev.slice(0, 4), // Keep last 5
    ])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Voice Demo</h1>
              <p className="text-sm text-muted-foreground">
                Continuous listening with dialect detection
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Mic Interface */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Continuous Mic</h2>
              <ContinuousMic
                onTranscript={handleTranscript}
                onDialectDetected={handleDialectDetected}
                defaultContinuous={false}
                placeholder="Click the mic to start speaking..."
              />
            </div>

            {/* Features */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Features</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                    🎙️
                  </div>
                  <div>
                    <div className="font-medium text-sm">Continuous Mode</div>
                    <div className="text-xs text-muted-foreground">
                      Toggle to keep mic open during conversation
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    🔍
                  </div>
                  <div>
                    <div className="font-medium text-sm">Dialect Detection</div>
                    <div className="text-xs text-muted-foreground">
                      Automatically detects Kuwaiti, Saudi, Egyptian Arabic and more
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                    📊
                  </div>
                  <div>
                    <div className="font-medium text-sm">Confidence Scoring</div>
                    <div className="text-xs text-muted-foreground">
                      Shows detection confidence and matched patterns
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    🌊
                  </div>
                  <div>
                    <div className="font-medium text-sm">Visual Feedback</div>
                    <div className="text-xs text-muted-foreground">
                      Real-time waveform based on audio level
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Transcripts and History */}
          <div className="space-y-6">
            {/* Transcript History */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Transcript History</h2>
              {transcripts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No transcripts yet. Start speaking to see results.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transcripts.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm flex-1">{item.text}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className={`px-2 py-1 rounded ${
                            item.dialect.startsWith('ar')
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-cyan-500/20 text-cyan-400'
                          }`}
                        >
                          {item.dialect}
                        </span>
                        <span className="text-slate-400">
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dialect Detection History */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Dialect Detection History</h2>
              {dialectHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No dialect detections yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dialectHistory.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {item.dialect.includes('KW')
                              ? '🇰🇼'
                              : item.dialect.includes('SA')
                                ? '🇸🇦'
                                : item.dialect.includes('EG')
                                  ? '🇪🇬'
                                  : '🇺🇸'}
                          </span>
                          <span className="font-medium text-sm">{item.dialect}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              item.confidence > 0.7
                                ? 'bg-emerald-500'
                                : item.confidence > 0.4
                                  ? 'bg-amber-500'
                                  : 'bg-slate-500'
                            }`}
                            style={{ width: `${item.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      {item.patterns.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.patterns.slice(0, 3).map((pattern, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-slate-700/50 rounded text-slate-300"
                            >
                              {pattern}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supported Dialects */}
        <div className="mt-6 bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Supported Dialects</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
              { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
              { code: 'ar-KW', name: 'Kuwaiti', flag: '🇰🇼' },
              { code: 'ar-SA', name: 'Saudi', flag: '🇸🇦' },
              { code: 'ar-EG', name: 'Egyptian', flag: '🇪🇬' },
              { code: 'ar-AE', name: 'Emirati', flag: '🇦🇪' },
            ].map((dialect) => (
              <div
                key={dialect.code}
                className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 text-center"
              >
                <div className="text-2xl mb-1">{dialect.flag}</div>
                <div className="text-xs text-slate-300">{dialect.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
