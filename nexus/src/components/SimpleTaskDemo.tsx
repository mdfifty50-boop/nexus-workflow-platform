/**
 * Simple Task Demo Component
 *
 * Demonstrates how to use the Simple Task feature for quick actions.
 * Shows the full flow: input -> detection -> confirmation -> execution.
 */

import React, { useState, useEffect } from 'react'
import {
  workflowOrchestrator,
  type OrchestratorSession,
  type OrchestratorEvent,
  type SimpleTaskExecutionResult,
} from '../lib/workflow-engine/orchestrator'
import {
  SimpleTaskConfirmationDialog,
  SimpleTaskResult,
} from './SimpleTaskConfirmation'

export const SimpleTaskDemo: React.FC = () => {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [session, setSession] = useState<OrchestratorSession | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [executionResult, setExecutionResult] = useState<SimpleTaskExecutionResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // Subscribe to orchestrator events
  useEffect(() => {
    const unsubscribe = workflowOrchestrator.subscribe((event: OrchestratorEvent) => {
      addLog(`Event: ${event.type}`)

      switch (event.type) {
        case 'simple_task_detected':
          addLog('✅ Simple task detected!')
          break
        case 'simple_task_confirmation_required':
          setShowConfirmation(true)
          addLog('⏳ Awaiting user confirmation')
          break
        case 'simple_task_executing':
          addLog('⚡ Executing task...')
          break
        case 'simple_task_completed':
          addLog('✅ Task completed successfully!')
          break
        case 'simple_task_failed':
          addLog('❌ Task execution failed')
          break
      }
    })

    return () => unsubscribe()
  }, [])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    setIsProcessing(true)
    setSession(null)
    setExecutionResult(null)
    setLogs([])
    addLog(`Processing: "${input}"`)

    try {
      // Execute command through orchestrator
      const result = await workflowOrchestrator.executeCommand(input, {
        userId: 'demo_user',
        autoExecute: false, // Don't auto-execute, require confirmation
      })

      setSession(result)
      addLog(`Session created: ${result.id}`)

      if (result.isSimpleTask) {
        addLog(`Simple task type: ${result.simpleTask?.type}`)
      } else {
        addLog('Not a simple task - full workflow would be generated')
      }
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    if (!session || !session.isSimpleTask) return

    setIsProcessing(true)
    addLog('Executing confirmed task...')

    try {
      const result = await workflowOrchestrator.confirmSimpleTask(session.id)
      setExecutionResult(result)
      setShowConfirmation(false)
      addLog(`Execution result: ${result.success ? 'Success' : 'Failed'}`)
    } catch (error) {
      addLog(`Execution error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    if (session) {
      workflowOrchestrator.cancelSimpleTask(session.id)
      addLog('Task cancelled by user')
    }
    setShowConfirmation(false)
    setSession(null)
  }

  const handleResultClose = () => {
    setExecutionResult(null)
    setSession(null)
    setInput('')
  }

  const exampleTasks = [
    'Order a healthy meal to my home',
    'Book me a ride to the airport',
    'Send a quick message to John',
    'Remind me to call Sarah tomorrow at 3pm',
    'Add team meeting to my calendar tomorrow at 10am',
    'Translate this to Spanish: Hello, how are you?',
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Simple Tasks Demo
        </h2>
        <p className="text-gray-600 mb-6">
          Try out simple one-step tasks. These execute faster than full workflows
          and require just one confirmation.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-input" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to do?
            </label>
            <input
              id="task-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Order food to my home"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Execute Task'}
          </button>
        </form>

        {/* Example Tasks */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Try these examples:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {exampleTasks.map((example, index) => (
              <button
                key={index}
                onClick={() => setInput(example)}
                className="text-left px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Session Info */}
        {session && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Session Info</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <span className="font-medium">ID:</span>{' '}
                <span className="font-mono text-xs">{session.id}</span>
              </p>
              <p>
                <span className="font-medium">Status:</span> {session.status}
              </p>
              {session.isSimpleTask && (
                <p>
                  <span className="font-medium">Type:</span> {session.simpleTask?.type}
                </p>
              )}
              <p>
                <span className="font-medium">Messages:</span>
              </p>
              <ul className="list-disc list-inside pl-2">
                {session.messages.map((msg: string, i: number) => (
                  <li key={i} className="text-xs">
                    {msg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Event Log</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-48 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && session?.simpleTaskConfirmation && session?.simpleTask && (
        <SimpleTaskConfirmationDialog
          confirmation={session.simpleTaskConfirmation}
          task={session.simpleTask}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isExecuting={isProcessing}
        />
      )}

      {/* Execution Result */}
      {executionResult && (
        <SimpleTaskResult
          success={executionResult.success}
          message={executionResult.userMessage}
          taskType={executionResult.taskId}
          onClose={handleResultClose}
        />
      )}
    </div>
  )
}

export default SimpleTaskDemo
