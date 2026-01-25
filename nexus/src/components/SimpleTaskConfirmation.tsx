/**
 * Simple Task Confirmation Component
 *
 * Displays a user-friendly confirmation dialog for simple tasks
 * before execution. Shows task details, estimated cost, and time.
 */

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card'
import type { SimpleTaskConfirmation, SimpleTask } from '../types/simple-task'

interface SimpleTaskConfirmationProps {
  confirmation: SimpleTaskConfirmation
  task: SimpleTask
  onConfirm: () => void
  onCancel: () => void
  onModify?: () => void
  isExecuting?: boolean
}

export const SimpleTaskConfirmationDialog: React.FC<SimpleTaskConfirmationProps> = ({
  confirmation,
  task,
  onConfirm,
  onCancel,
  onModify,
  isExecuting = false,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const getTaskIcon = (): string => {
    switch (task.type) {
      case 'food-order':
        return '🍔'
      case 'ride-request':
        return '🚗'
      case 'quick-message':
        return '💬'
      case 'reminder':
        return '⏰'
      case 'calendar-event':
        return '📅'
      case 'note-creation':
        return '📝'
      case 'email-quick-send':
        return '✉️'
      case 'payment-request':
        return '💳'
      case 'quick-search':
        return '🔍'
      case 'translation':
        return '🌐'
      default:
        return '⚡'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getTaskIcon()}</div>
            <div className="flex-1">
              <CardTitle className="text-xl">{confirmation.summary.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {confirmation.summary.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Details */}
          <div className="space-y-3">
            {confirmation.summary.keyDetails.map((detail, index) => (
              <div
                key={index}
                className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-sm font-medium text-gray-600">{detail.label}</span>
                <span className="text-sm text-gray-900 text-right ml-4 flex-1">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>

          {/* Estimated Cost & Time */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            {confirmation.estimatedCost && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  {confirmation.estimatedCost.currency} {confirmation.estimatedCost.amount.toFixed(2)}
                </span>
              </div>
            )}
            {confirmation.estimatedTime && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">ETA:</span>
                <span className="text-sm text-gray-900">{confirmation.estimatedTime}</span>
              </div>
            )}
          </div>

          {/* Warnings */}
          {confirmation.warnings && confirmation.warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 mb-1">Please note:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {confirmation.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Required */}
          {confirmation.requiresAuth && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-lg">🔐</span>
                <p className="text-sm text-blue-800">
                  This action requires authentication with{' '}
                  <span className="font-semibold">{confirmation.authService}</span>
                </p>
              </div>
            </div>
          )}

          {/* Show Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showDetails ? '▼ Hide details' : '▶ Show details'}
          </button>

          {/* Detailed View */}
          {showDetails && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-2">
              <p className="text-xs font-medium text-gray-600">Original Input:</p>
              <p className="text-sm text-gray-800 italic">"{task.originalInput}"</p>
              <p className="text-xs font-medium text-gray-600 mt-3">Task ID:</p>
              <p className="text-xs font-mono text-gray-600">{task.id}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 pt-4 border-t">
          <button
            onClick={onCancel}
            disabled={isExecuting}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>

          {onModify && (
            <button
              onClick={onModify}
              disabled={isExecuting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Modify
            </button>
          )}

          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span>✓</span>
                Confirm
              </>
            )}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}

// ============================================================================
// Mini Confirmation Component (for inline use)
// ============================================================================

interface MiniConfirmationProps {
  confirmation: SimpleTaskConfirmation
  onConfirm: () => void
  onCancel: () => void
  isExecuting?: boolean
}

export const SimpleTaskMiniConfirmation: React.FC<MiniConfirmationProps> = ({
  confirmation,
  onConfirm,
  onCancel,
  isExecuting = false,
}) => {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-md space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{confirmation.summary.title}</h4>
          <p className="text-xs text-gray-600 mt-1">{confirmation.summary.description}</p>
        </div>
      </div>

      {/* Quick Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {confirmation.estimatedCost && (
          <div>
            <span className="text-gray-500">Cost: </span>
            <span className="font-semibold text-gray-900">
              {confirmation.estimatedCost.currency} {confirmation.estimatedCost.amount.toFixed(2)}
            </span>
          </div>
        )}
        {confirmation.estimatedTime && (
          <div>
            <span className="text-gray-500">Time: </span>
            <span className="font-semibold text-gray-900">{confirmation.estimatedTime}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isExecuting}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isExecuting}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isExecuting ? 'Processing...' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Success/Failure Result Component
// ============================================================================

interface TaskResultProps {
  success: boolean
  message: string
  taskType: string
  onClose: () => void
}

export const SimpleTaskResult: React.FC<TaskResultProps> = ({
  success,
  message,
  taskType: _taskType,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardHeader className="text-center">
          <div className="text-6xl mb-3">{success ? '✅' : '❌'}</div>
          <CardTitle className={success ? 'text-green-600' : 'text-red-600'}>
            {success ? 'Task Completed!' : 'Task Failed'}
          </CardTitle>
          <CardDescription className="text-sm mt-2">{message}</CardDescription>
        </CardHeader>

        <CardFooter className="justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default SimpleTaskConfirmationDialog
