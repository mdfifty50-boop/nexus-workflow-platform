/**
 * GenericParamCollector.ts
 *
 * LAYER 4: Parameter Collection
 *
 * State machine for collecting ALL required parameters before execution.
 * Tracks progress, validates answers, and handles auto-resolution of IDs.
 *
 * States:
 *   PENDING -> COLLECTING -> COMPLETE
 *
 * @NEXUS-GENERIC-ORCHESTRATION
 */

import type {
  CollectionState,
  CollectionQuestion,
  CollectionProgress,
  ToolSchema,
  AutoResolveConfig
} from './types';

import { GenericUXTranslator, getUXTranslator } from './GenericUXTranslator';

export class GenericParamCollector {
  private state: CollectionState = 'PENDING';
  private collected = new Map<string, string>();
  private questions: CollectionQuestion[] = [];
  private schema: ToolSchema | null = null;
  private uxTranslator: GenericUXTranslator;

  constructor(uxTranslator?: GenericUXTranslator) {
    this.uxTranslator = uxTranslator || getUXTranslator();
  }

  /**
   * Initialize collector from a tool schema
   */
  initFromSchema(schema: ToolSchema): void {
    this.schema = schema;
    this.questions = this.uxTranslator.translateSchema(schema);
    this.collected.clear();
    this.state = this.questions.length > 0 ? 'COLLECTING' : 'COMPLETE';

    console.log(`[GenericParamCollector] Initialized with ${this.questions.length} questions`);
  }

  /**
   * Pre-populate known values (from workflow context, node config, etc.)
   */
  prePopulate(values: Record<string, string>): void {
    for (const [paramName, value] of Object.entries(values)) {
      if (value && value.trim() !== '') {
        this.submitAnswer(paramName, value, true);
      }
    }
  }

  /**
   * Get current collection state
   */
  getState(): CollectionState {
    return this.state;
  }

  /**
   * Get collection progress summary
   */
  getProgress(): CollectionProgress {
    const answered = this.questions.filter(q => q.answered).length;

    return {
      state: this.state,
      totalQuestions: this.questions.length,
      answeredQuestions: answered,
      currentQuestion: this.getNextQuestion()
    };
  }

  /**
   * Get all questions (for displaying collection UI)
   */
  getAllQuestions(): CollectionQuestion[] {
    return [...this.questions];
  }

  /**
   * Get next unanswered question
   */
  getNextQuestion(): CollectionQuestion | null {
    return this.questions.find(q => !q.answered) || null;
  }

  /**
   * Get all unanswered questions
   */
  getUnansweredQuestions(): CollectionQuestion[] {
    return this.questions.filter(q => !q.answered);
  }

  /**
   * Submit an answer for a parameter
   */
  submitAnswer(
    paramName: string,
    value: string,
    skipValidation = false
  ): { success: boolean; error?: string } {
    const question = this.questions.find(q => q.paramName === paramName);

    if (!question) {
      return { success: false, error: `Unknown parameter: ${paramName}` };
    }

    // Validate if not skipping
    if (!skipValidation) {
      const validation = this.uxTranslator.validateValue(paramName, value);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }
    }

    // Store value
    this.collected.set(paramName, value);
    question.answered = true;
    question.value = value;

    // Update state
    this.updateState();

    console.log(`[GenericParamCollector] Collected ${paramName}: ${value.substring(0, 20)}...`);
    return { success: true };
  }

  /**
   * Clear an answer (allow re-entry)
   */
  clearAnswer(paramName: string): void {
    const question = this.questions.find(q => q.paramName === paramName);
    if (question) {
      question.answered = false;
      question.value = undefined;
      this.collected.delete(paramName);
      this.updateState();
    }
  }

  /**
   * Check if collection is complete
   */
  isComplete(): boolean {
    return this.state === 'COMPLETE';
  }

  /**
   * Check if a specific param is answered
   */
  hasAnswer(paramName: string): boolean {
    return this.collected.has(paramName);
  }

  /**
   * Get value for a parameter
   */
  getValue(paramName: string): string | undefined {
    return this.collected.get(paramName);
  }

  /**
   * Get all collected parameters
   */
  getParams(): Record<string, string> {
    return Object.fromEntries(this.collected);
  }

  /**
   * Get params ready for execution (including defaults)
   */
  getExecutionParams(): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    // Add collected values
    for (const [key, value] of this.collected) {
      params[key] = value;
    }

    // Add defaults from schema
    if (this.schema) {
      for (const [paramName, paramSchema] of Object.entries(this.schema.properties)) {
        if (!(paramName in params) && paramSchema.default !== undefined) {
          params[paramName] = paramSchema.default;
        }
      }
    }

    return params;
  }

  /**
   * Get questions that need auto-resolution
   */
  getQuestionsNeedingResolution(): CollectionQuestion[] {
    return this.questions.filter(q => q.autoResolve && !q.answered);
  }

  /**
   * Attempt auto-resolution for a parameter
   * Returns lookup configuration if resolution is needed
   */
  getAutoResolveConfig(paramName: string): AutoResolveConfig | null {
    const question = this.questions.find(q => q.paramName === paramName);
    return question?.autoResolve || null;
  }

  /**
   * Reset collector to initial state
   */
  reset(): void {
    this.state = 'PENDING';
    this.collected.clear();
    this.questions = [];
    this.schema = null;
  }

  /**
   * Serialize state for persistence
   */
  serialize(): string {
    return JSON.stringify({
      state: this.state,
      collected: Object.fromEntries(this.collected),
      schema: this.schema,
      questions: this.questions
    });
  }

  /**
   * Restore from serialized state
   */
  restore(serialized: string): void {
    try {
      const data = JSON.parse(serialized);
      this.state = data.state;
      this.collected = new Map(Object.entries(data.collected || {}));
      this.schema = data.schema;
      this.questions = data.questions || [];
    } catch (e) {
      console.error('[GenericParamCollector] Failed to restore state:', e);
    }
  }

  /**
   * Update collection state based on answered questions
   */
  private updateState(): void {
    if (this.questions.length === 0) {
      this.state = 'PENDING';
      return;
    }

    const allAnswered = this.questions.every(q => q.answered);
    this.state = allAnswered ? 'COMPLETE' : 'COLLECTING';
  }
}

/**
 * Factory function to create a collector for a specific tool
 */
export function createCollector(schema: ToolSchema): GenericParamCollector {
  const collector = new GenericParamCollector();
  collector.initFromSchema(schema);
  return collector;
}

/**
 * React hook helper - returns state update trigger
 */
export function useParamCollector(schema: ToolSchema | null): {
  collector: GenericParamCollector;
  progress: CollectionProgress;
  submitAnswer: (paramName: string, value: string) => { success: boolean; error?: string };
  isReady: boolean;
} {
  const collector = new GenericParamCollector();

  if (schema) {
    collector.initFromSchema(schema);
  }

  return {
    collector,
    progress: collector.getProgress(),
    submitAnswer: (paramName, value) => collector.submitAnswer(paramName, value),
    isReady: collector.isComplete()
  };
}
