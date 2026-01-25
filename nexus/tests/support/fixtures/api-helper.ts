/**
 * API Helper for Nexus E2E Tests
 *
 * Provides utilities for direct backend API interactions:
 * - Workflow CRUD operations
 * - Agent management
 * - Health checks
 * - Test data setup/teardown
 */

import { type APIRequestContext, expect } from '@playwright/test';

export interface WorkflowResponse {
  id: string;
  name: string;
  status: string;
  nodes: Array<{
    id: string;
    type: string;
    status: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AgentResponse {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'busy' | 'offline';
}

export class ApiHelper {
  private request: APIRequestContext;
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.baseUrl = process.env.API_URL || 'http://localhost:3001/api';
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get default headers including auth
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Use test API key if available
    const testApiKey = process.env.TEST_API_KEY;
    if (testApiKey) {
      headers['X-API-Key'] = testApiKey;
    }

    return headers;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request.get(`${this.baseUrl}/health`);
      return response.ok();
    } catch {
      return false;
    }
  }

  /**
   * Wait for API to be ready
   */
  async waitForApi(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.healthCheck()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error('API did not become ready within timeout');
  }

  // ============ Workflow Operations ============

  /**
   * Create a new workflow
   */
  async createWorkflow(data: {
    name: string;
    description?: string;
    prompt?: string;
  }): Promise<WorkflowResponse> {
    const response = await this.request.post(`${this.baseUrl}/workflows`, {
      headers: this.getHeaders(),
      data,
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowResponse> {
    const response = await this.request.get(`${this.baseUrl}/workflows/${workflowId}`, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * List all workflows
   */
  async listWorkflows(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ workflows: WorkflowResponse[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `${this.baseUrl}/workflows${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await this.request.get(url, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string): Promise<{ executionId: string }> {
    const response = await this.request.post(`${this.baseUrl}/workflows/${workflowId}/execute`, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Cancel a running workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    const response = await this.request.post(`${this.baseUrl}/workflows/${workflowId}/cancel`, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const response = await this.request.delete(`${this.baseUrl}/workflows/${workflowId}`, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
  }

  // ============ Agent Operations ============

  /**
   * List available agents
   */
  async listAgents(): Promise<AgentResponse[]> {
    const response = await this.request.get(`${this.baseUrl}/agents`, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentResponse> {
    const response = await this.request.get(`${this.baseUrl}/agents/${agentId}`, {
      headers: this.getHeaders(),
    });

    expect(response.ok()).toBeTruthy();
    return response.json();
  }

  // ============ Test Data Operations ============

  /**
   * Create test workflow with predefined structure
   */
  async createTestWorkflow(name: string = 'Test Workflow'): Promise<WorkflowResponse> {
    return this.createWorkflow({
      name,
      description: 'Automated test workflow',
      prompt: 'Simple test task for E2E validation',
    });
  }

  /**
   * Cleanup test data - delete workflows created during tests
   */
  async cleanupTestWorkflows(prefix: string = 'Test'): Promise<void> {
    const { workflows } = await this.listWorkflows();

    for (const workflow of workflows) {
      if (workflow.name.startsWith(prefix)) {
        try {
          await this.deleteWorkflow(workflow.id);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  // ============ SSE Endpoints ============

  /**
   * Get SSE endpoint URL for workflow
   */
  getSSEUrl(workflowId?: string): string {
    const sseBase = process.env.SSE_URL || `${this.baseUrl}/sse`;
    if (workflowId) {
      return `${sseBase}/workflows/${workflowId}`;
    }
    return sseBase;
  }

  // ============ Assertions ============

  /**
   * Assert workflow completed successfully
   */
  async expectWorkflowCompleted(workflowId: string, timeout: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const workflow = await this.getWorkflow(workflowId);

      if (workflow.status === 'completed') {
        return;
      }

      if (workflow.status === 'failed') {
        throw new Error(`Workflow ${workflowId} failed`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`Workflow ${workflowId} did not complete within ${timeout}ms`);
  }

  /**
   * Assert API response matches expected structure
   */
  async expectValidResponse<T>(
    response: Promise<T>,
    validator: (data: T) => boolean
  ): Promise<T> {
    const data = await response;
    expect(validator(data)).toBeTruthy();
    return data;
  }
}
