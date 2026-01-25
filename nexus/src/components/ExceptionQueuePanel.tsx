/**
 * Exception Queue Panel - Human-in-the-Loop Review Interface
 *
 * Displays pending exceptions that require human review/approval.
 * Supports Arabic RTL layout and provides approve/reject/modify actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  exceptionQueue,
  type ExceptionQueueItem,
  type ExceptionStats,
  type ExceptionUrgency,
  type ExceptionType,
  type DecisionAction,
} from '@/lib/workflow-engine/exception-queue'

// ========================================
// Types
// ========================================

interface ExceptionQueuePanelProps {
  userId: string
  onDecision?: (item: ExceptionQueueItem, action: DecisionAction, payload?: unknown) => void
  maxVisible?: number
  className?: string
  isRTL?: boolean
  language?: 'en' | 'ar'
}

interface ExceptionCardProps {
  item: ExceptionQueueItem
  onApprove: () => void
  onReject: (reason: string) => void
  onModify: (payload: unknown, reason?: string) => void
  onStartReview: () => void
  isRTL: boolean
  language: 'en' | 'ar'
}

// ========================================
// Helper Functions
// ========================================

const getUrgencyConfig = (urgency: ExceptionUrgency, isRTL: boolean) => {
  const configs = {
    immediate: {
      icon: isRTL ? '!' : '!',
      color: 'text-red-400 bg-red-500/20 border-red-500/30',
      label: isRTL ? 'عاجل' : 'Immediate',
      pulse: true,
    },
    today: {
      icon: isRTL ? '!' : '!',
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      label: isRTL ? 'اليوم' : 'Today',
      pulse: false,
    },
    flexible: {
      icon: isRTL ? '!' : '!',
      color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
      label: isRTL ? 'مرن' : 'Flexible',
      pulse: false,
    },
  }
  return configs[urgency]
}

const getTypeConfig = (type: ExceptionType, isRTL: boolean) => {
  const configs = {
    uncertain_decision: {
      icon: '?',
      label: isRTL ? 'قرار غير مؤكد' : 'Uncertain Decision',
      color: 'text-purple-400',
    },
    high_value_action: {
      icon: '$',
      label: isRTL ? 'قيمة عالية' : 'High Value',
      color: 'text-emerald-400',
    },
    missing_information: {
      icon: '?',
      label: isRTL ? 'معلومات ناقصة' : 'Missing Info',
      color: 'text-cyan-400',
    },
    service_error: {
      icon: '!',
      label: isRTL ? 'خطأ في الخدمة' : 'Service Error',
      color: 'text-red-400',
    },
    policy_violation: {
      icon: '!',
      label: isRTL ? 'انتهاك السياسة' : 'Policy Violation',
      color: 'text-orange-400',
    },
    approval_required: {
      icon: '!',
      label: isRTL ? 'موافقة مطلوبة' : 'Approval Required',
      color: 'text-blue-400',
    },
    custom: {
      icon: '!',
      label: isRTL ? 'مخصص' : 'Custom',
      color: 'text-slate-400',
    },
  }
  return configs[type]
}

const formatTimeAgo = (dateString: string, isRTL: boolean): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return isRTL ? 'الآن' : 'Just now'
  if (diffMins < 60) return isRTL ? `${diffMins} دقيقة` : `${diffMins}m ago`
  if (diffHours < 24) return isRTL ? `${diffHours} ساعة` : `${diffHours}h ago`
  return isRTL ? `${diffDays} يوم` : `${diffDays}d ago`
}

// ========================================
// Exception Card Component
// ========================================

function ExceptionCard({
  item,
  onApprove,
  onReject,
  onModify,
  onStartReview,
  isRTL,
  language,
}: ExceptionCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showModifyForm, setShowModifyForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [modifyReason, setModifyReason] = useState('')
  const [modifyPayload, setModifyPayload] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const urgencyConfig = getUrgencyConfig(item.urgency, isRTL)
  const typeConfig = getTypeConfig(item.exceptionType, isRTL)
  const title = language === 'ar' && item.titleAr ? item.titleAr : item.title
  const description = language === 'ar' && item.descriptionAr ? item.descriptionAr : item.description

  const handleApprove = async () => {
    setIsSubmitting(true)
    await onApprove()
    setIsSubmitting(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setIsSubmitting(true)
    await onReject(rejectReason)
    setIsSubmitting(false)
    setShowRejectForm(false)
    setRejectReason('')
  }

  const handleModify = async () => {
    try {
      const payload = modifyPayload ? JSON.parse(modifyPayload) : {}
      setIsSubmitting(true)
      await onModify(payload, modifyReason || undefined)
      setIsSubmitting(false)
      setShowModifyForm(false)
      setModifyPayload('')
      setModifyReason('')
    } catch {
      // Invalid JSON - show error
      console.error('Invalid JSON in modify payload')
    }
  }

  // Mark as reviewing when card is interacted with
  useEffect(() => {
    if (item.status === 'pending' && (showRejectForm || showModifyForm)) {
      onStartReview()
    }
  }, [showRejectForm, showModifyForm, item.status, onStartReview])

  return (
    <div
      className={`
        relative bg-slate-800/50 rounded-xl border transition-all group
        ${urgencyConfig.color}
        hover:border-slate-500
        ${isRTL ? 'text-right' : 'text-left'}
      `}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Urgency indicator pulse */}
      {urgencyConfig.pulse && (
        <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0
            ${typeConfig.color} bg-current/10
          `}>
            {typeConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`
                px-2 py-0.5 rounded text-xs font-medium
                ${urgencyConfig.color}
              `}>
                {urgencyConfig.label}
              </span>
            </div>
            <h4 className="font-semibold text-white text-sm line-clamp-1">
              {title}
            </h4>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {description}
        </p>

        {/* Context info */}
        {item.context.aiConfidence !== undefined && (
          <div className={`
            bg-slate-900/50 rounded-lg p-3 mb-4
            ${isRTL ? 'text-right' : 'text-left'}
          `}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-slate-500 text-xs">
                {isRTL ? 'ثقة الذكاء الاصطناعي:' : 'AI Confidence:'}
              </span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.context.aiConfidence < 0.5
                      ? 'bg-red-500'
                      : item.context.aiConfidence < 0.7
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${item.context.aiConfidence * 100}%` }}
                />
              </div>
              <span className="text-slate-400 text-xs font-medium">
                {Math.round(item.context.aiConfidence * 100)}%
              </span>
            </div>
            {item.context.aiReasoning && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                {item.context.aiReasoning}
              </p>
            )}
          </div>
        )}

        {/* High value indicator */}
        {item.context.estimatedValue !== undefined && (
          <div className={`
            bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4
            ${isRTL ? 'text-right' : 'text-left'}
          `}>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-emerald-400 text-lg">$</span>
              <span className="text-emerald-300 font-semibold">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: item.context.currency || 'USD',
                }).format(item.context.estimatedValue)}
              </span>
              {item.context.affectedRecords && (
                <span className="text-slate-500 text-xs">
                  ({item.context.affectedRecords} {isRTL ? 'سجل' : 'records'})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Service error info */}
        {item.context.serviceError && (
          <div className={`
            bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4
            ${isRTL ? 'text-right' : 'text-left'}
          `}>
            <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className="text-red-400 text-sm font-medium">
                {item.context.serviceError.service}
              </span>
              <code className="text-red-300 text-xs bg-red-500/20 px-1.5 py-0.5 rounded">
                {item.context.serviceError.errorCode}
              </code>
            </div>
            <p className="text-xs text-red-300/80">
              {item.context.serviceError.message}
            </p>
          </div>
        )}

        {/* Alternatives */}
        {item.context.alternatives && item.context.alternatives.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">
              {isRTL ? 'البدائل المتاحة:' : 'Available alternatives:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.context.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => {
                    setModifyPayload(JSON.stringify({ selectedAlternative: alt.id }))
                    setShowModifyForm(true)
                  }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs
                    bg-slate-700/50 border border-slate-600
                    hover:bg-slate-600 hover:border-slate-500
                    transition-all
                  `}
                >
                  {language === 'ar' && alt.labelAr ? alt.labelAr : alt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={isRTL ? 'سبب الرفض...' : 'Reason for rejection...'}
              className={`
                w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600
                text-white placeholder-slate-500 text-sm resize-none
                focus:outline-none focus:border-red-500
                ${isRTL ? 'text-right' : 'text-left'}
              `}
              rows={2}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <div className={`flex gap-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleReject}
                loading={isSubmitting}
                disabled={!rejectReason.trim()}
              >
                {isRTL ? 'تأكيد الرفض' : 'Confirm Reject'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                }}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Modify form */}
        {showModifyForm && (
          <div className="mb-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <textarea
              value={modifyPayload}
              onChange={(e) => setModifyPayload(e.target.value)}
              placeholder={isRTL ? 'تعديلات JSON...' : 'Modified payload (JSON)...'}
              className={`
                w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600
                text-white placeholder-slate-500 text-sm resize-none font-mono
                focus:outline-none focus:border-cyan-500
                ${isRTL ? 'text-right' : 'text-left'}
              `}
              rows={3}
              dir="ltr"
            />
            <input
              type="text"
              value={modifyReason}
              onChange={(e) => setModifyReason(e.target.value)}
              placeholder={isRTL ? 'سبب التعديل (اختياري)...' : 'Reason for modification (optional)...'}
              className={`
                w-full px-3 py-2 mt-2 rounded-lg bg-slate-800 border border-slate-600
                text-white placeholder-slate-500 text-sm
                focus:outline-none focus:border-cyan-500
                ${isRTL ? 'text-right' : 'text-left'}
              `}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <div className={`flex gap-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                size="sm"
                variant="default"
                onClick={handleModify}
                loading={isSubmitting}
              >
                {isRTL ? 'تطبيق التعديلات' : 'Apply Changes'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowModifyForm(false)
                  setModifyPayload('')
                  setModifyReason('')
                }}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showRejectForm && !showModifyForm && (
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              size="sm"
              variant="success"
              onClick={handleApprove}
              loading={isSubmitting}
              className="flex-1"
            >
              {isRTL ? 'موافقة' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowModifyForm(true)}
              className="flex-1"
            >
              {isRTL ? 'تعديل' : 'Modify'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowRejectForm(true)}
              className="flex-1"
            >
              {isRTL ? 'رفض' : 'Reject'}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className={`
          flex items-center justify-between mt-4 pt-3
          border-t border-slate-700/50 text-xs text-slate-500
          ${isRTL ? 'flex-row-reverse' : ''}
        `}>
          <span>{formatTimeAgo(item.createdAt, isRTL)}</span>
          {item.context.workflowName && (
            <span className="truncate max-w-[50%]">
              {item.context.workflowName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ========================================
// Stats Summary Component
// ========================================

function StatsSummary({
  stats,
  isRTL,
  language,
}: {
  stats: ExceptionStats
  isRTL: boolean
  language: 'en' | 'ar'
}) {
  return (
    <div className={`
      grid grid-cols-4 gap-2 p-3 bg-slate-900/50 rounded-lg
      ${isRTL ? 'text-right' : 'text-left'}
    `}>
      <div className="text-center">
        <div className="text-lg font-bold text-white">{stats.totalPending}</div>
        <div className="text-xs text-slate-500">
          {language === 'ar' ? 'معلق' : 'Pending'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-red-400">{stats.immediateCount}</div>
        <div className="text-xs text-slate-500">
          {language === 'ar' ? 'عاجل' : 'Urgent'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-amber-400">{stats.todayCount}</div>
        <div className="text-xs text-slate-500">
          {language === 'ar' ? 'اليوم' : 'Today'}
        </div>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-emerald-400">{stats.resolvedToday}</div>
        <div className="text-xs text-slate-500">
          {language === 'ar' ? 'منجز' : 'Done'}
        </div>
      </div>
    </div>
  )
}

// ========================================
// Main Panel Component
// ========================================

export function ExceptionQueuePanel({
  userId,
  onDecision,
  maxVisible = 5,
  className = '',
  isRTL = false,
  language = 'en',
}: ExceptionQueuePanelProps) {
  const [items, setItems] = useState<ExceptionQueueItem[]>([])
  const [stats, setStats] = useState<ExceptionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const initialFetchDone = useRef(false)

  // Fetch exceptions
  const fetchExceptions = useCallback(async () => {
    try {
      const [pendingItems, exceptionStats] = await Promise.all([
        exceptionQueue.getPendingExceptions(userId),
        exceptionQueue.getStats(userId),
      ])
      setItems(pendingItems)
      setStats(exceptionStats)
    } catch (error) {
      console.error('[ExceptionQueuePanel] Failed to fetch exceptions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Initial fetch and subscribe to updates
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true
      fetchExceptions()
    }

    const unsubscribe = exceptionQueue.subscribe(() => {
      fetchExceptions()
    })

    return unsubscribe
  }, [fetchExceptions])

  // Handle approve
  const handleApprove = useCallback(async (item: ExceptionQueueItem) => {
    const result = await exceptionQueue.approveException(item.id, userId)
    if (result && onDecision) {
      onDecision(result, 'approve')
    }
  }, [userId, onDecision])

  // Handle reject
  const handleReject = useCallback(async (item: ExceptionQueueItem, reason: string) => {
    const result = await exceptionQueue.rejectException(item.id, userId, reason)
    if (result && onDecision) {
      onDecision(result, 'reject')
    }
  }, [userId, onDecision])

  // Handle modify
  const handleModify = useCallback(async (
    item: ExceptionQueueItem,
    payload: unknown,
    reason?: string
  ) => {
    const result = await exceptionQueue.modifyException(item.id, userId, payload, reason)
    if (result && onDecision) {
      onDecision(result, 'modify', payload)
    }
  }, [userId, onDecision])

  // Handle start review
  const handleStartReview = useCallback(async (item: ExceptionQueueItem) => {
    if (item.status === 'pending') {
      await exceptionQueue.markAsReviewing(item.id)
    }
  }, [])

  // Visible items
  const visibleItems = showAll ? items : items.slice(0, maxVisible)
  const hiddenCount = items.length - maxVisible

  // Don't render if no items and not loading
  if (!isLoading && items.length === 0) {
    return null
  }

  return (
    <Card
      className={`bg-slate-900/50 border-slate-700/50 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <CardHeader className="pb-3">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center">
                <span className="text-xl">!</span>
              </div>
              {stats && stats.immediateCount > 0 && (
                <span className="absolute -top-1 -right-1 rtl:-left-1 rtl:right-auto w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold animate-pulse">
                  {stats.immediateCount}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === 'ar' ? 'قرارات تحتاج مراجعة' : 'Decisions Needed'}
              </CardTitle>
              <CardDescription>
                {language === 'ar'
                  ? `${items.length} إجراء بانتظار موافقتك`
                  : `${items.length} action${items.length !== 1 ? 's' : ''} awaiting your approval`
                }
              </CardDescription>
            </div>
          </div>
          {stats && stats.totalPending > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs text-amber-400">
                {language === 'ar' ? 'نشط' : 'Active'}
              </span>
            </div>
          )}
        </div>

        {/* Stats summary */}
        {stats && <StatsSummary stats={stats} isRTL={isRTL} language={language} />}
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-slate-800/50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Exception cards */}
            <div className="space-y-4">
              {visibleItems.map((item) => (
                <ExceptionCard
                  key={item.id}
                  item={item}
                  onApprove={() => handleApprove(item)}
                  onReject={(reason) => handleReject(item, reason)}
                  onModify={(payload, reason) => handleModify(item, payload, reason)}
                  onStartReview={() => handleStartReview(item)}
                  isRTL={isRTL}
                  language={language}
                />
              ))}
            </div>

            {/* Show more button */}
            {hiddenCount > 0 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {language === 'ar'
                  ? `عرض ${hiddenCount} المزيد`
                  : `Show ${hiddenCount} more`
                }
              </button>
            )}

            {showAll && items.length > maxVisible && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                {language === 'ar' ? 'عرض أقل' : 'Show less'}
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ========================================
// Hook for using Exception Queue
// ========================================

export function useExceptionQueue(userId: string) {
  const [items, setItems] = useState<ExceptionQueueItem[]>([])
  const [stats, setStats] = useState<ExceptionStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pendingItems, exceptionStats] = await Promise.all([
        exceptionQueue.getPendingExceptions(userId),
        exceptionQueue.getStats(userId),
      ])
      setItems(pendingItems)
      setStats(exceptionStats)
    } catch (error) {
      console.error('[useExceptionQueue] Failed to fetch:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refresh()
    const unsubscribe = exceptionQueue.subscribe(() => refresh())
    return unsubscribe
  }, [refresh])

  return {
    items,
    stats,
    isLoading,
    refresh,
    approve: (id: string) => exceptionQueue.approveException(id, userId),
    reject: (id: string, reason: string) => exceptionQueue.rejectException(id, userId, reason),
    modify: (id: string, payload: unknown, reason?: string) =>
      exceptionQueue.modifyException(id, userId, payload, reason),
  }
}

export default ExceptionQueuePanel
