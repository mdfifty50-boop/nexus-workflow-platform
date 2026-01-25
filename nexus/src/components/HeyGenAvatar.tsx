import { useEffect, useRef, useState, useCallback } from 'react'
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar'
import { getHeyGenAccessToken, getAvatarConfig, isHeyGenConfigured } from '@/services/heygen'

interface HeyGenAvatarProps {
  agentId: string
  size?: number
  isActive?: boolean
  isSpeaking?: boolean
  speakText?: string
  onReady?: () => void
  onError?: (error: Error) => void
  onSpeakEnd?: () => void
  autoStart?: boolean
  className?: string
}

export function HeyGenAvatar({
  agentId,
  size = 200,
  isActive = false,
  isSpeaking: _isSpeaking = false,
  speakText,
  onReady,
  onError,
  onSpeakEnd,
  autoStart = true,
  className = '',
}: HeyGenAvatarProps) {
  void _isSpeaking // Suppress unused variable warning
  const videoRef = useRef<HTMLVideoElement>(null)
  const avatarRef = useRef<StreamingAvatar | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [avatarTalking, setAvatarTalking] = useState(false)
  const initAttempted = useRef(false)

  const avatarConfig = getAvatarConfig(agentId)

  // Initialize the streaming avatar
  const initializeAvatar = useCallback(async () => {
    if (!isHeyGenConfigured() || initAttempted.current) {
      setIsLoading(false)
      return
    }

    initAttempted.current = true

    try {
      setIsLoading(true)
      setError(null)

      // Get access token
      const token = await getHeyGenAccessToken()

      // Create streaming avatar instance
      const avatar = new StreamingAvatar({ token })
      avatarRef.current = avatar

      // Set up event listeners
      avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('HeyGen stream ready for', agentId)
        if (videoRef.current && event.detail) {
          videoRef.current.srcObject = event.detail
          videoRef.current.play().catch(console.error)
        }
        setIsConnected(true)
        setIsLoading(false)
        onReady?.()
      })

      avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('HeyGen stream disconnected for', agentId)
        setIsConnected(false)
      })

      avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        setAvatarTalking(true)
      })

      avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        setAvatarTalking(false)
        onSpeakEnd?.()
      })

      // Start new session
      await avatar.createStartAvatar({
        quality: AvatarQuality.Low, // Use low quality for multiple avatars
        avatarName: avatarConfig.avatarId,
        voice: {
          voiceId: avatarConfig.voiceId,
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY,
        },
      })
    } catch (err) {
      console.error('Failed to initialize HeyGen avatar:', err)
      setError(err as Error)
      setIsLoading(false)
      onError?.(err as Error)
    }
  }, [agentId, avatarConfig, onReady, onError, onSpeakEnd])

  // Auto-start on mount
  useEffect(() => {
    if (autoStart && isHeyGenConfigured()) {
      // Small delay to stagger multiple avatar initializations
      const delay = Math.random() * 1000
      const timer = setTimeout(() => {
        initializeAvatar()
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  }, [autoStart, initializeAvatar])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (avatarRef.current) {
        avatarRef.current.stopAvatar()
        avatarRef.current = null
      }
    }
  }, [])

  // Speak text when provided
  useEffect(() => {
    if (speakText && avatarRef.current && isConnected) {
      avatarRef.current.speak({
        text: speakText,
        task_type: TaskType.REPEAT,
      }).catch(console.error)
    }
  }, [speakText, isConnected])

  // If not configured, show placeholder with gradient
  if (!isHeyGenConfigured()) {
    return (
      <div
        className={`relative rounded-full overflow-hidden ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
        >
          <span className="text-white font-bold text-lg">
            {avatarConfig.name.charAt(0)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden bg-slate-800 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="w-1/3 h-1/3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error/Fallback state - show initial */}
      {error && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
        >
          <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
            {avatarConfig.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Video element for streaming avatar */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{
          display: isConnected ? 'block' : 'none',
          transform: 'scaleX(-1)', // Mirror for natural appearance
        }}
      />

      {/* Speaking indicator */}
      {avatarTalking && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 bg-cyan-500 rounded-full animate-pulse"
              style={{
                height: size * 0.08,
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Active indicator ring */}
      {(isActive || avatarTalking) && isConnected && (
        <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-pulse pointer-events-none" />
      )}
    </div>
  )
}

// Compact version that also auto-starts
export function HeyGenAvatarCompact({
  agentId,
  size = 48,
  isActive = false,
  className = '',
}: {
  agentId: string
  size?: number
  isActive?: boolean
  className?: string
}) {
  return (
    <HeyGenAvatar
      agentId={agentId}
      size={size}
      isActive={isActive}
      autoStart={true}
      className={className}
    />
  )
}
