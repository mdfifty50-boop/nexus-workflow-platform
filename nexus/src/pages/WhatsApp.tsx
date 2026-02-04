/**
 * WhatsApp Hub - WhatsApp Business Integration via Composio
 *
 * Features:
 * - Connection status display
 * - OAuth connection to WhatsApp Business
 * - Basic conversation view
 * - Send message capability (within 24-hour window)
 * - Template message sending
 *
 * @see NEXUS-EXECUTION-PLAN.md Task 1.1.4
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// =============================================================================
// TYPES
// =============================================================================

interface ConnectionStatus {
  connected: boolean
  businessName?: string
  phoneNumberId?: string
  accountId?: string
  tier?: string
}

interface Message {
  id: string
  direction: 'incoming' | 'outgoing'
  content: string
  timestamp: Date
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  from?: string
}

interface Conversation {
  phone: string
  name: string
  lastMessage: string
  lastMessageAt: Date
  unread: number
  messages: Message[]
}

// =============================================================================
// WHATSAPP ICON
// =============================================================================

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhatsApp() {
  const navigate = useNavigate()

  // Connection state
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check connection status on mount
  useEffect(() => {
    checkConnection()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const checkConnection = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp-composio/status')
      const data = await response.json()

      if (data.success) {
        setStatus({
          connected: data.connected,
          businessName: data.businessName,
          phoneNumberId: data.phoneNumberId,
          accountId: data.accountId,
          tier: data.tier,
        })
      } else {
        setStatus({ connected: false })
      }
    } catch (err) {
      console.error('Failed to check WhatsApp status:', err)
      setStatus({ connected: false })
      setError('Failed to check connection status')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)

      const response = await fetch('/api/whatsapp-composio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectUrl: `${window.location.origin}/whatsapp`,
        }),
      })

      const data = await response.json()

      if (data.alreadyConnected) {
        setStatus({
          connected: true,
          businessName: data.account?.businessName,
          phoneNumberId: data.account?.phoneNumberId,
        })
        return
      }

      if (data.authUrl) {
        // Open OAuth popup
        const popup = window.open(data.authUrl, 'whatsapp-oauth', 'width=600,height=700')

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch('/api/whatsapp-composio/status')
            const statusData = await statusResponse.json()

            if (statusData.connected) {
              clearInterval(pollInterval)
              popup?.close()
              setStatus({
                connected: true,
                businessName: statusData.businessName,
                phoneNumberId: statusData.phoneNumberId,
              })
            }
          } catch {
            // Keep polling
          }
        }, 3000)

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
          setConnecting(false)
        }, 5 * 60 * 1000)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      console.error('Failed to connect WhatsApp:', err)
      setError('Failed to initiate connection')
    } finally {
      setConnecting(false)
    }
  }

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || !newMessage.trim()) return

    try {
      setSending(true)

      const response = await fetch('/api/whatsapp-composio/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.phone,
          text: newMessage.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Add message to conversation
        const message: Message = {
          id: data.messageId || Date.now().toString(),
          direction: 'outgoing',
          content: newMessage.trim(),
          timestamp: new Date(),
          status: 'sent',
        }

        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message],
          lastMessage: newMessage.trim(),
          lastMessageAt: new Date(),
        } : null)

        setNewMessage('')
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }, [selectedConversation, newMessage])

  const handleStartConversation = () => {
    const phone = prompt('Enter phone number (E.164 format, e.g., +96550123456):')
    if (!phone) return

    const name = prompt('Enter contact name:') || phone

    const newConversation: Conversation = {
      phone,
      name,
      lastMessage: '',
      lastMessageAt: new Date(),
      unread: 0,
      messages: [],
    }

    setConversations(prev => [newConversation, ...prev])
    setSelectedConversation(newConversation)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Checking WhatsApp connection...</p>
        </div>
      </div>
    )
  }

  // Not connected state
  if (!status?.connected) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <WhatsAppLogo className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">WhatsApp Business</h1>
                  <p className="text-xs text-slate-400">Connect your account</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Connect Page */}
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <div className="p-8 bg-green-500/10 rounded-full mb-8">
              <WhatsAppLogo className="w-20 h-20 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              Connect WhatsApp Business
            </h2>
            <p className="text-lg text-slate-400 max-w-md mb-8">
              Connect your WhatsApp Business account to send messages, automate responses,
              and engage with customers directly through Nexus.
            </p>

            {error && (
              <div className="w-full max-w-md mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-lg"
            >
              {connecting ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <WhatsAppLogo className="w-6 h-6" />
                  Connect WhatsApp Business
                </>
              )}
            </button>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              {[
                { icon: '💬', title: 'Send Messages', desc: 'Chat with customers in the 24h window' },
                { icon: '📋', title: 'Use Templates', desc: 'Send approved templates anytime' },
                { icon: '🤖', title: 'AI Responses', desc: 'Auto-respond with Nexus AI' },
              ].map((feature, i) => (
                <div key={i} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <span className="text-2xl mb-2 block">{feature.icon}</span>
                  <h3 className="text-white font-medium text-sm mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Connected state - Chat interface
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <WhatsAppLogo className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">WhatsApp Business</h1>
                <p className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {status.businessName || 'Connected'}
                </p>
              </div>
            </div>

            <button
              onClick={checkConnection}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              title="Refresh status"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 border-r border-slate-800 flex flex-col">
          {/* Search & New Chat */}
          <div className="p-4 border-b border-slate-800">
            <button
              onClick={handleStartConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Conversation
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm">No conversations yet</p>
                <p className="text-slate-500 text-xs mt-1">Start a new conversation to begin</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.phone}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${
                    selectedConversation?.phone === conv.phone ? 'bg-slate-800/70' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 font-medium">{conv.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium truncate">{conv.name}</p>
                        <span className="text-slate-500 text-xs">
                          {conv.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm truncate">{conv.lastMessage || 'No messages yet'}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 font-medium">
                    {selectedConversation.name[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{selectedConversation.name}</p>
                  <p className="text-slate-400 text-xs">{selectedConversation.phone}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <WhatsAppLogo className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                      <p className="text-slate-400">No messages yet</p>
                      <p className="text-slate-500 text-sm">Send a message to start the conversation</p>
                    </div>
                  </div>
                ) : (
                  selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          msg.direction === 'outgoing'
                            ? 'bg-green-600 text-white rounded-br-md'
                            : 'bg-slate-800 text-white rounded-bl-md'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          msg.direction === 'outgoing' ? 'justify-end' : ''
                        }`}>
                          <span className="text-xs opacity-70">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.direction === 'outgoing' && msg.status && (
                            <span className="text-xs opacity-70">
                              {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-full text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-full transition-colors"
                  >
                    {sending ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-2 text-center">
                  Messages can only be sent within 24 hours of customer's last message
                </p>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                  <WhatsAppLogo className="w-12 h-12 text-slate-600" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">WhatsApp Business</h3>
                <p className="text-slate-400 max-w-sm">
                  Select a conversation from the sidebar or start a new one to begin messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WhatsApp
