/**
 * SSE Helper for Nexus E2E Tests
 *
 * Provides utilities for testing Server-Sent Events:
 * - Monitoring SSE connections
 * - Capturing SSE messages
 * - Verifying real-time updates
 */

import { type Page, expect } from '@playwright/test';

export interface SSEMessage {
  type: string;
  data: unknown;
  timestamp: Date;
}

export class SSEHelper {
  private page: Page;
  private capturedMessages: SSEMessage[] = [];
  private isCapturing: boolean = false;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Start capturing SSE messages
   * Injects a listener into the page to capture EventSource messages
   */
  async startCapturing(): Promise<void> {
    if (this.isCapturing) return;

    await this.page.evaluate(() => {
      // Store original EventSource
      const OriginalEventSource = window.EventSource;

      // Override EventSource to capture messages
      (window as any).__sseMessages = [];
      (window as any).__sseConnections = [];

      window.EventSource = class extends OriginalEventSource {
        constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
          super(url, eventSourceInitDict);

          (window as any).__sseConnections.push(this);

          this.addEventListener('message', (event) => {
            try {
              const data = JSON.parse(event.data);
              (window as any).__sseMessages.push({
                type: data.type || 'message',
                data: data,
                timestamp: new Date().toISOString(),
              });
            } catch {
              (window as any).__sseMessages.push({
                type: 'raw',
                data: event.data,
                timestamp: new Date().toISOString(),
              });
            }
          });
        }
      };
    });

    this.isCapturing = true;
  }

  /**
   * Stop capturing and return all captured messages
   */
  async stopCapturing(): Promise<SSEMessage[]> {
    if (!this.isCapturing) return this.capturedMessages;

    const messages = await this.page.evaluate(() => {
      return (window as any).__sseMessages || [];
    });

    this.capturedMessages = messages.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));

    this.isCapturing = false;
    return this.capturedMessages;
  }

  /**
   * Get captured messages by type
   */
  async getMessagesByType(type: string): Promise<SSEMessage[]> {
    const messages = await this.getCapturedMessages();
    return messages.filter((m) => m.type === type);
  }

  /**
   * Get all captured messages
   */
  async getCapturedMessages(): Promise<SSEMessage[]> {
    if (this.isCapturing) {
      const messages = await this.page.evaluate(() => {
        return (window as any).__sseMessages || [];
      });
      return messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
    return this.capturedMessages;
  }

  /**
   * Wait for a specific SSE message type
   */
  async waitForMessage(
    type: string,
    options: { timeout?: number; predicate?: (msg: SSEMessage) => boolean } = {}
  ): Promise<SSEMessage> {
    const { timeout = 30000, predicate } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const messages = await this.getCapturedMessages();
      const match = messages.find((m) => {
        if (m.type !== type) return false;
        if (predicate && !predicate(m)) return false;
        return true;
      });

      if (match) return match;

      // Poll every 100ms
      await this.page.waitForTimeout(100);
    }

    throw new Error(`Timeout waiting for SSE message of type: ${type}`);
  }

  /**
   * Verify SSE connection is active
   */
  async verifyConnection(): Promise<boolean> {
    const connectionCount = await this.page.evaluate(() => {
      const connections = (window as any).__sseConnections || [];
      return connections.filter((c: EventSource) => c.readyState === EventSource.OPEN).length;
    });

    return connectionCount > 0;
  }

  /**
   * Wait for SSE connection to be established
   */
  async waitForConnection(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.verifyConnection()) return;
      await this.page.waitForTimeout(100);
    }

    throw new Error('Timeout waiting for SSE connection');
  }

  /**
   * Verify workflow node update was received
   */
  async expectNodeUpdate(nodeId: string, status: string): Promise<void> {
    const messages = await this.getMessagesByType('node_update');
    const update = messages.find(
      (m) => (m.data as any)?.node?.node_id === nodeId && (m.data as any)?.node?.status === status
    );

    expect(update).toBeDefined();
  }

  /**
   * Verify workflow status update was received
   */
  async expectWorkflowStatus(status: string): Promise<void> {
    const messages = await this.getMessagesByType('workflow_status');
    const update = messages.find((m) => (m.data as any)?.status === status);

    expect(update).toBeDefined();
  }

  /**
   * Get message count by type
   */
  async getMessageCount(type?: string): Promise<number> {
    const messages = await this.getCapturedMessages();
    if (type) {
      return messages.filter((m) => m.type === type).length;
    }
    return messages.length;
  }

  /**
   * Clear captured messages
   */
  async clearMessages(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).__sseMessages = [];
    });
    this.capturedMessages = [];
  }

  /**
   * Cleanup: close all SSE connections
   */
  async cleanup(): Promise<void> {
    await this.page.evaluate(() => {
      const connections = (window as any).__sseConnections || [];
      connections.forEach((c: EventSource) => c.close());
      (window as any).__sseConnections = [];
      (window as any).__sseMessages = [];
    });

    this.capturedMessages = [];
    this.isCapturing = false;
  }
}
