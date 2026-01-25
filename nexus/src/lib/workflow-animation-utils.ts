/**
 * Workflow Animation Utilities
 *
 * Helper functions and types for applying workflow status animations
 * to components. Provides type-safe animation class names and utilities.
 */

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'complete'
  | 'success'
  | 'error'
  | 'paused'
  | 'disabled';

interface AnimationClassMap {
  [key: string]: string;
}

/**
 * Main status animation classes
 */
const STATUS_ANIMATIONS: AnimationClassMap = {
  pending: 'workflow-status-pending',
  running: 'workflow-status-running',
  complete: 'workflow-status-complete',
  success: 'workflow-status-success',
  error: 'workflow-status-error',
  paused: 'workflow-status-paused',
  disabled: 'workflow-status-disabled',
};

/**
 * Indicator/icon animation classes
 */
const INDICATOR_ANIMATIONS: AnimationClassMap = {
  pending: 'workflow-pending-dot',
  running: 'workflow-running-spinner',
  complete: 'workflow-checkmark',
  success: 'workflow-success-ring',
  error: 'workflow-error-dot',
  paused: 'workflow-paused-bars',
};

/**
 * Background/container animation classes
 */
const BACKGROUND_ANIMATIONS: AnimationClassMap = {
  running: 'workflow-running-glow',
  complete: 'workflow-complete-bg',
  error: 'workflow-error-bg',
};

/**
 * Get the main animation class for a workflow status
 *
 * @param status - The workflow status
 * @returns CSS class name for the animation
 *
 * @example
 * const animClass = getStatusAnimationClass('running');
 * // Returns: 'workflow-status-running'
 */
export function getStatusAnimationClass(status: WorkflowStatus): string {
  return STATUS_ANIMATIONS[status] || '';
}

/**
 * Get the indicator animation class for a workflow status
 *
 * @param status - The workflow status
 * @returns CSS class name for the indicator animation
 *
 * @example
 * const indicatorClass = getIndicatorAnimationClass('running');
 * // Returns: 'workflow-running-spinner'
 */
export function getIndicatorAnimationClass(status: WorkflowStatus): string {
  return INDICATOR_ANIMATIONS[status] || '';
}

/**
 * Get the background animation class for a workflow status
 *
 * @param status - The workflow status
 * @returns CSS class name for the background animation, or empty string if none
 *
 * @example
 * const bgClass = getBackgroundAnimationClass('running');
 * // Returns: 'workflow-running-glow'
 */
export function getBackgroundAnimationClass(status: WorkflowStatus): string {
  return BACKGROUND_ANIMATIONS[status] || '';
}

/**
 * Get all relevant animation classes for a status
 * Useful for combining multiple animations
 *
 * @param status - The workflow status
 * @returns Array of CSS class names
 *
 * @example
 * const classes = getAllAnimationClasses('error');
 * // Returns: ['workflow-status-error', 'workflow-error-dot', 'workflow-error-bg']
 */
export function getAllAnimationClasses(status: WorkflowStatus): string[] {
  const classes: string[] = [getStatusAnimationClass(status)];

  const indicatorClass = getIndicatorAnimationClass(status);
  if (indicatorClass) classes.push(indicatorClass);

  const bgClass = getBackgroundAnimationClass(status);
  if (bgClass) classes.push(bgClass);

  return classes;
}

/**
 * Create a className string from animation classes
 * Filters out empty strings and joins with spaces
 *
 * @param status - The workflow status
 * @param additionalClasses - Any additional classes to append
 * @returns Space-separated class string
 *
 * @example
 * const className = getAnimationClassString('running', 'p-4 rounded-lg');
 * // Returns: 'workflow-status-running workflow-running-spinner workflow-running-glow p-4 rounded-lg'
 */
export function getAnimationClassString(
  status: WorkflowStatus,
  additionalClasses?: string
): string {
  const allClasses = getAllAnimationClasses(status);

  if (additionalClasses) {
    allClasses.push(additionalClasses);
  }

  return allClasses.filter(Boolean).join(' ');
}

/**
 * Get human-readable status label
 *
 * @param status - The workflow status
 * @returns Display label for the status
 *
 * @example
 * const label = getStatusLabel('running');
 * // Returns: 'Running'
 */
export function getStatusLabel(status: WorkflowStatus): string {
  const labels: { [key: string]: string } = {
    pending: 'Pending',
    running: 'Running',
    complete: 'Complete',
    success: 'Success',
    error: 'Error',
    paused: 'Paused',
    disabled: 'Disabled',
  };

  return labels[status] || 'Unknown';
}

/**
 * Get status color (for fallback styling or accent colors)
 *
 * @param status - The workflow status
 * @returns CSS color variable or hex value
 *
 * @example
 * const color = getStatusColor('error');
 * // Returns: 'hsl(var(--destructive))'
 */
export function getStatusColor(status: WorkflowStatus): string {
  const colors: { [key: string]: string } = {
    pending: 'hsl(47 96% 53%)',
    running: 'hsl(var(--primary))',
    complete: 'hsl(142 76% 36%)',
    success: 'hsl(142 76% 36%)',
    error: 'hsl(var(--destructive))',
    paused: 'hsl(var(--muted-foreground))',
    disabled: 'hsl(var(--muted-foreground))',
  };

  return colors[status] || 'currentColor';
}

/**
 * Check if a status is in an active/animating state
 *
 * @param status - The workflow status
 * @returns Whether the status has active animations
 *
 * @example
 * if (isActiveStatus('running')) {
 *   // Show loading indicator
 * }
 */
export function isActiveStatus(status: WorkflowStatus): boolean {
  return ['running', 'pending'].includes(status);
}

/**
 * Check if a status indicates completion/success
 *
 * @param status - The workflow status
 * @returns Whether the status is a completion state
 *
 * @example
 * if (isCompletionStatus('success')) {
 *   // Show completion message
 * }
 */
export function isCompletionStatus(status: WorkflowStatus): boolean {
  return ['complete', 'success'].includes(status);
}

/**
 * Check if a status indicates an error
 *
 * @param status - The workflow status
 * @returns Whether the status is an error state
 *
 * @example
 * if (isErrorStatus('error')) {
 *   // Show error message
 * }
 */
export function isErrorStatus(status: WorkflowStatus): boolean {
  return status === 'error';
}

/**
 * Animation timing constants (in milliseconds)
 */
export const ANIMATION_TIMINGS = {
  /** Pulse and breathing animations */
  pulse: 2000,
  /** Spinner rotation */
  spinner: 800,
  /** Progress glow */
  progressGlow: 1500,
  /** Completion checkmark */
  checkmark: 500,
  /** Error shake */
  errorShake: 500,
  /** Success pulse */
  successPulse: 800,
  /** Timeline pulse */
  timelinePulse: 600,
} as const;

/**
 * Status badge configuration
 */
export const STATUS_BADGE_CONFIG = {
  pending: {
    class: 'workflow-status-badge pending',
    icon: '●',
    label: 'Pending',
  },
  running: {
    class: 'workflow-status-badge running',
    icon: '⟳',
    label: 'Running',
  },
  complete: {
    class: 'workflow-status-badge complete',
    icon: '✓',
    label: 'Complete',
  },
  success: {
    class: 'workflow-status-badge complete',
    icon: '✓',
    label: 'Success',
  },
  error: {
    class: 'workflow-status-badge error',
    icon: '✕',
    label: 'Error',
  },
  paused: {
    class: 'workflow-status-badge paused',
    icon: '⏸',
    label: 'Paused',
  },
  disabled: {
    class: 'workflow-status-badge',
    icon: '−',
    label: 'Disabled',
  },
} as const;
