/**
 * TemplatePreviewCard Component
 *
 * Displays a template recommendation card with:
 * - Template name and description
 * - Estimated time saved per week
 * - Complexity level indicator
 * - Preview of workflow steps
 * - Required apps with icons
 * - "Use this template" button
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Eye,
  Bookmark,
  CheckCircle,
} from 'lucide-react'

import type { TemplatePreviewCardProps } from './template-recommendation-types'
import {
  COMPLEXITY_DISPLAY_INFO,
  APP_INFO_MAP,
} from './template-recommendation-types'

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * App icon with fallback
 */
function AppIcon({ appId, size = 'md' }: { appId: string; size?: 'sm' | 'md' }) {
  const appInfo = APP_INFO_MAP[appId]
  const sizeClasses = size === 'sm' ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm'

  if (!appInfo) {
    return (
      <div
        className={`${sizeClasses} rounded-md bg-slate-700 flex items-center justify-center text-slate-400 font-medium`}
        title={appId}
      >
        {appId.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses} rounded-md flex items-center justify-center text-white font-medium`}
      style={{ backgroundColor: appInfo.color }}
      title={appInfo.name}
    >
      {appInfo.name.charAt(0)}
    </div>
  )
}

/**
 * Step preview item
 */
function StepPreviewItem({
  step,
  index,
  _isLast,
}: {
  step: { id: string; name: string; description: string; icon?: string; appId?: string }
  index: number
  _isLast: boolean
}) {
  // Void unused parameter to satisfy linter
  void _isLast

  return (
    <div className="flex items-start gap-3">
      {/* Step number or app icon */}
      <div className="flex-shrink-0 mt-0.5">
        {step.appId ? (
          <AppIcon appId={step.appId} size="sm" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold">
            {index + 1}
          </div>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{step.name}</p>
        <p className="text-xs text-slate-400 truncate">{step.description}</p>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function TemplatePreviewCard({
  template,
  isSelected = false,
  isRecommended = false,
  matchReason,
  onClick,
  onPreview,
  onSaveForLater,
  compact = false,
}: TemplatePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const complexityInfo = COMPLEXITY_DISPLAY_INFO[template.complexity]

  const handleExpandToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsExpanded(!isExpanded)
    },
    [isExpanded]
  )

  const handlePreview = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onPreview?.()
    },
    [onPreview]
  )

  const handleSaveForLater = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onSaveForLater?.()
    },
    [onSaveForLater]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <Card
        onClick={onClick}
        className={`
          cursor-pointer transition-all duration-300 hover:shadow-lg relative overflow-hidden
          ${
            isSelected
              ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/50'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
          }
          ${compact ? 'p-3' : ''}
        `}
      >
        {/* New badge */}
        {template.isNew && (
          <div className="absolute top-0 right-0">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
              NEW
            </div>
          </div>
        )}

        <CardHeader className={compact ? 'pb-2 pt-1 px-0' : 'pb-3'}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle
                  className={`${compact ? 'text-base' : 'text-lg'} text-white truncate`}
                >
                  {template.name}
                </CardTitle>
                {isRecommended && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium whitespace-nowrap">
                    Recommended
                  </span>
                )}
                {template.isStaffPick && !isRecommended && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium whitespace-nowrap flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Staff Pick
                  </span>
                )}
              </div>
              <CardDescription
                className={`mt-1 text-slate-400 ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}
              >
                {template.description}
              </CardDescription>
              {matchReason && (
                <p className="mt-1 text-xs text-cyan-400">{matchReason}</p>
              )}
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className={compact ? 'pb-2 px-0' : 'pb-3'}>
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge
              className={`${complexityInfo.bgColor} ${complexityInfo.color} ${complexityInfo.borderColor} border text-xs`}
            >
              {complexityInfo.label}
            </Badge>
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
              {template.category}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs border-slate-600 text-slate-400 flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              {template.estimatedSetupTime}
            </Badge>
          </div>

          {/* Time Saved */}
          <div className="flex items-center gap-2 text-sm text-emerald-400 mb-3">
            <Zap className="w-4 h-4" />
            <span>
              Saves <strong>{template.estimatedTimeSaved}</strong>
            </span>
          </div>

          {/* Required Apps */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1.5">Required Apps:</p>
            <div className="flex flex-wrap gap-1.5">
              {template.requiredApps.slice(0, compact ? 3 : 5).map(appId => {
                const appInfo = APP_INFO_MAP[appId]
                return (
                  <span
                    key={appId}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-300"
                  >
                    <AppIcon appId={appId} size="sm" />
                    <span className="capitalize">{appInfo?.name || appId}</span>
                  </span>
                )
              })}
              {template.requiredApps.length > (compact ? 3 : 5) && (
                <span className="px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-400">
                  +{template.requiredApps.length - (compact ? 3 : 5)} more
                </span>
              )}
            </div>
          </div>

          {/* Rating and Usage */}
          {!compact && (
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{template.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{template.usageCount.toLocaleString()} users</span>
              </div>
            </div>
          )}

          {/* Expandable Workflow Preview */}
          {!compact && (
            <AnimatePresence>
              {isExpanded && template.steps.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 pt-3 border-t border-slate-700 overflow-hidden"
                >
                  <p className="text-xs text-slate-500 mb-2">Workflow Steps:</p>
                  <div className="space-y-2.5">
                    {template.steps.slice(0, 5).map((step, index) => (
                      <StepPreviewItem
                        key={step.id}
                        step={step}
                        index={index}
                        _isLast={index === template.steps.length - 1 || index === 4}
                      />
                    ))}
                    {template.steps.length > 5 && (
                      <p className="text-xs text-slate-500 ml-8">
                        +{template.steps.length - 5} more steps
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </CardContent>

        <CardFooter className={compact ? 'pt-0 px-0 pb-0' : 'pt-0'}>
          <div className="flex items-center justify-between w-full gap-2">
            {/* Expand/Collapse Steps */}
            {!compact && template.steps.length > 0 && (
              <button
                onClick={handleExpandToggle}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Hide steps</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>
                      Preview steps ({template.steps.length})
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              {onSaveForLater && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveForLater}
                  className="text-slate-400 hover:text-white"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              )}
              {onPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreview}
                  className="text-slate-400 hover:text-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default TemplatePreviewCard
