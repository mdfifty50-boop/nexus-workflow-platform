/**
 * Execution Engine — Standalone workflow executor
 *
 * Extracted from WorkflowPreviewCard.tsx executeWorkflow() useCallback.
 * This is a PURE async function with no React dependencies.
 *
 * Features:
 * - Dispatch-based state updates (no stale closures — FIX-023 solved structurally)
 * - Checkpoint/resume for persistent agents (R-P0-1)
 * - AbortSignal for cancellation (R-P2-11)
 * - Injectable services for testability
 *
 * All fix markers from the original executeWorkflow are preserved here:
 * FIX-019, FIX-020, FIX-021, FIX-023, FIX-029, FIX-031, FIX-039,
 * FIX-041, FIX-043, FIX-062, FIX-063, FIX-064, FIX-094, FIX-110,
 * FIX-111, FIX-112, FIX-113, FIX-115, FIX-144, FIX-146, FIX-171,
 * FIX-172, FIX-178, FIX-185, FIX-199, FIX-204
 */

import type {
  ExecutionAction,
  ExecutionCheckpoint,
  EngineRunParams,
  EngineInternalState,
  EngineServices,
} from './execution-types'

import type { OrchestrationResult } from '@/components/chat/wpc-types'

import type {
  NodeStatus,
  WorkflowNode,
} from '@/components/chat/wpc-types'

// ============================================================================
// Helper: Build batch update for "mark nodes up to index as success"
// ============================================================================

function buildBatchSuccessUpTo(
  totalNodes: number,
  successUpTo: number,
  currentResult?: unknown
): Array<{ index: number; status: NodeStatus; result?: unknown }> {
  const updates: Array<{ index: number; status: NodeStatus; result?: unknown }> = []
  for (let j = 0; j < totalNodes; j++) {
    if (j < successUpTo) {
      updates.push({ index: j, status: 'success' })
    } else if (j === successUpTo) {
      updates.push({ index: j, status: 'success', result: currentResult })
    } else {
      updates.push({ index: j, status: 'pending' })
    }
  }
  return updates
}

// ============================================================================
// Helper: Check if abort was signaled
// ============================================================================

function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('Workflow execution was cancelled', 'AbortError')
  }
}

// ============================================================================
// Helper: Create checkpoint from current engine state
// ============================================================================

function createCheckpoint(
  workflowId: string,
  nodeIndex: number,
  state: EngineInternalState,
  nodes: WorkflowNode[],
  collectedParams: Record<string, string>,
  phase: 'executing' | 'paused' | 'awaiting_approval'
): ExecutionCheckpoint {
  const completedNodes: ExecutionCheckpoint['completedNodes'] = []
  for (let j = 0; j < nodes.length; j++) {
    if (state.nodeStatuses[j] === 'success' && state.nodeResults[j] !== undefined) {
      completedNodes.push({
        index: j,
        nodeId: nodes[j].id,
        status: 'success',
        result: state.nodeResults[j],
      })
    }
  }

  const orchestrationResults: ExecutionCheckpoint['orchestrationResults'] = []
  for (const [nodeId, result] of state.orchestrationResults) {
    orchestrationResults.push({ nodeId, result })
  }

  const retryCounts: Record<string, number> = {}
  for (const [key, count] of state.retryCounts) {
    retryCounts[key] = count
  }

  return {
    workflowId,
    currentNodeIndex: nodeIndex,
    completedNodes,
    collectedParams,
    phase,
    orchestrationResults,
    triggerSampleData: state.triggerSampleData,
    retryCounts,
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// Auto-gauge complexity for AI model tiering (Haiku/Sonnet/Opus)
// ============================================================================

function gaugeComplexity(name: string, desc: string): string {
  const t = `${name} ${desc}`.toLowerCase()
  if (/\b(analyz|strateg|decision|evaluat|comprehensive|detailed report|business plan|compar)\b/.test(t)) return 'complex'
  if (/\b(quote|greet|hello|format|label|tag|short|simple|one.?line|joke|tip)\b/.test(t)) return 'simple'
  return 'moderate'
}

// ============================================================================
// Main Execution Engine
// ============================================================================

/**
 * Execute a workflow by iterating through nodes sequentially.
 *
 * This function is the core of Nexus workflow execution. It:
 * 1. Iterates through each node in order
 * 2. Classifies nodes (trigger, AI, internal, approval, WhatsApp, action)
 * 3. Executes each node via the appropriate service
 * 4. Dispatches state updates to the host
 * 5. Handles errors with retry logic
 * 6. Supports checkpointing for pause/resume
 * 7. Checks AbortSignal for cancellation
 *
 * @returns void — all state updates are dispatched, not returned
 */
export async function runWorkflowExecution(params: EngineRunParams): Promise<void> {
  const { context, dispatch, abortSignal, checkpoint, config, services: svc } = params
  const { workflow, nodes, orchestrationResults: initialOrchResults } = context

  // Initialize internal state
  const state: EngineInternalState = {
    nodeStatuses: nodes.map(n => n.status),
    nodeResults: nodes.map(n => n.result),
    retryCounts: new Map(),
    orchestrationResults: new Map(initialOrchResults),
    triggerSampleData: context.triggerSampleData,
    aborted: false,
  }

  // Restore from checkpoint if resuming
  let startIndex = 0
  if (checkpoint) {
    startIndex = checkpoint.currentNodeIndex
    // Restore completed nodes
    for (const cn of checkpoint.completedNodes) {
      state.nodeStatuses[cn.index] = cn.status
      state.nodeResults[cn.index] = cn.result
    }
    // Restore orchestration results
    for (const { nodeId, result } of checkpoint.orchestrationResults) {
      state.orchestrationResults.set(nodeId, result)
    }
    // Restore retry counts
    for (const [key, count] of Object.entries(checkpoint.retryCounts)) {
      state.retryCounts.set(key, count)
    }
    // Restore trigger sample data
    if (checkpoint.triggerSampleData) {
      state.triggerSampleData = checkpoint.triggerSampleData
    }
  } else {
    // Fresh execution: reset retry counts
    state.retryCounts.clear()
  }

  // Helper: dispatch + update internal state
  function dispatchAndTrack(action: ExecutionAction): void {
    if (state.aborted) return
    dispatch(action)

    // Mirror state changes internally
    switch (action.type) {
      case 'NODE_STATUS':
        state.nodeStatuses[action.index] = action.status
        if (action.result !== undefined) state.nodeResults[action.index] = action.result
        break
      case 'NODES_BATCH_UPDATE':
        for (const u of action.updates) {
          state.nodeStatuses[u.index] = u.status
          if (u.result !== undefined) state.nodeResults[u.index] = u.result
        }
        break
      case 'STORE_ORCHESTRATION_RESULT':
        state.orchestrationResults.set(action.nodeId, action.result)
        break
      case 'TRIGGER_SAMPLE_DATA':
        state.triggerSampleData = action.data
        break
    }
  }

  // Helper: log shorthand
  function log(message: string): void {
    dispatchAndTrack({ type: 'LOG', message })
  }

  // Signal execution start
  dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'executing' })
  log('Starting workflow execution...')

  // @NEXUS-FIX-178: Preserve already-completed nodes on approval resume - DO NOT REMOVE
  // Mark completed nodes as success, rest as pending
  const initialUpdates = nodes.map((n, idx) => ({
    index: idx,
    status: (n.status === 'success' && n.result ? 'success' : 'pending') as NodeStatus,
    result: n.status === 'success' && n.result ? n.result : undefined,
  }))
  dispatchAndTrack({ type: 'NODES_BATCH_UPDATE', updates: initialUpdates })

  // ========================================================================
  // Main execution loop
  // ========================================================================

  for (let i = startIndex; i < nodes.length; i++) {
    // Check for abort before each node
    try {
      checkAbort(abortSignal)
    } catch {
      state.aborted = true
      dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'error' })
      log('Workflow cancelled by user.')
      dispatchAndTrack({ type: 'EXECUTION_COMPLETE', success: false, workflowName: workflow.name })
      return
    }

    const node = nodes[i]

    // @NEXUS-FIX-178: Skip already-completed nodes on approval resume - DO NOT REMOVE
    if (state.nodeStatuses[i] === 'success' && state.nodeResults[i]) {
      log(`${node.name} - Already completed (skipping)`)
      continue
    }

    // Set current node to connecting
    const connectingUpdates = nodes.map((_, idx) => ({
      index: idx,
      status: (idx === i ? 'connecting' : idx < i ? 'success' : 'pending') as NodeStatus,
    }))
    dispatchAndTrack({ type: 'NODES_BATCH_UPDATE', updates: connectingUpdates })
    log(`Executing: ${node.name}...`)

    try {
      // Get integration info for this node
      const integrationInfo = svc.getIntegrationInfo(node.integration || node.name)

      // ====================================================================
      // NODE TYPE CLASSIFICATION
      // ====================================================================

      const isTriggerNode = node.type === 'trigger' ||
        node.name.toLowerCase().includes('monitor') ||
        node.name.toLowerCase().includes('watch') ||
        node.name.toLowerCase().includes('listen') ||
        node.name.toLowerCase().includes('receive') ||
        node.name.toLowerCase().includes('capture') ||
        node.name.toLowerCase().includes('incoming')

      // @NEXUS-FIX-110: Tightened AI/Internal node classification - DO NOT REMOVE
      // Problem: Keywords like 'extract', 'analyze', 'generate', 'process' caused REAL
      // action nodes to be skipped as "AI processing" when they are actually real API calls.
      // Solution: ONLY classify as AI/internal when the integration is EXPLICITLY 'ai' or 'nexus'.
      const hasRealIntegration = integrationInfo.toolkit !== 'ai' &&
        integrationInfo.toolkit !== 'nexus' &&
        integrationInfo.toolkit !== 'unknown' &&
        integrationInfo.toolkit !== 'default' &&
        node.integration?.toLowerCase() !== 'ai' &&
        node.integration?.toLowerCase() !== 'nexus'

      const nodeNameLower = node.name.toLowerCase()

      // @NEXUS-FIX-144: Expanded AI node detection for universal execution - DO NOT REMOVE
      // Problem: Only toolkit==='ai' was detected. Steps like "Generate Quote" fell to Composio and failed.
      // Solution: Recognize all AI-internal toolkit names + keyword patterns when no real integration exists.
      const AI_INTERNAL_TOOLKITS = new Set([
        'ai', 'nexus-ai', 'claude', 'anthropic', 'openai',
        'generate', 'summarize', 'translate', 'transform', 'analyze',
        'filter', 'condition', 'format'
      ])
      const isAINode = !hasRealIntegration && (
        AI_INTERNAL_TOOLKITS.has(integrationInfo.toolkit.toLowerCase()) ||
        AI_INTERNAL_TOOLKITS.has((node.integration || '').toLowerCase()) ||
        (node.config as Record<string, unknown>)?.executorHint === 'ai' ||
        // Catch-all: name implies AI generation + no real integration + unknown toolkit
        ((integrationInfo.toolkit === 'unknown' || integrationInfo.toolkit === 'default') &&
          /\b(generat|compose|write|summariz|analyz|translat|classify|extract text|draft|creat(?:e|ing)\s+(?:a|an|the))\b/i.test(nodeNameLower))
      )

      // Detect internal/output nodes
      const hasOutputPattern = nodeNameLower.includes('display') ||
        nodeNameLower.includes('show output') ||
        nodeNameLower.includes('show result') ||
        nodeNameLower.includes('show summary') ||
        nodeNameLower.includes('present result') ||
        nodeNameLower.includes('format output') ||
        nodeNameLower.includes('notify user') ||
        nodeNameLower.includes('workflow complete')

      const isInternalNode = !hasRealIntegration && (
        integrationInfo.toolkit === 'nexus' ||
        node.integration?.toLowerCase() === 'nexus' ||
        node.type === 'output' ||
        ((integrationInfo.toolkit === 'unknown' || integrationInfo.toolkit === 'default') && hasOutputPattern)
      )
      // @NEXUS-FIX-110-END

      // ====================================================================
      // TRIGGER NODE HANDLING
      // ====================================================================

      if (isTriggerNode) {
        const triggerData = state.triggerSampleData as Record<string, Record<string, unknown>> | undefined
        const sampleData = triggerData?.[node.id]

        if (!sampleData || Object.keys(sampleData).length === 0) {
          // No sample data — pause execution and ask host for data
          log(`\u23F8\uFE0F ${node.name} - Needs sample data for beta test`)

          // Dispatch trigger data needed
          dispatchAndTrack({ type: 'TRIGGER_DATA_NEEDED', nodeId: node.id, nodeIndex: i })

          // Create checkpoint for resume
          const cp = createCheckpoint(workflow.id, i, state, nodes, workflow.collectedParams as Record<string, string> || {}, 'paused')
          dispatchAndTrack({ type: 'CHECKPOINT', checkpoint: cp })
          dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'ready' })
          return // Pause — host will re-invoke with checkpoint after user provides data
        }

        const wasSkipped = (sampleData as Record<string, unknown>)?._skipped === 'true'

        if (wasSkipped) {
          log(`\u26A1 ${node.name} - Skipped (no sample data provided)`)
          dispatchAndTrack({
            type: 'NODES_BATCH_UPDATE',
            updates: buildBatchSuccessUpTo(nodes.length, i, {
              type: 'trigger_skipped',
              data: {},
              message: 'Trigger skipped (no sample data)',
              note: 'In production, this would receive real events from the webhook'
            })
          })
        } else {
          log(`\u26A1 ${node.name} - Using sample data: ${JSON.stringify(sampleData).substring(0, 50)}...`)
          dispatchAndTrack({
            type: 'NODES_BATCH_UPDATE',
            updates: buildBatchSuccessUpTo(nodes.length, i, {
              type: 'trigger_sample_data',
              data: sampleData,
              message: 'Sample data received (beta test)',
              note: 'In production, this would be real event data from the webhook'
            })
          })
        }
        continue // Move to next node
      }

      // ====================================================================
      // AI NODE HANDLING
      // ====================================================================

      // @NEXUS-FIX-144: Real AI execution via backend Claude call - DO NOT REMOVE
      if (isAINode) {
        log(`\uD83E\uDD16 ${node.name} - AI processing...`)

        try {
          // Gather context from previous steps for data flow
          const prevResults = state.nodeResults.slice(0, i).filter(Boolean)
          const prevData: Record<string, unknown> = {}
          for (const r of prevResults) {
            const res = r as Record<string, unknown>
            if (res?.type === 'trigger_sample_data' && res.data) Object.assign(prevData, res.data as Record<string, unknown>)
            if (res?.type === 'ai_output' && res.generated) prevData.previous_ai_output = res.generated
            if (res?.text) prevData.previous_text = res.text
          }

          const complexity = gaugeComplexity(node.name, node.description || '')
          const aiPrompt = node.description || node.name

          const response = await svc.fetch('/api/workflow/ai-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: aiPrompt, previousData: prevData, complexity }),
          })

          if (!response.ok) throw new Error(`AI step failed: ${response.status}`)
          const aiResult = await response.json()
          if (!aiResult.success) throw new Error(aiResult.error || 'AI processing failed')

          // @NEXUS-FIX-171: AI step output validation - DO NOT REMOVE
          if (!aiResult.output || typeof aiResult.output !== 'string' || aiResult.output.trim().length === 0) {
            throw new Error('AI step produced empty output \u2014 please try again')
          }
          if (aiResult.output.length > 10000) {
            aiResult.output = aiResult.output.substring(0, 10000) + '... [truncated]'
          }

          log(`\u2713 ${node.name}: Done (${aiResult.tier || 'ai'}, ${aiResult.tokensUsed || 0} tokens)`)

          dispatchAndTrack({
            type: 'NODES_BATCH_UPDATE',
            updates: buildBatchSuccessUpTo(nodes.length, i, {
              type: 'ai_output',
              generated: aiResult.output,
              text: aiResult.output,
              message: `AI generated: ${(aiResult.output || '').substring(0, 80)}...`,
              data: { generated_content: aiResult.output, ai_output: aiResult.output, text: aiResult.output },
            })
          })
        } catch (aiErr) {
          throw aiErr // Let the error handler below handle it
        }
        continue
      }

      // ====================================================================
      // INTERNAL/OUTPUT NODE HANDLING
      // ====================================================================

      if (isInternalNode) {
        log(`\uD83D\uDCCA ${node.name} - Internal Nexus step`)

        // Brief delay for UX consistency
        await new Promise(resolve => setTimeout(resolve, 300))

        // Collect results from previous nodes
        const previousResults = state.nodeResults.slice(0, i).filter(Boolean)

        dispatchAndTrack({
          type: 'NODES_BATCH_UPDATE',
          updates: buildBatchSuccessUpTo(nodes.length, i, {
            type: 'internal_output',
            message: `${node.name} complete`,
            note: 'Internal Nexus step - displays workflow results',
            previousData: previousResults.length > 0 ? previousResults : 'No data from previous steps'
          })
        })
        continue
      }

      // ====================================================================
      // @NEXUS-FIX-178: HITL APPROVAL NODE HANDLING - DO NOT REMOVE
      // ====================================================================

      const isExplicitApprovalNode = node.type === 'approval'

      if (isExplicitApprovalNode) {
        log(`${node.name} - Approval required`)

        const approvalConfig = (node as unknown as Record<string, unknown>).approvalConfig as Record<string, unknown> || {}

        const approvalContext = {
          data: {
            workflowName: workflow.name,
            stepName: node.name,
            stepIndex: i,
            ...(node.config || {}),
          },
          reason: (approvalConfig.reason || approvalConfig.approvalMessage || `Approval required for: ${node.name}`) as string,
          displayMessage: (approvalConfig.approvalMessage || `Please review before proceeding with "${node.name}"`) as string,
          riskLevel: (approvalConfig.riskLevel || 'medium') as string,
        }

        // Create the approval request via HITL library
        const requestId = await svc.pauseForApproval(
          workflow.id,
          node.id,
          approvalContext,
          {
            priority: (approvalConfig.priority || 'medium') as string,
            workflowName: workflow.name,
            stepName: node.name,
            timeoutMs: approvalConfig.timeoutMs as number | undefined,
          }
        )

        // Dispatch approval needed action
        dispatchAndTrack({
          type: 'APPROVAL_NEEDED',
          nodeIndex: i,
          approvalRequestId: requestId,
          approvalContext: {
            workflowName: workflow.name,
            stepName: node.name,
            stepIndex: i,
            reason: approvalContext.reason,
            displayMessage: approvalContext.displayMessage,
            riskLevel: approvalContext.riskLevel,
            config: node.config,
          },
        })

        // Update node status
        dispatchAndTrack({ type: 'NODE_STATUS', index: i, status: 'awaiting_approval' as NodeStatus })

        // Create checkpoint for resume after approval
        const cp = createCheckpoint(workflow.id, i, state, nodes, workflow.collectedParams as Record<string, string> || {}, 'awaiting_approval')
        dispatchAndTrack({ type: 'CHECKPOINT', checkpoint: cp })
        dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'awaiting_approval' })

        // Try to send WhatsApp notification (non-blocking)
        try {
          await svc.fetch('/api/workflow/notify-approval', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId,
              workflowName: workflow.name,
              stepName: node.name,
              approvalConfig,
              channel: 'whatsapp',
            }),
          })
        } catch {
          // WhatsApp notification is non-blocking
        }

        log('Waiting for approval...')
        return // PAUSE — host will re-invoke with checkpoint after approval
      }
      // @NEXUS-FIX-178-END

      // ====================================================================
      // @NEXUS-FIX-146: NATIVE WHATSAPP EXECUTION via Baileys - DO NOT REMOVE
      // ====================================================================

      if (integrationInfo.toolkit.toLowerCase() === 'whatsapp' ||
          (node.config as Record<string, unknown>)?.executorHint === 'native-whatsapp') {
        log(`\uD83D\uDCF1 ${node.name} - Sending via WhatsApp...`)
        try {
          // Resolve message content from previous steps
          const previousNodeResults = nodes.slice(0, i).map((n, idx) => ({ node: n, result: state.nodeResults[idx] }))
          const pipeResult = await svc.resolveParamsWithPipeline(
            'WHATSAPP_SEND_MESSAGE',
            'whatsapp',
            node,
            workflow.collectedParams as Record<string, string> | undefined,
            { name: workflow.name, description: workflow.description },
            previousNodeResults
          )
          const p = pipeResult.params

          // @NEXUS-FIX-172: Canonical WhatsApp message resolution - DO NOT REMOVE
          const waMessage = (() => {
            if (p.message && typeof p.message === 'string') return p.message
            const lastAI = [...previousNodeResults].reverse().find((r: unknown) => (r as Record<string, unknown>)?.type === 'ai_output')
            if (lastAI && (lastAI as Record<string, unknown>).generated) return (lastAI as Record<string, unknown>).generated as string
            const lastText = [...previousNodeResults].reverse().find((r: unknown) => (r as Record<string, unknown>)?.text)
            if (lastText) return (lastText as Record<string, unknown>).text as string
            return (p.text || p.body || p.notification_text || '') as string
          })()
          const waTo = (p.to || p.phone || p.phone_number ||
            (workflow.collectedParams as Record<string, string>)?.whatsapp || '') as string

          if (!waTo) {
            throw new Error('Missing Information: Send WhatsApp Message [param:to]\n\n\uD83D\uDCA1 I need the recipient phone number to send this WhatsApp message.\nPlease tell me:\n\u2022 Who should I send the WhatsApp message to? (phone number with country code)')
          }
          if (!waMessage) {
            throw new Error('Missing Information: Send WhatsApp Message [param:message]\n\n\uD83D\uDCA1 I need the message content.\nPlease tell me:\n\u2022 What message should I send?')
          }

          // Find active Baileys session (FIX-185: use persistent backend URL)
          const sessResp = await svc.fetch(`${context.waBackendUrl}/sessions`)
          const sessData = await sessResp.json()
          const activeSession = sessData.sessions?.find((s: { state: string }) => s.state === 'ready')

          if (!activeSession) {
            throw new Error('WhatsApp is not connected. Please connect WhatsApp first using the QR code in Settings \u2192 WhatsApp.')
          }

          // Send via Baileys API (FIX-185: use persistent backend URL)
          const sendResp = await svc.fetch(`${context.waBackendUrl}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: activeSession.id,
              to: waTo.replace(/[^0-9]/g, ''),
              message: waMessage,
            }),
          })

          const sendResult = await sendResp.json()
          if (!sendResult.success) throw new Error(sendResult.error || 'Failed to send WhatsApp message')

          log(`\u2713 ${node.name}: Message sent to ${waTo}`)
          dispatchAndTrack({
            type: 'NODES_BATCH_UPDATE',
            updates: buildBatchSuccessUpTo(nodes.length, i, {
              type: 'whatsapp_sent',
              messageId: sendResult.messageId,
              to: waTo,
              message: waMessage.substring(0, 100),
              _verified: true,
              _proof: { type: 'message_sent', details: { id: sendResult.messageId, destination: waTo, summary: `WhatsApp message sent to ${waTo}` } },
            })
          })
          continue // Skip Composio path
        } catch (waErr) {
          throw waErr // Let error handler below handle it
        }
      }

      // ====================================================================
      // ACTION NODE EXECUTION — Tool slug resolution + Composio/Rube
      // ====================================================================

      // @NEXUS-FIX-062: Orchestration-First Execution Path - DO NOT REMOVE
      const toolkitLower = integrationInfo.toolkit.toLowerCase().replace(/\s+/g, '').replace(/-/g, '')
      let toolSlug: string | null = null

      // @NEXUS-FIX-062: Check for pre-discovered orchestration result FIRST (for ALL toolkits)
      const storedOrchResult = state.orchestrationResults.get(node.id)
      if (storedOrchResult && storedOrchResult.slug) {
        toolSlug = storedOrchResult.slug
        const isKnown = svc.isToolkitKnown(toolkitLower)

        // @NEXUS-FIX-063: Override orchestration slug with legacy for KNOWN toolkits - DO NOT REMOVE
        if (isKnown) {
          const legacySlug = svc.mapNodeToToolSlug(node.name, integrationInfo.toolkit)
          if (legacySlug && legacySlug !== toolSlug) {
            console.log(`[ORCHESTRATION-FIRST] FIX-063: Overriding execution slug ${toolSlug} with legacy slug ${legacySlug}`)
            toolSlug = legacySlug
          }
        }

        if (config.useOrchestrationFirst && isKnown) {
          console.log(`[ORCHESTRATION-FIRST] Using tool for KNOWN toolkit ${toolkitLower}: ${toolSlug}`)
        } else {
          console.log(`[ORCHESTRATION] Using pre-discovered tool for ${node.id}: ${toolSlug}`)
        }
      } else if (svc.isToolkitKnown(toolkitLower)) {
        // KNOWN TOOLKIT with no orchestration result: Use legacy fast path
        toolSlug = svc.mapNodeToToolSlug(node.name, integrationInfo.toolkit)
        console.log(`[LEGACY] Using legacy path for known toolkit ${toolkitLower}: ${toolSlug}`)
      } else if (config.useGenericOrchestration) {
        // UNKNOWN TOOLKIT with no orchestration result: Try orchestration now
        log(`\uD83D\uDD0D ${node.name} - Unknown toolkit "${integrationInfo.toolkit}", discovering via orchestration...`)
        console.log(`[ORCHESTRATION] Unknown toolkit "${integrationInfo.toolkit}" - trying orchestration first`)
        const orchResult = await svc.resolveToolViaOrchestration(node.name, integrationInfo.toolkit)
        if (orchResult) {
          toolSlug = orchResult.slug
          log(`\u2705 Discovered: ${orchResult.displayName} (${orchResult.slug})`)
          console.log(`[ORCHESTRATION] Session: ${orchResult.sessionId}, Questions: ${orchResult.questions.length}`)
          dispatchAndTrack({ type: 'STORE_ORCHESTRATION_RESULT', nodeId: node.id, result: orchResult })
        } else {
          // Orchestration failed - fall back to dynamic construction
          console.log(`[ORCHESTRATION] Discovery failed for "${integrationInfo.toolkit}", using dynamic construction fallback`)
          toolSlug = svc.mapNodeToToolSlug(node.name, integrationInfo.toolkit)
        }
      } else {
        // Orchestration disabled - use legacy dynamic construction
        toolSlug = svc.mapNodeToToolSlug(node.name, integrationInfo.toolkit)
      }

      // @NEXUS-FIX-019: Pre-execution tool validation - DO NOT REMOVE
      if (toolSlug) {
        const validation = svc.validateToolSlug(toolSlug, integrationInfo.toolkit)
        if (!validation.valid && validation.suggestion) {
          log(`\u26A0\uFE0F Validation: ${validation.reason}`)
        }
      }

      if (!toolSlug) {
        throw new Error(
          `No tool mapping for "${node.name}" (toolkit: ${integrationInfo.toolkit}). ` +
          `This integration is not yet supported. Please check that ${integrationInfo.name} ` +
          `is correctly configured and has the required API access.`
        )
      }

      // @NEXUS-FIX-043: Resolve params via ParamResolutionPipeline with legacy fallback - DO NOT REMOVE
      // @NEXUS-FIX-113: Pass previous node results for data flow between steps - DO NOT REMOVE
      // @NEXUS-FIX-029: Merge collected params from user answers (handled inside pipeline) - DO NOT REMOVE
      const previousNodeResults = nodes.slice(0, i).map((n, idx) => ({ node: n, result: state.nodeResults[idx] }))
      const pipelineResult = await svc.resolveParamsWithPipeline(
        toolSlug,
        integrationInfo.toolkit,
        node,
        workflow.collectedParams as Record<string, string> | undefined,
        { name: workflow.name, description: workflow.description },
        previousNodeResults
      )
      const params = pipelineResult.params
      console.log(`[ExecutionEngine] Final params via ${pipelineResult.source}:`, params)

      // @NEXUS-FIX-062: Dynamic schema-based parameter validation - DO NOT REMOVE
      let missingParams: string[] = []
      const storedOrch = state.orchestrationResults.get(node.id)
      if (storedOrch?.sessionId) {
        try {
          const schemaResolver = svc.getSchemaResolver()
          const schema = await schemaResolver.getSchema(toolSlug, storedOrch.sessionId)
          console.log(`[ExecutionEngine] FIX-062: Got schema for ${toolSlug}, required: ${schema.required?.join(', ') || 'none'}`)

          const requiredFromSchema = schema.required || []
          missingParams = requiredFromSchema.filter(param => {
            const value = params[param]
            return value === undefined || value === null || value === ''
          })
        } catch (schemaError) {
          console.warn(`[ExecutionEngine] FIX-062: Schema fetch failed, using fallback validation`, schemaError)
          missingParams = svc.validateRequiredParams(toolSlug, params)
        }
      } else if (pipelineResult.source === 'pipeline' && pipelineResult.resolved) {
        missingParams = pipelineResult.resolved.missingRequired
      } else {
        missingParams = svc.validateRequiredParams(toolSlug, params)
      }

      // @NEXUS-FIX-021: User-friendly missing parameter messages - DO NOT REMOVE
      // @NEXUS-FIX-031: Include raw param name for correct collection key - DO NOT REMOVE
      // @NEXUS-FIX-043: Use enhanced missing params from pipeline when available - DO NOT REMOVE
      // @NEXUS-FIX-204: Auto-fill missing params with smart defaults before throwing - DO NOT REMOVE
      if (missingParams.length > 0) {
        const toolkit = integrationInfo.toolkit.toLowerCase()
        const trulyMissing: string[] = []

        for (const paramName of missingParams) {
          const pLower = paramName.toLowerCase()
          let autoValue: string | null = null

          // Content/message params
          if (pLower === 'content' || pLower === 'text' || pLower === 'message' || pLower === 'body') {
            const prevResults = state.nodeResults.slice(0, i).filter(Boolean)
            if (prevResults.length > 0) {
              autoValue = `\uD83D\uDCCB Workflow update from ${workflow.name}: Step "${node.name}" triggered`
            } else {
              autoValue = `Automated notification from workflow: ${workflow.name}`
            }
            console.log(`[FIX-204] Auto-filled ${paramName} with context message for ${toolkit}`)
          }
          // Channel params
          else if (pLower === 'channel' || pLower === 'channel_id') {
            autoValue = toolkit === 'slack' ? 'general' : toolkit === 'discord' ? 'general' : 'general'
            console.log(`[FIX-204] Auto-filled ${paramName} \u2192 "${autoValue}" for ${toolkit}`)
          }
          // Subject params
          else if (pLower === 'subject' || pLower === 'email_subject' || pLower === 'subject_line') {
            autoValue = `${workflow.name} \u2014 Automated Update`
            console.log(`[FIX-204] Auto-filled ${paramName} with subject for ${toolkit}`)
          }
          // Name/title params
          else if (pLower === 'name' || pLower === 'title' || pLower === 'summary' || pLower === 'item_name' || pLower === 'task_name') {
            autoValue = node.name || workflow.name || 'Nexus Workflow Item'
            console.log(`[FIX-204] Auto-filled ${paramName} \u2192 "${autoValue}" for ${toolkit}`)
          }
          // Description params
          else if (pLower === 'description' || pLower === 'desc' || pLower === 'notes') {
            autoValue = workflow.description || `Created by ${workflow.name} workflow`
            console.log(`[FIX-204] Auto-filled ${paramName} with description for ${toolkit}`)
          }
          // Topic params
          else if (pLower === 'topic') {
            autoValue = node.name || 'Nexus Meeting'
            console.log(`[FIX-204] Auto-filled ${paramName} \u2192 "${autoValue}" for ${toolkit}`)
          }
          // Path/folder params
          else if (pLower === 'path' || pLower === 'folder' || pLower === 'folder_path') {
            autoValue = '/'
            console.log(`[FIX-204] Auto-filled ${paramName} \u2192 "/" for ${toolkit}`)
          }
          // List/board ID params
          else if (pLower === 'list_id' || pLower === 'board_id' || pLower === 'project_key') {
            autoValue = 'default'
            console.log(`[FIX-204] Auto-filled ${paramName} \u2192 "default" for ${toolkit}`)
          }

          if (autoValue) {
            params[paramName] = autoValue
          } else {
            trulyMissing.push(paramName)
          }
        }

        // Only throw if there are TRULY missing params that cannot be auto-filled
        if (trulyMissing.length > 0) {
          const enhancedMissing = svc.getEnhancedMissingParams(
            pipelineResult.resolved,
            integrationInfo.toolkit,
            trulyMissing
          )
          const friendlyPrompts = enhancedMissing.map(p => p.prompt)
          // @NEXUS-FIX-031: Include first missing param name for UI to use as collection key
          throw new Error(
            `Missing Information: ${node.name} [param:${trulyMissing[0]}]\n\n` +
            `\uD83D\uDCA1 I need more details to complete this step. Please tell me:\n` +
            friendlyPrompts.map(p => `\u2022 ${p}`).join('\n')
          )
        } else {
          console.log(`[FIX-204] All ${missingParams.length} missing params auto-filled! Proceeding with execution.`)
        }
      }

      // @NEXUS-FIX-115: Pre-execution connection validation - DO NOT REMOVE
      try {
        const connStatus = await svc.checkConnection(integrationInfo.toolkit)
        if (!connStatus.connected) {
          log(`\u26A0\uFE0F ${integrationInfo.name} connection may be expired \u2014 attempting execution anyway...`)
          console.warn(`[FIX-115] ${integrationInfo.toolkit} not connected before execution. Will attempt anyway.`)
        }
      } catch (connCheckErr) {
        console.warn(`[FIX-115] Connection pre-check failed for ${integrationInfo.toolkit}:`, connCheckErr)
      }
      // @NEXUS-FIX-115-END

      // @NEXUS-FIX-041: Execute with VERIFICATION via VerifiedExecutor - DO NOT REMOVE
      const verifiedResult = await svc.verifiedExecute(
        toolSlug,
        params,
        {
          nodeId: node.id,
          nodeName: node.name,
          toolkit: integrationInfo.toolkit,
          action: node.type,
          workflowName: workflow.name,
        }
      )

      const executionTime = verifiedResult.executionTimeMs

      if (verifiedResult.success && verifiedResult.verified) {
        // VERIFIED SUCCESS
        const proofSummary = verifiedResult.proof
          ? svc.formatProofForDisplay(verifiedResult.proof)
          : 'Completed'
        log(`\u2713 ${node.name}: ${proofSummary} (${executionTime}ms)`)

        const rawData = (verifiedResult.rawResponse as Record<string, unknown>) || {}
        dispatchAndTrack({
          type: 'NODES_BATCH_UPDATE',
          updates: buildBatchSuccessUpTo(nodes.length, i, {
            ...rawData,
            _verified: true,
            _proof: verifiedResult.proof,
          })
        })
      } else if (verifiedResult.success && !verifiedResult.verified) {
        // API succeeded but couldn't verify
        log(`\u26A0\uFE0F ${node.name}: Completed but unverified (${executionTime}ms)`)
        console.warn('[ExecutionEngine] Unverified result:', verifiedResult)

        const rawDataUnverified = (verifiedResult.rawResponse as Record<string, unknown>) || {}
        dispatchAndTrack({
          type: 'NODES_BATCH_UPDATE',
          updates: buildBatchSuccessUpTo(nodes.length, i, {
            ...rawDataUnverified,
            _verified: false,
            _warning: verifiedResult.error?.message || 'Could not verify action',
          })
        })
      } else {
        // Execution failed
        const errorMsg = verifiedResult.error?.message || 'Execution failed'
        throw new Error(errorMsg)
      }

    } catch (error) {
      // ====================================================================
      // ERROR HANDLING
      // ====================================================================

      console.error(`[ExecutionEngine] Error executing ${node.name}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Handle abort errors specially
      if (error instanceof DOMException && error.name === 'AbortError') {
        state.aborted = true
        dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'error' })
        log('Workflow cancelled by user.')
        dispatchAndTrack({ type: 'EXECUTION_COMPLETE', success: false, workflowName: workflow.name })
        return
      }

      // @NEXUS-FIX-039: Enhanced error classification - DO NOT REMOVE
      const catchIntegrationInfo = svc.getIntegrationInfo(node.integration || node.name)
      const errorAnalysis = svc.classifyError(error as Error, {
        nodeId: node.id,
        toolkit: catchIntegrationInfo.toolkit,
        nodeName: node.name,
      })
      const friendlyMsg = errorAnalysis.friendlyMessage

      // @NEXUS-FIX-111: Auto-retry for recoverable errors - DO NOT REMOVE
      const retryableCategories = ['rate_limited', 'network_error', 'timeout', 'service_unavailable']
      const errorCategory = errorAnalysis.classification?.category || 'unknown'
      const isRetryable = retryableCategories.includes(errorCategory)
      const maxRetries = errorCategory === 'rate_limited' ? 3 : 2
      const nodeRetryKey = `retry_${node.id}`
      const currentRetry = (state.retryCounts.get(nodeRetryKey) || 0)

      if (isRetryable && currentRetry < maxRetries) {
        state.retryCounts.set(nodeRetryKey, currentRetry + 1)
        const backoffMs = Math.min(2000 * Math.pow(2, currentRetry), 15000)
        log(`\u23F3 ${node.name}: ${friendlyMsg} \u2014 Retrying in ${Math.round(backoffMs / 1000)}s (attempt ${currentRetry + 1}/${maxRetries})...`)

        // Set node to connecting during retry wait
        dispatchAndTrack({ type: 'NODE_STATUS', index: i, status: 'connecting' })

        await new Promise(resolve => setTimeout(resolve, backoffMs))
        i-- // Will be incremented by for loop, net effect: retry same node
        continue
      }
      // @NEXUS-FIX-111-END

      // @NEXUS-FIX-020: Tool-not-found detection with fallback suggestions - DO NOT REMOVE
      if (svc.isToolNotFoundError(error as Error)) {
        const catchToolSlug = svc.mapNodeToToolSlug(node.name, catchIntegrationInfo.toolkit)
        const fallbacks = svc.getFallbackTools(catchIntegrationInfo.toolkit, catchToolSlug || '', node.name)
        if (fallbacks.length > 0) {
          log(`\u26A0\uFE0F Tool not found: ${catchToolSlug}. Try: ${fallbacks.join(', ')}`)
        } else {
          log(`\u2717 ${node.name}: ${friendlyMsg}`)
        }
      } else {
        log(`\u2717 ${node.name}: ${friendlyMsg}`)
      }

      // @NEXUS-FIX-112: Continue-on-error for non-critical nodes - DO NOT REMOVE
      const catchNodeNameLower = node.name.toLowerCase()
      const isNonCriticalNode = catchNodeNameLower.includes('notify') ||
        catchNodeNameLower.includes('alert') ||
        catchNodeNameLower.includes('log') ||
        catchNodeNameLower.includes('notification') ||
        node.type === 'output' ||
        (i === nodes.length - 1 && catchNodeNameLower.includes('summary'))

      if (isNonCriticalNode && !errorMessage.includes('Missing Information')) {
        log(`\u26A0\uFE0F ${node.name}: Skipped (non-critical) \u2014 ${friendlyMsg}`)
        dispatchAndTrack({
          type: 'NODE_STATUS',
          index: i,
          status: 'success',
          result: {
            _skipped: true,
            _warning: friendlyMsg,
            _error: errorMessage,
          }
        })
        continue // Skip this node and continue workflow
      }
      // @NEXUS-FIX-112-END

      // Execution genuinely failed
      dispatchAndTrack({ type: 'NODE_STATUS', index: i, status: 'error', error: errorMessage })
      dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'error' })
      svc.recordEvent('workflow_executed', { success: false, name: workflow.name })
      dispatchAndTrack({ type: 'EXECUTION_COMPLETE', success: false, workflowName: workflow.name })
      return
    }
  }

  // ========================================================================
  // All nodes completed successfully!
  // ========================================================================

  log('Workflow completed successfully!')
  dispatchAndTrack({ type: 'PHASE_CHANGE', phase: 'complete' })
  svc.recordEvent('workflow_executed', {
    success: true,
    name: workflow.name,
    integrations: context.requiredIntegrations.map(i => i.toolkit),
  })
  dispatchAndTrack({
    type: 'EXECUTION_COMPLETE',
    success: true,
    workflowName: workflow.name,
    integrations: context.requiredIntegrations.map(i => i.toolkit),
  })
}

// ============================================================================
// Service Factory — Creates EngineServices from existing WPC imports
// ============================================================================

/**
 * Create an EngineServices object by wiring up existing WPC service imports.
 * Called once when the component mounts or when services change.
 * This is the bridge between the extracted engine and the existing service layer.
 */
export function createEngineServices(deps: {
  getIntegrationInfo: (integration: string) => import('@/services/IntegrationAuthService').IntegrationInfo
  mapNodeToToolSlug: (name: string, toolkit: string) => string | null
  validateToolSlug: (slug: string, toolkit: string) => { valid: boolean; reason?: string; suggestion?: string }
  isToolkitKnown: (toolkit: string) => boolean
  resolveToolViaOrchestration: (name: string, toolkit: string) => Promise<OrchestrationResult | null>
  resolveParamsWithPipeline: (...args: unknown[]) => Promise<unknown>
  validateRequiredParams: (slug: string, params: Record<string, unknown>) => string[]
  getEnhancedMissingParams: (resolved: unknown, toolkit: string, missing: string[]) => Array<{ param: string; prompt: string; toolkit: string }>
  getSchemaResolver: () => { getSchema: (slug: string, sessionId: string) => Promise<{ required?: string[] }> }
  verifiedExecute: (slug: string, params: Record<string, unknown>, ctx: unknown) => Promise<unknown>
  formatProofForDisplay: (proof: unknown) => string
  classifyError: (error: Error, ctx: unknown) => { friendlyMessage: string; classification?: { category: string; severity: string; isRecoverable: boolean } }
  isToolNotFoundError: (error: Error) => boolean
  getFallbackTools: (toolkit: string, slug: string, name: string) => string[]
  checkConnection: (toolkit: string) => Promise<{ connected: boolean }>
  pauseForApproval: (workflowId: string, nodeId: string, ctx: unknown, opts: unknown) => Promise<string>
  getApprovalRequest: (id: string) => unknown
  recordEvent: (type: string, data: Record<string, unknown>) => void
  fetch: (url: string, options?: RequestInit) => Promise<Response>
}): EngineServices {
  return deps as unknown as EngineServices
}
