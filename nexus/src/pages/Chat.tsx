import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import {
  Send,
  User,
  Mic,
  Paperclip,
  Settings,
  History,
  ChevronDown,
  Play,
  Sparkles,
  X,
  MessageSquare,
  Clock,
  ChevronUp,
} from 'lucide-react'
import clsx from 'clsx'
// @NEXUS-FIX-090: Role-based avatar integration
import { Avatar } from '@/components/Avatar'

// =============================================================================
// SAMPLE DATA
// =============================================================================

const sampleConversation = [
  {
    id: 1,
    role: 'assistant',
    content: "Hello! I'm Nexus, your AI workflow assistant. How can I help you automate your work today?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    role: 'user',
    content: 'I want to automatically save Gmail attachments to Google Drive and notify me on Slack',
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: 3,
    role: 'assistant',
    content: "Great idea! I'll create a workflow that monitors your Gmail for new attachments, saves them to a designated Google Drive folder, and sends you a Slack notification with the file details.",
    timestamp: new Date(Date.now() - 180000),
    workflow: {
      name: 'Gmail Attachments to Drive + Slack',
      steps: [
        { name: 'New Email', app: 'Gmail', type: 'trigger', icon: '📧', color: 'from-red-500 to-red-600' },
        { name: 'Extract', app: 'Gmail', type: 'action', icon: '📎', color: 'from-red-400 to-red-500' },
        { name: 'Upload', app: 'Drive', type: 'action', icon: '💾', color: 'from-green-500 to-green-600' },
        { name: 'Notify', app: 'Slack', type: 'action', icon: '💬', color: 'from-purple-500 to-purple-600' },
      ],
      estimatedTime: '2 hours/week',
    },
  },
]

const quickSuggestions = [
  { icon: '📊', text: 'Lead scoring workflow' },
  { icon: '🔄', text: 'Sync HubSpot + Mailchimp' },
  { icon: '📈', text: 'Weekly reports' },
  { icon: '💬', text: 'Auto-respond to inquiries' },
]

const chatHistory = [
  { id: 1, title: 'Email Automation Setup', date: 'Today', preview: 'Gmail attachments to Drive...', unread: true },
  { id: 2, title: 'CRM Integration', date: 'Yesterday', preview: 'Syncing contacts between...', unread: false },
  { id: 3, title: 'Slack Notifications', date: '2 days ago', preview: 'Alert team when...', unread: false },
  { id: 4, title: 'Report Generator', date: 'Last week', preview: 'Weekly sales summary...', unread: false },
  { id: 5, title: 'Invoice Automation', date: 'Last week', preview: 'Auto-generate invoices...', unread: false },
]

// =============================================================================
// MOBILE BOTTOM SHEET COMPONENT
// =============================================================================

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
}

function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const opacity = useTransform(y, [0, 300], [1, 0])
  const backdropOpacity = useTransform(y, [0, 300], [0.6, 0])

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 500 || info.offset.y > 150) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          >
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-t-3xl max-h-[85vh] overflow-hidden border-t border-slate-700/50 shadow-2xl">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-slate-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[70vh] overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// WORKFLOW PREVIEW CARD (MOBILE OPTIMIZED)
// =============================================================================

interface WorkflowStep {
  name: string
  app: string
  type: string
  icon: string
  color: string
}

interface MobileWorkflowCardProps {
  name: string
  steps: WorkflowStep[]
  estimatedTime: string
}

function MobileWorkflowCard({ name, steps, estimatedTime }: MobileWorkflowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, type: 'spring', damping: 20 }}
      className="mt-3 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 overflow-hidden backdrop-blur-xl"
    >
      {/* Header with gradient accent */}
      <div className="relative px-4 pt-4 pb-3">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white text-sm leading-tight truncate">{name}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <Clock className="w-3 h-3" />
                Saves {estimatedTime}
              </span>
            </div>
          </div>
          <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wide">
            Ready
          </span>
        </div>
      </div>

      {/* Horizontal scrolling workflow nodes */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-shrink-0">
              {/* Node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.08 }}
                className="flex flex-col items-center"
              >
                <div className={clsx(
                  'w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-lg relative',
                  `bg-gradient-to-br ${step.color}`
                )}>
                  {step.icon}
                  {step.type === 'trigger' && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-xl border-2 border-white/30"
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-300 font-medium mt-1.5 text-center max-w-[50px] truncate">
                  {step.name}
                </p>
              </motion.div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className="w-6 h-0.5 bg-gradient-to-r from-slate-500 to-slate-600 mx-1 origin-left"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:shadow-cyan-500/40 transition-shadow"
        >
          <Play className="w-4 h-4" />
          Deploy Workflow
        </motion.button>
      </div>
    </motion.div>
  )
}

// =============================================================================
// MAIN CHAT COMPONENT
// =============================================================================

export default function Chat() {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sampleConversation, isTyping])

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleSend = () => {
    if (!message.trim()) return
    setMessage('')
    setShowSuggestions(false)
    setIsTyping(true)
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setTimeout(() => setIsTyping(false), 2000)
  }

  return (
    <div className="h-[100dvh] md:h-[calc(100vh-7rem)] flex flex-col md:flex-row md:gap-6 bg-slate-950 md:bg-transparent">
      {/* Desktop sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:flex flex-col flex-shrink-0 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-400" />
                  Chat History
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full p-3 rounded-xl text-left hover:bg-slate-800/70 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                          {chat.title}
                        </p>
                        {chat.unread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{chat.preview}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{chat.date}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet for history */}
      <BottomSheet
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Chat History"
      >
        <div className="p-4 space-y-2">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full p-4 rounded-xl bg-slate-800/50 text-left active:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {chat.title}
                    </p>
                    {chat.unread && (
                      <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">{chat.preview}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5">{chat.date}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 md:bg-slate-900/50 md:backdrop-blur-xl md:border md:border-slate-700/50 md:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 md:py-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl safe-area-top">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95"
            >
              <History className="w-5 h-5" />
            </button>
            {/* @NEXUS-FIX-090: Chat header with Avatar */}
            <div className="flex items-center gap-3">
              <Avatar
                role="default"
                size="sm"
                state={isTyping ? 'thinking' : 'idle'}
                showName={false}
                showTitle={false}
              />
              <div>
                <h2 className="font-semibold text-white text-sm md:text-base">Nexus AI</h2>
                <p className="text-[10px] md:text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>
          </div>
          <button className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6">
          {sampleConversation.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'flex gap-3',
                msg.role === 'user' && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              {msg.role === 'assistant' ? (
                <Avatar
                  role="default"
                  size="sm"
                  state="idle"
                  showName={false}
                  showTitle={false}
                  className="flex-shrink-0 hidden md:flex"
                />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-purple-500/20 hidden md:flex">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              )}

              {/* Message bubble */}
              <div className={clsx(
                'flex flex-col max-w-[85%] md:max-w-[70%]',
                msg.role === 'user' && 'items-end'
              )}>
                <div className={clsx(
                  'px-4 py-3 rounded-2xl',
                  msg.role === 'assistant'
                    ? 'bg-slate-800/80 border border-slate-700/50 rounded-tl-md'
                    : 'bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-tr-md shadow-lg shadow-cyan-500/20'
                )}>
                  <p className="text-sm md:text-[15px] text-white leading-relaxed">{msg.content}</p>
                </div>

                {/* Workflow preview (mobile optimized) */}
                {msg.workflow && (
                  <MobileWorkflowCard
                    name={msg.workflow.name}
                    steps={msg.workflow.steps}
                    estimatedTime={msg.workflow.estimatedTime}
                  />
                )}

                <p className="text-[10px] text-slate-500 mt-1.5 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3 items-start"
              >
                <Avatar
                  role="default"
                  size="sm"
                  state="thinking"
                  showName={false}
                  showTitle={false}
                  className="hidden md:flex"
                />
                <div className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-md">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{
                          y: [0, -4, 0],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.15
                        }}
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions - collapsible on mobile */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-shrink-0 border-t border-slate-800/50 overflow-hidden"
            >
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Suggestions
                  </span>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 md:hidden"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {quickSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setMessage(suggestion.text)
                        inputRef.current?.focus()
                      }}
                      className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-slate-800/70 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all active:bg-slate-700"
                    >
                      <span>{suggestion.icon}</span>
                      <span>{suggestion.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed suggestions toggle (mobile) */}
        {!showSuggestions && (
          <button
            onClick={() => setShowSuggestions(true)}
            className="flex-shrink-0 flex items-center justify-center gap-1 py-2 text-xs text-slate-500 hover:text-slate-400 border-t border-slate-800/50 md:hidden"
          >
            <ChevronUp className="w-3 h-3" />
            Show suggestions
          </button>
        )}

        {/* Input area - glass morphism floating bar */}
        <div className="flex-shrink-0 p-3 md:p-4 border-t border-slate-800/50 bg-slate-900/90 backdrop-blur-xl safe-area-bottom">
          <div className="flex items-end gap-2 md:gap-3">
            <button className="p-2.5 md:p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95 flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Describe your workflow..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm md:text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none transition-all"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>

            <button className="p-2.5 md:p-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95 flex-shrink-0 hidden md:flex">
              <Mic className="w-5 h-5" />
            </button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!message.trim()}
              className={clsx(
                'p-3 rounded-xl transition-all flex-shrink-0',
                message.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 active:shadow-cyan-500/50'
                  : 'bg-slate-800 text-slate-500'
              )}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
