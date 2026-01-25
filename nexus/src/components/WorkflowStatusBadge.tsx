/**
 * Workflow Status Badge Component
 *
 * Displays animated workflow status with color-coded indicators and badges.
 * Automatically applies appropriate animations based on workflow status.
 *
 * @example
 * <WorkflowStatusBadge status="running" />
 * <WorkflowStatusBadge status="error" showLabel />
 * <WorkflowStatusBadge status="complete" animated={false} />
 */

import React from 'react';
import type { WorkflowStatus } from '@/lib/workflow-animation-utils';
import {
  getAnimationClassString,
  getIndicatorAnimationClass,
  getStatusLabel,
  STATUS_BADGE_CONFIG,
  isActiveStatus,
  isErrorStatus,
} from '@/lib/workflow-animation-utils';

interface WorkflowStatusBadgeProps {
  /** The workflow status to display */
  status: WorkflowStatus;
  /** Whether to show the status label text */
  showLabel?: boolean;
  /** Whether to apply animations (default: true) */
  animated?: boolean;
  /** Additional CSS classes to apply */
  className?: string;
  /** Custom label text (overrides default) */
  label?: string;
  /** Whether to show the status icon */
  showIcon?: boolean;
  /** Callback when status changes */
  onStatusChange?: (status: WorkflowStatus) => void;
}

export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  showLabel = true,
  animated = true,
  className = '',
  label,
  showIcon = true,
}) => {
  const config = STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG.disabled;
  const indicatorClass = getIndicatorAnimationClass(status);
  const displayLabel = label || getStatusLabel(status);

  const badgeClasses = animated
    ? `${config.class} ${className}`.trim()
    : className || config.class;

  const isActive = animated && isActiveStatus(status);
  const hasError = isErrorStatus(status);

  return (
    <div
      className={`inline-flex items-center gap-2 ${badgeClasses}`}
      role="status"
      aria-label={`Workflow status: ${displayLabel}`}
      data-status={status}
    >
      {showIcon && (
        <span
          className={`inline-flex items-center justify-center ${
            indicatorClass ? indicatorClass : ''
          } ${hasError ? 'workflow-error-dot' : ''} ${
            isActive ? 'animate-spin' : ''
          }`}
          aria-hidden="true"
        >
          {status === 'running' && (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.2" />
              <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" strokeDasharray="15.7 47.1" />
            </svg>
          )}
          {(status === 'complete' || status === 'success') && (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
          {status === 'pending' && (
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="2" />
            </svg>
          )}
          {status === 'paused' && (
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          )}
        </span>
      )}

      {showLabel && <span className="text-sm font-medium">{displayLabel}</span>}
    </div>
  );
};

/**
 * Workflow Status Indicator - Minimal version
 *
 * Compact indicator for inline status display
 */
interface WorkflowStatusIndicatorProps {
  status: WorkflowStatus;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  pulse?: boolean;
}

export const WorkflowStatusIndicator: React.FC<
  WorkflowStatusIndicatorProps
> = ({ status, size = 'md', animated = true, pulse = false }) => {
  const indicatorClass = getIndicatorAnimationClass(status);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={`inline-block rounded-full ${sizeClasses[size]} ${
        animated ? indicatorClass : ''
      } ${pulse ? 'workflow-pending-dot' : ''}`}
      data-status={status}
      role="presentation"
    />
  );
};

/**
 * Workflow Status Container - Animated wrapper
 *
 * Use this to wrap workflow cards/items for consistent animation
 */
interface WorkflowStatusContainerProps {
  status: WorkflowStatus;
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}

export const WorkflowStatusContainer: React.FC<
  WorkflowStatusContainerProps
> = ({ status, children, animated = true, className = '' }) => {
  const animationClass = animated
    ? getAnimationClassString(status, className)
    : className;

  return (
    <div
      className={`workflow-item-animating ${animationClass}`}
      data-status={status}
    >
      {children}
    </div>
  );
};

export default WorkflowStatusBadge;
