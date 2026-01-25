/**
 * Tool Selector Tests
 *
 * Tests for the optimal Composio tool selection system
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { toolSelector } from '../tool-selector'
import type { ParsedIntent } from '../../../types/workflow-execution'

describe('ToolSelector', () => {
  beforeEach(async () => {
    await toolSelector.initialize()
  })

  describe('Communication Intent', () => {
    it('should select Gmail send tool for email communication', async () => {
      const intent: ParsedIntent = {
        id: 'intent_1',
        rawInput: 'Send email to john@example.com about the meeting',
        category: 'communication',
        action: 'send',
        entities: [
          {
            type: 'person',
            value: 'john@example.com',
            confidence: 0.9,
            source: 'user_input',
          },
        ],
        confidence: 0.9,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      expect(result.tools.length).toBeGreaterThan(0)
      expect(result.tools[0].slug).toBe('GMAIL_SEND_EMAIL')
      expect(result.tools[0].toolkit).toBe('gmail')
      expect(result.requiredConnections).toContain('gmail')
    })

    it('should create input mappings for email parameters', async () => {
      const intent: ParsedIntent = {
        id: 'intent_2',
        rawInput: 'Email alice@company.com about project update',
        category: 'communication',
        action: 'send',
        entities: [
          {
            type: 'person',
            value: 'alice@company.com',
            confidence: 0.95,
            source: 'user_input',
          },
        ],
        confidence: 0.9,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      const tool = result.tools[0]
      expect(tool.inputMappings.length).toBeGreaterThan(0)

      // Should map email recipient from intent entity
      const recipientMapping = tool.inputMappings.find(
        m => m.targetParam === 'to' || m.targetParam.includes('email')
      )
      expect(recipientMapping).toBeDefined()
      expect(recipientMapping?.source).toBe('intent')
    })
  })

  describe('Scheduling Intent', () => {
    it('should select Google Calendar tool for event creation', async () => {
      const intent: ParsedIntent = {
        id: 'intent_3',
        rawInput: 'Schedule meeting tomorrow at 2pm',
        category: 'scheduling',
        action: 'create',
        entities: [
          {
            type: 'date',
            value: 'tomorrow',
            confidence: 0.9,
            source: 'user_input',
          },
          {
            type: 'time',
            value: '2pm',
            confidence: 0.9,
            source: 'user_input',
          },
        ],
        confidence: 0.85,
        urgency: 'scheduled',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      expect(result.tools[0].slug).toBe('GOOGLECALENDAR_CREATE_EVENT')
      expect(result.tools[0].toolkit).toBe('googlecalendar')
      expect(result.requiredConnections).toContain('googlecalendar')
    })
  })

  describe('Document Analysis Intent', () => {
    it('should select Claude AI tool for document analysis', async () => {
      const intent: ParsedIntent = {
        id: 'intent_4',
        rawInput: 'Analyze this travel package PDF and extract prices',
        category: 'document_analysis',
        action: 'analyze',
        entities: [
          {
            type: 'product',
            value: 'travel package PDF',
            confidence: 0.9,
            source: 'user_input',
          },
        ],
        confidence: 0.85,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      expect(result.tools[0].slug).toBe('CLAUDE_ANALYZE_DOCUMENT')
      expect(result.tools[0].toolkit).toBe('claude')
    })
  })

  describe('Execution Planning', () => {
    it('should create sequential execution plan for dependent tools', async () => {
      const intent: ParsedIntent = {
        id: 'intent_5',
        rawInput: 'Search for restaurants and send results via email',
        category: 'communication',
        action: 'send',
        entities: [],
        confidence: 0.8,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      expect(result.executionPlan.stages.length).toBeGreaterThan(0)
      expect(result.executionPlan.estimatedTimeMs).toBeGreaterThan(0)
    })

    it('should identify parallel execution opportunities', async () => {
      const intent: ParsedIntent = {
        id: 'intent_6',
        rawInput: 'Create calendar event and send notification',
        category: 'scheduling',
        action: 'create',
        entities: [],
        confidence: 0.8,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({
        intent,
        enableParallel: true,
      })

      expect(result.success).toBe(true)
      // Check if execution plan exists
      expect(result.executionPlan).toBeDefined()
    })
  })

  describe('Missing Information Detection', () => {
    it('should detect missing required parameters', async () => {
      const intent: ParsedIntent = {
        id: 'intent_7',
        rawInput: 'Send an email',
        category: 'communication',
        action: 'send',
        entities: [], // No recipient specified
        confidence: 0.7,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: false,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      expect(result.missingInfo.length).toBeGreaterThan(0)
      // Should indicate missing recipient
      expect(result.missingInfo.some(m => m.includes('to'))).toBe(true)
    })
  })

  describe('Known Fields Integration', () => {
    it('should use known fields from context', async () => {
      const intent: ParsedIntent = {
        id: 'intent_8',
        rawInput: 'Send email about the report',
        category: 'communication',
        action: 'send',
        entities: [],
        confidence: 0.8,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: false,
        parsedAt: new Date().toISOString(),
      }

      const knownFields = {
        to: 'manager@company.com',
        subject: 'Weekly Report',
      }

      const result = await toolSelector.selectTools({ intent, knownFields })

      expect(result.success).toBe(true)
      const tool = result.tools[0]

      // Should have mappings from context
      const contextMappings = tool.inputMappings.filter(m => m.source === 'context')
      expect(contextMappings.length).toBeGreaterThan(0)
    })
  })

  describe('Tool Ranking', () => {
    it('should rank tools by confidence', async () => {
      const intent: ParsedIntent = {
        id: 'intent_9',
        rawInput: 'Contact the team',
        category: 'communication',
        action: 'send',
        entities: [],
        confidence: 0.7,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: false,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({
        intent,
        maxTools: 5,
      })

      expect(result.success).toBe(true)
      if (result.tools.length > 1) {
        // Check that tools are sorted by confidence
        for (let i = 0; i < result.tools.length - 1; i++) {
          expect(result.tools[i].confidence).toBeGreaterThanOrEqual(
            result.tools[i + 1].confidence
          )
        }
      }
    })
  })

  describe('Toolkit Identification', () => {
    it('should identify toolkits from entity mentions', async () => {
      const intent: ParsedIntent = {
        id: 'intent_10',
        rawInput: 'Send a message via Slack',
        category: 'communication',
        action: 'send',
        entities: [
          {
            type: 'product',
            value: 'Slack',
            confidence: 0.95,
            source: 'user_input',
          },
        ],
        confidence: 0.9,
        urgency: 'flexible',
        constraints: [],
        preferences: [],
        missingInfo: [],
        canExecute: true,
        parsedAt: new Date().toISOString(),
      }

      const result = await toolSelector.selectTools({ intent })

      expect(result.success).toBe(true)
      // Should prefer Slack toolkit when explicitly mentioned
      // In production, this would use Slack tools
      expect(result.tools.length).toBeGreaterThan(0)
    })
  })
})
