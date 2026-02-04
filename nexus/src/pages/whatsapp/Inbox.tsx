/**
 * WhatsApp Inbox Page
 *
 * Live chat interface for WhatsApp Business conversations.
 * Features:
 * - View all conversations
 * - Real-time message updates
 * - Reply to customers (24h session window)
 * - Send template messages (outside 24h)
 * - Assign conversations to team members
 * - Quick replies and canned responses
 *
 * Uses AiSensy Messages API and webhook for real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface Message {
  id: string
  direction: 'incoming' | 'outgoing'
  content: string
  type: 'text' | 'image' | 'video' | 'document' | 'audio'
  mediaUrl?: string
  timestamp: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
}

interface Conversation {
  id: string
  contactName: string
  phoneNumber: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isInSession: boolean // Within 24h window
  tags: string[]
}

interface QuickReply {
  id: string
  label: string
  message: string
}

// =============================================================================
// ICONS
// =============================================================================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function DoubleCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  )
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}

// =============================================================================
// QUICK REPLIES (Canned Responses)
// =============================================================================

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: '1', label: 'Greeting', message: 'Hello! Thank you for contacting us. How can I help you today?' },
  { id: '2', label: 'Hours', message: 'Our business hours are Sunday-Thursday, 8:00 AM - 5:00 PM (Kuwait Time).' },
  { id: '3', label: 'Thanks', message: 'Thank you for your message. We will get back to you shortly.' },
  { id: '4', label: 'Follow-up', message: 'Just checking in - do you need any further assistance?' }
]

// =============================================================================
// MESSAGE COMPONENT
// =============================================================================

function MessageBubble({ message }: { message: Message }) {
  const isOutgoing = message.direction === 'outgoing'
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const getStatusIcon = () => {
    if (!isOutgoing) return null
    switch (message.status) {
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-slate-500" />
      case 'delivered':
        return <DoubleCheckIcon className="w-3 h-3 text-slate-400" />
      case 'read':
        return <DoubleCheckIcon className="w-3 h-3 text-blue-400" />
      case 'failed':
        return <span className="text-red-400 text-xs">Failed</span>
      default:
        return <ClockIcon className="w-3 h-3 text-slate-500" />
    }
  }

  return (
    <div className={cn('flex', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOutgoing
            ? 'bg-green-600 text-white rounded-br-md'
            : 'bg-slate-800 text-white rounded-bl-md'
        )}
      >
        {message.type === 'image' && message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="Media"
            className="rounded-lg mb-2 max-w-full"
          />
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={cn(
          'flex items-center gap-1 mt-1',
          isOutgoing ? 'justify-end' : 'justify-start'
        )}>
          <span className={cn(
            'text-[10px]',
            isOutgoing ? 'text-green-200' : 'text-slate-500'
          )}>
            {time}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CONVERSATION LIST ITEM
// =============================================================================

function ConversationItem({
  conversation,
  isSelected,
  onClick
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) {
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex items-start gap-3 hover:bg-slate-800/50 transition-colors text-left',
        isSelected && 'bg-slate-800/70'
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-green-400 font-medium">
          {conversation.contactName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-white truncate">{conversation.contactName}</span>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {timeAgo(conversation.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400 truncate">{conversation.lastMessage}</p>
          {conversation.unreadCount > 0 && (
            <span className="ml-2 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center flex-shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
        {!conversation.isInSession && (
          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs">
            <ClockIcon className="w-3 h-3" />
            Session expired
          </span>
        )}
      </div>
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhatsAppInbox() {
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showQuickReplies, setShowQuickReplies] = useState(false)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp-business/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (phoneNumber: string) => {
    try {
      const response = await fetch(`/api/whatsapp-business/messages/${encodeURIComponent(phoneNumber)}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.phoneNumber)
      // Poll for new messages in selected conversation
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.phoneNumber)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selectedConversation, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      const endpoint = selectedConversation.isInSession
        ? '/api/whatsapp-business/reply'
        : '/api/whatsapp-business/send'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedConversation.phoneNumber,
          message: newMessage.trim(),
          // For template messages when outside session
          templateName: selectedConversation.isInSession ? undefined : 'follow_up'
        })
      })

      if (response.ok) {
        setNewMessage('')
        await fetchMessages(selectedConversation.phoneNumber)
      } else {
        const error = await response.json()
        console.error('Failed to send message:', error)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Handle quick reply
  const handleQuickReply = (reply: QuickReply) => {
    setNewMessage(reply.message)
    setShowQuickReplies(false)
  }

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phoneNumber.includes(searchQuery)
  )

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/whatsapp')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <BackIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <WhatsAppLogo className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Inbox</h1>
                  <p className="text-xs text-slate-400">
                    {conversations.filter(c => c.unreadCount > 0).length} unread conversations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-slate-800 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <InboxIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No conversations yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Messages from customers will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-medium">
                      {selectedConversation.contactName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-medium text-white">{selectedConversation.contactName}</h2>
                    <p className="text-xs text-slate-400">{selectedConversation.phoneNumber}</p>
                  </div>
                </div>
                {!selectedConversation.isInSession && (
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    <span>24h session expired - Use templates only</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Popup */}
              {showQuickReplies && (
                <div className="border-t border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Quick Replies</span>
                    <button
                      onClick={() => setShowQuickReplies(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply.id}
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex items-end gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Quick Replies"
                    >
                      <LightningIcon className="w-5 h-5" />
                    </button>
                    {!selectedConversation.isInSession && (
                      <button
                        onClick={() => navigate('/whatsapp/broadcasts')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Send Template"
                      >
                        <TemplateIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={
                        selectedConversation.isInSession
                          ? 'Type a message...'
                          : 'Session expired - Use templates or quick replies'
                      }
                      rows={1}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SendIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="p-4 bg-slate-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <InboxIcon className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
                <p className="text-slate-400">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WhatsAppInbox
