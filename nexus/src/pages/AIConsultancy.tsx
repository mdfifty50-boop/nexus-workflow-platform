/**
 * AI Consultancy Page
 *
 * Full-page wrapper for the AIMeetingRoomV2 multi-agent consultancy.
 * Provides access to 8 specialized AI expert consultants.
 *
 * @NEXUS-FIX-176: Strategic consulting bridge - receives context from chat Deep Dive button - DO NOT REMOVE
 */

import { useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AIMeetingRoomV2 } from '@/components/AIMeetingRoomV2'

export function AIConsultancy() {
  const navigate = useNavigate()

  // @NEXUS-FIX-176: Read pre-loaded context from chat's Deep Dive button - DO NOT REMOVE
  // @NEXUS-FIX-197: Use useRef instead of useMemo to survive StrictMode double-mount.
  // StrictMode unmounts/remounts the component, so useMemo + localStorage.removeItem
  // causes the context to be deleted on first mount and unavailable on second mount.
  // useRef persists across the double-mount cycle. - DO NOT REMOVE
  const consultancyContextRef = useRef<Record<string, unknown> | null>(null)
  if (consultancyContextRef.current === null) {
    try {
      const raw = localStorage.getItem('nexus-consultancy-context')
      if (raw) {
        consultancyContextRef.current = JSON.parse(raw)
      }
    } catch { /* ignore parse errors */ }
  }
  const consultancyContext = consultancyContextRef.current as { question?: string; workflowId?: string; source?: string; returnTo?: string; chatHistory?: unknown[]; timestamp?: number } | null

  // Clean up localStorage AFTER component has stably mounted (deferred cleanup)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.removeItem('nexus-consultancy-context')
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // @NEXUS-FIX-176: "Back to Chat with Insights" — collect discussion summary and return - DO NOT REMOVE
  const handleBackToChat = useCallback(() => {
    // Read current discussion messages from the AIMeetingRoomV2 state via localStorage
    try {
      const discussionRaw = localStorage.getItem('nexus-consultancy-discussion')
      if (discussionRaw) {
        const discussion = JSON.parse(discussionRaw) as Array<{ agentName: string; content: string }>
        // Build a concise summary of the consultancy discussion
        const summaryLines = discussion
          .filter(m => m.content && m.content.length > 20)
          .slice(-6)  // Last 6 meaningful messages
          .map(m => `**${m.agentName}**: ${m.content.substring(0, 150)}${m.content.length > 150 ? '...' : ''}`)
        const summary = summaryLines.join('\n\n')
        if (summary) {
          localStorage.setItem('nexus-consultancy-result', JSON.stringify({
            summary,
            question: consultancyContext?.question || '',
            timestamp: Date.now()
          }))
        }
        localStorage.removeItem('nexus-consultancy-discussion')
      }
    } catch { /* ignore errors */ }
    navigate('/chat')
  }, [navigate, consultancyContext])

  return (
    <AIMeetingRoomV2
      isOpen={true}
      onClose={handleBackToChat}
      workflowContext={consultancyContext?.question || undefined}
      workflowTitle={consultancyContext?.question?.substring(0, 100) || undefined}
      mode="brainstorm"
      fullPage={true}
    />
  )
}

export default AIConsultancy
