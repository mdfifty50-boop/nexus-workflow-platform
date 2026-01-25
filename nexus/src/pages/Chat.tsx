import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Bot,
  User,
  Mic,
  Paperclip,
  Settings,
  History,
  ChevronRight,
  Play,
} from 'lucide-react'
import clsx from 'clsx'

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
        { name: 'New Email with Attachment', app: 'Gmail', type: 'trigger', icon: '📧' },
        { name: 'Extract Attachment', app: 'Gmail', type: 'action', icon: '📎' },
        { name: 'Upload to Drive', app: 'Google Drive', type: 'action', icon: '💾' },
        { name: 'Send Notification', app: 'Slack', type: 'action', icon: '💬' },
      ],
      estimatedTime: '2 hours/week',
    },
  },
]

const quickSuggestions = [
  'Create a lead scoring workflow',
  'Sync contacts between HubSpot and Mailchimp',
  'Generate weekly reports from Google Sheets',
  'Auto-respond to customer inquiries',
]

const chatHistory = [
  { id: 1, title: 'Email Automation Setup', date: 'Today' },
  { id: 2, title: 'CRM Integration', date: 'Yesterday' },
  { id: 3, title: 'Slack Notifications', date: '2 days ago' },
  { id: 4, title: 'Report Generator', date: 'Last week' },
]

export default function Chat() {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const handleSend = () => {
    if (!message.trim()) return
    // Simulate sending
    setMessage('')
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)
  }

  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)] flex gap-4 sm:gap-6">
      {/* Chat history sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 card overflow-hidden"
          >
            <div className="p-4 border-b border-surface-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Chat History</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1 custom-scrollbar overflow-y-auto h-full">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  className="w-full p-3 rounded-xl text-left hover:bg-surface-800 transition-colors group"
                >
                  <p className="text-sm font-medium text-white truncate group-hover:text-nexus-400 transition-colors">
                    {chat.title}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{chat.date}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <div className="flex items-center gap-3">
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Nexus AI</h2>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Online
                </p>
              </div>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 space-y-4 sm:space-y-6">
          {sampleConversation.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                'flex gap-2 sm:gap-4',
                msg.role === 'user' && 'flex-row-reverse'
              )}
            >
              {/* Avatar */}
              <div className={clsx(
                'w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-nexus-500 to-accent-500'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
              )}>
                {msg.role === 'assistant' ? (
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>

              {/* Message content */}
              <div className={clsx(
                'flex-1 max-w-full sm:max-w-2xl min-w-0',
                msg.role === 'user' && 'flex flex-col items-end'
              )}>
                <div className={clsx(
                  'p-3 sm:p-4 rounded-xl sm:rounded-2xl',
                  msg.role === 'assistant'
                    ? 'bg-surface-800 border border-surface-700 rounded-tl-md'
                    : 'bg-gradient-to-r from-nexus-600 to-nexus-500 rounded-tr-md'
                )}>
                  <p className="text-sm sm:text-base text-white leading-relaxed">{msg.content}</p>
                </div>

                {/* Workflow preview card with mini node visualization */}
                {msg.workflow && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3 sm:mt-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700 w-full max-w-full sm:max-w-[540px]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-white text-sm sm:text-base truncate">{msg.workflow.name}</h4>
                        <p className="text-xs text-surface-400">
                          Saves ~{msg.workflow.estimatedTime}
                        </p>
                      </div>
                      <span className="flex-shrink-0 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Ready
                      </span>
                    </div>

                    {/* Mini workflow visualization - horizontal nodes with connectors */}
                    <div className="relative py-3 sm:py-4 px-1 sm:px-2 mb-3 sm:mb-4 bg-surface-900/50 rounded-lg sm:rounded-xl overflow-x-auto">
                      <div className="flex items-center min-w-max gap-0 pb-1">
                        {msg.workflow.steps.map((step, index) => (
                          <div key={index} className="flex items-center">
                            {/* Node */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                              className="flex flex-col items-center"
                            >
                              {/* Node icon container */}
                              <div className={clsx(
                                'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl shadow-lg relative',
                                step.type === 'trigger'
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30'
                                  : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30'
                              )}>
                                {step.icon}
                                {/* Pulse ring for trigger */}
                                {step.type === 'trigger' && (
                                  <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-xl border-2 border-blue-400"
                                  />
                                )}
                              </div>
                              {/* Node label */}
                              <p className="text-[10px] sm:text-xs text-white font-medium mt-1.5 sm:mt-2 text-center max-w-[60px] sm:max-w-[80px] truncate">
                                {step.name}
                              </p>
                              {/* App name */}
                              <p className="text-[9px] sm:text-[10px] text-surface-400 mt-0.5">{step.app}</p>
                              {/* Type badge */}
                              <span className={clsx(
                                'text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full mt-1 font-medium',
                                step.type === 'trigger'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-purple-500/20 text-purple-400'
                              )}>
                                {step.type}
                              </span>
                            </motion.div>

                            {/* Connector line */}
                            {index < msg.workflow.steps.length - 1 && (
                              <div className="flex items-center mx-1 sm:mx-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: 20 }}
                                  transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                                  className="h-0.5 bg-gradient-to-r from-surface-500 to-surface-600 relative sm:!w-8"
                                >
                                  {/* Arrow */}
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] sm:border-t-[4px] border-t-transparent border-b-[3px] sm:border-b-[4px] border-b-transparent border-l-[5px] sm:border-l-[6px] border-l-surface-500" />
                                </motion.div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full btn-gradient py-2.5 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-2 font-medium"
                    >
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Deploy Workflow
                    </motion.button>
                  </motion.div>
                )}

                <p className="text-xs text-surface-500 mt-2">
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
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-500 to-accent-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-surface-800 border border-surface-700 rounded-tl-md">
                  <div className="flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-surface-400 rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-surface-400 rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-surface-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick suggestions */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-t border-surface-800 overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-surface-500 flex-shrink-0">Try:</span>
            {quickSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMessage(suggestion)}
                className="flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs bg-surface-800 text-surface-300 hover:bg-surface-700 hover:text-white border border-surface-700 hover:border-surface-600 transition-all"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-2 sm:p-4 border-t border-surface-700">
          <div className="flex items-end gap-1.5 sm:gap-3">
            <button className="p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-colors">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Describe the workflow you want to create..."
                rows={1}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-surface-800/50 border border-surface-600 text-sm sm:text-base text-white placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-nexus-500/50 focus:border-nexus-500 resize-none transition-all"
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
            </div>
            <button className="p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-surface-800 text-surface-400 hover:text-white transition-colors">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!message.trim()}
              className={clsx(
                'p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all',
                message.trim()
                  ? 'bg-gradient-to-r from-nexus-500 to-accent-500 text-white shadow-lg shadow-nexus-500/30'
                  : 'bg-surface-800 text-surface-500'
              )}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
