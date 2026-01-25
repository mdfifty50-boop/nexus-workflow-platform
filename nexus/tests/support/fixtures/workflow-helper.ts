/**
 * Workflow Helper for Nexus E2E Tests
 *
 * Provides utilities for testing workflow execution:
 * - Creating workflows via UI
 * - Monitoring workflow progress
 * - Verifying workflow completion
 * - Testing real-time SSE updates
 */

import { type Page, expect } from '@playwright/test';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentId?: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  status: 'idle' | 'planning' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  tokensUsed: number;
  costUsd: number;
}

export class WorkflowHelper {
  private page: Page;
  private createdWorkflowIds: string[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to dashboard and create a workflow via chat
   */
  async createWorkflowViaChat(prompt: string): Promise<string> {
    // Navigate to dashboard if not already there
    if (!this.page.url().includes('/dashboard')) {
      await this.page.goto('/dashboard');
    }

    // Find and click chat input
    const chatInput = this.page.locator('[data-testid="chat-input"], textarea[placeholder*="workflow"], input[placeholder*="task"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Enter prompt
    await chatInput.fill(prompt);

    // Submit
    await this.page.click('[data-testid="chat-submit"], button[type="submit"]:has-text("Send"), button:has-text("Generate")');

    // Wait for workflow generation response
    await this.page.waitForSelector('[data-testid="workflow-preview"], .workflow-visualization', { timeout: 30000 });

    // Extract workflow ID from the page
    const workflowId = await this.extractWorkflowId();
    if (workflowId) {
      this.createdWorkflowIds.push(workflowId);
    }

    return workflowId || '';
  }

  /**
   * Execute a workflow and wait for completion
   */
  async executeWorkflow(_workflowId?: string): Promise<WorkflowState> {
    // Click execute button
    const executeButton = this.page.locator('[data-testid="execute-workflow"], button:has-text("Execute"), button:has-text("Run")');
    await expect(executeButton).toBeVisible();
    await executeButton.click();

    // Wait for workflow to start
    await this.page.waitForSelector('[data-testid="workflow-running"], .workflow-status:has-text("Running")', { timeout: 10000 });

    // Wait for completion (with timeout for long workflows)
    const completionTimeout = parseInt(process.env.WORKFLOW_TIMEOUT || '60000');
    await this.page.waitForSelector(
      '[data-testid="workflow-completed"], .workflow-status:has-text("Completed"), .workflow-status:has-text("Failed")',
      { timeout: completionTimeout }
    );

    // Get final state
    return this.getWorkflowState();
  }

  /**
   * Get current workflow state from the UI
   */
  async getWorkflowState(): Promise<WorkflowState> {
    // Extract state from visible elements
    const statusElement = this.page.locator('[data-testid="workflow-status"], .workflow-status');
    const statusText = await statusElement.textContent() || 'idle';

    const tokensElement = this.page.locator('[data-testid="tokens-used"], .tokens-count');
    const tokensText = await tokensElement.textContent().catch(() => '0');

    const costElement = this.page.locator('[data-testid="cost-usd"], .cost-display');
    const costText = await costElement.textContent().catch(() => '$0.00');

    return {
      id: await this.extractWorkflowId() || '',
      name: await this.page.locator('[data-testid="workflow-name"], .workflow-title').textContent() || '',
      status: this.parseStatus(statusText),
      steps: await this.getWorkflowSteps(),
      tokensUsed: parseInt(tokensText.replace(/\D/g, '')) || 0,
      costUsd: parseFloat(costText.replace(/[^0-9.]/g, '')) || 0,
    };
  }

  /**
   * Get all workflow steps and their statuses
   */
  async getWorkflowSteps(): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];

    const stepElements = this.page.locator('[data-testid="workflow-step"], .workflow-node');
    const count = await stepElements.count();

    for (let i = 0; i < count; i++) {
      const step = stepElements.nth(i);
      steps.push({
        id: await step.getAttribute('data-step-id') || `step-${i}`,
        name: await step.locator('.step-name, .node-label').textContent() || `Step ${i + 1}`,
        status: this.parseStepStatus(await step.getAttribute('data-status') || 'pending'),
        agentId: await step.getAttribute('data-agent-id') || undefined,
      });
    }

    return steps;
  }

  /**
   * Wait for a specific step to complete
   */
  async waitForStepCompletion(stepId: string, timeout: number = 30000): Promise<void> {
    await this.page.waitForSelector(
      `[data-step-id="${stepId}"][data-status="completed"], [data-step-id="${stepId}"][data-status="failed"]`,
      { timeout }
    );
  }

  /**
   * Wait for SSE connection to establish
   */
  async waitForSSEConnection(timeout: number = 10000): Promise<boolean> {
    // Look for SSE connection indicator
    const sseIndicator = this.page.locator('[data-testid="sse-connected"], .sse-status.connected, [data-connected="true"]');

    try {
      await expect(sseIndicator).toBeVisible({ timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify workflow completed successfully
   */
  async expectWorkflowCompleted(): Promise<void> {
    const state = await this.getWorkflowState();
    expect(state.status).toBe('completed');

    // All steps should be completed
    for (const step of state.steps) {
      expect(step.status).toBe('completed');
    }
  }

  /**
   * Extract workflow ID from current page
   */
  private async extractWorkflowId(): Promise<string | null> {
    // Try URL first
    const url = this.page.url();
    const urlMatch = url.match(/workflows?\/([a-zA-Z0-9-]+)/);
    if (urlMatch) return urlMatch[1];

    // Try data attribute
    const workflowElement = this.page.locator('[data-workflow-id]');
    const dataId = await workflowElement.getAttribute('data-workflow-id').catch(() => null);
    if (dataId) return dataId;

    return null;
  }

  /**
   * Parse status text to enum
   */
  private parseStatus(text: string): WorkflowState['status'] {
    const lower = text.toLowerCase();
    if (lower.includes('completed')) return 'completed';
    if (lower.includes('running') || lower.includes('executing')) return 'running';
    if (lower.includes('planning')) return 'planning';
    if (lower.includes('failed') || lower.includes('error')) return 'failed';
    return 'idle';
  }

  /**
   * Parse step status
   */
  private parseStepStatus(status: string): WorkflowStep['status'] {
    const lower = status.toLowerCase();
    if (lower === 'completed' || lower === 'success') return 'completed';
    if (lower === 'running' || lower === 'in_progress') return 'running';
    if (lower === 'failed' || lower === 'error') return 'failed';
    return 'pending';
  }

  /**
   * Cleanup: cancel any workflows created during test
   */
  async cleanup(): Promise<void> {
    // In a real implementation, this would cancel running workflows
    // For now, just clear the tracking array
    this.createdWorkflowIds = [];
  }
}
