/**
 * ParameterCollectionPanel.tsx
 *
 * Pre-flight parameter collection panel that gathers ALL missing parameters
 * BEFORE workflow execution begins. This prevents the crash-and-retry loop
 * where workflows fail mid-execution due to missing params.
 *
 * Key features:
 * - Unique nodeId_paramName keys (FIX-031 pattern)
 * - User-friendly prompts for each param type
 * - Quick actions for common values
 * - Progress tracking across all params
 * - Real-time validation
 *
 * @NEXUS-FIX-038: ParameterCollectionPanel - Pre-flight param collection - DO NOT REMOVE
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  CheckCircle,
  Circle,
  Mail,
  Phone,
  Link as LinkIcon,
  FileText,
  Hash,
  ArrowRight,
  AlertCircle,
  Sparkles
} from 'lucide-react'

// ================================
// TYPE DEFINITIONS
// ================================

export interface MissingParam {
  nodeId: string;
  nodeName: string;
  paramName: string;
  friendlyPrompt: string;
  type: 'string' | 'email' | 'phone' | 'url' | 'number' | 'textarea';
  quickAction?: {
    label: string;
    value: string;
  };
  placeholder?: string;
  validation?: RegExp;
}

export interface CollectedParam {
  key: string; // nodeId_paramName format
  nodeId: string;
  paramName: string;
  value: string;
}

interface ParameterCollectionPanelProps {
  /** List of missing parameters to collect */
  params: MissingParam[];
  /** Called when all parameters have been collected */
  onAllCollected: (collected: CollectedParam[]) => void;
  /** Optional: Called when a single param is collected */
  onParamCollected?: (param: CollectedParam) => void;
  /** Optional: Pre-filled values */
  initialValues?: Record<string, string>;
}

// ================================
// ICON MAPPING
// ================================

function getParamIcon(type: MissingParam['type']) {
  switch (type) {
    case 'email':
      return <Mail className="w-4 h-4 text-blue-500" />
    case 'phone':
      return <Phone className="w-4 h-4 text-green-500" />
    case 'url':
      return <LinkIcon className="w-4 h-4 text-purple-500" />
    case 'number':
      return <Hash className="w-4 h-4 text-orange-500" />
    case 'textarea':
      return <FileText className="w-4 h-4 text-gray-500" />
    default:
      return <Circle className="w-4 h-4 text-gray-400" />
  }
}

// ================================
// VALIDATION HELPERS
// ================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[\d\s\-()]{7,}$/
const URL_REGEX = /^https?:\/\/.+/

function validateParam(value: string, type: MissingParam['type'], customValidation?: RegExp): boolean {
  if (!value.trim()) return false

  if (customValidation) {
    return customValidation.test(value)
  }

  switch (type) {
    case 'email':
      return EMAIL_REGEX.test(value)
    case 'phone':
      return PHONE_REGEX.test(value)
    case 'url':
      return URL_REGEX.test(value)
    case 'number':
      return !isNaN(Number(value))
    default:
      return true
  }
}

function getPlaceholder(type: MissingParam['type'], customPlaceholder?: string): string {
  if (customPlaceholder) return customPlaceholder

  switch (type) {
    case 'email':
      return 'name@example.com'
    case 'phone':
      return '+1 (555) 123-4567'
    case 'url':
      return 'https://example.com'
    case 'number':
      return '123'
    case 'textarea':
      return 'Enter your text here...'
    default:
      return 'Enter value...'
  }
}

// ================================
// MAIN COMPONENT
// ================================

export function ParameterCollectionPanel({
  params,
  onAllCollected,
  onParamCollected,
  initialValues = {},
}: ParameterCollectionPanelProps) {
  // Generate unique key for each param
  const getParamKey = useCallback((param: MissingParam) => {
    return `${param.nodeId}_${param.paramName}`
  }, [])

  // Initialize values from props
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    params.forEach(param => {
      const key = getParamKey(param)
      initial[key] = initialValues[key] || ''
    })
    return initial
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({})

  // Calculate completion status
  const completionStatus = useMemo(() => {
    const completed = params.filter(param => {
      const key = getParamKey(param)
      const value = values[key]
      return value && validateParam(value, param.type, param.validation)
    })
    return {
      completed: completed.length,
      total: params.length,
      isComplete: completed.length === params.length,
      percentage: params.length > 0 ? (completed.length / params.length) * 100 : 0,
    }
  }, [params, values, getParamKey])

  // Focus current input on mount/index change
  useEffect(() => {
    const currentParam = params[currentIndex]
    if (currentParam) {
      const key = getParamKey(currentParam)
      inputRefs.current[key]?.focus()
    }
  }, [currentIndex, params, getParamKey])

  // Handle value change
  const handleChange = useCallback((key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
  }, [])

  // Handle quick action
  const handleQuickAction = useCallback((param: MissingParam) => {
    if (param.quickAction) {
      const key = getParamKey(param)
      setValues(prev => ({ ...prev, [key]: param.quickAction!.value }))

      // Notify and move to next
      if (onParamCollected) {
        onParamCollected({
          key,
          nodeId: param.nodeId,
          paramName: param.paramName,
          value: param.quickAction.value,
        })
      }

      // Move to next unfilled param
      const nextIndex = params.findIndex((p, i) => {
        if (i <= currentIndex) return false
        const k = getParamKey(p)
        return !values[k]
      })
      if (nextIndex !== -1) {
        setCurrentIndex(nextIndex)
      }
    }
  }, [getParamKey, params, values, currentIndex, onParamCollected])

  // Handle enter key to move to next
  const handleKeyDown = useCallback((e: React.KeyboardEvent, param: MissingParam, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const key = getParamKey(param)
      const value = values[key]

      // Validate
      if (!validateParam(value, param.type, param.validation)) {
        setErrors(prev => ({ ...prev, [key]: 'Please enter a valid value' }))
        return
      }

      // Notify
      if (onParamCollected) {
        onParamCollected({
          key,
          nodeId: param.nodeId,
          paramName: param.paramName,
          value,
        })
      }

      // Move to next or submit
      if (index < params.length - 1) {
        setCurrentIndex(index + 1)
      }
    }
  }, [getParamKey, values, params, onParamCollected])

  // Handle submit all
  const handleSubmitAll = useCallback(() => {
    // Validate all
    const newErrors: Record<string, string> = {}
    let hasErrors = false

    params.forEach(param => {
      const key = getParamKey(param)
      const value = values[key]
      if (!validateParam(value, param.type, param.validation)) {
        newErrors[key] = 'Please enter a valid value'
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      return
    }

    // Collect all and submit
    const collected: CollectedParam[] = params.map(param => {
      const key = getParamKey(param)
      return {
        key,
        nodeId: param.nodeId,
        paramName: param.paramName,
        value: values[key],
      }
    })

    onAllCollected(collected)
  }, [params, values, getParamKey, onAllCollected])

  // If no params, nothing to render
  if (params.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 max-w-md">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Just a few things needed
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            {completionStatus.completed} of {completionStatus.total} complete
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-300"
          style={{ width: `${completionStatus.percentage}%` }}
        />
      </div>

      {/* Parameter List */}
      <div className="space-y-3">
        {params.map((param, index) => {
          const key = getParamKey(param)
          const value = values[key] || ''
          const isValid = validateParam(value, param.type, param.validation)
          const isCurrent = index === currentIndex
          const error = errors[key]

          return (
            <div
              key={key}
              className={`p-3 rounded-lg border transition-all ${
                isCurrent
                  ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 shadow-sm'
                  : isValid
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {/* Param Header */}
              <div className="flex items-center gap-2 mb-2">
                {isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  getParamIcon(param.type)
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {param.friendlyPrompt}
                </span>
              </div>

              {/* Node Context */}
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mb-2">
                For: {param.nodeName}
              </p>

              {/* Input */}
              {param.type === 'textarea' ? (
                <textarea
                  ref={(el) => { inputRefs.current[key] = el }}
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, param, index)}
                  placeholder={getPlaceholder(param.type, param.placeholder)}
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    error
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
              ) : (
                <input
                  ref={(el) => { inputRefs.current[key] = el }}
                  type={param.type === 'email' ? 'email' : param.type === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, param, index)}
                  placeholder={getPlaceholder(param.type, param.placeholder)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    error
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                />
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </p>
              )}

              {/* Quick Action */}
              {param.quickAction && !isValid && (
                <button
                  onClick={() => handleQuickAction(param)}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" />
                  {param.quickAction.label}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitAll}
        disabled={!completionStatus.isComplete}
        className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-colors ${
          completionStatus.isComplete
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        {completionStatus.isComplete ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Continue to Execute
          </>
        ) : (
          <>
            <Circle className="w-4 h-4" />
            Fill all fields to continue
          </>
        )}
      </button>

      {/* Keyboard Hint */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
        Press Enter to move to the next field
      </p>
    </div>
  )
}

export default ParameterCollectionPanel
