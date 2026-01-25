/**
 * WORKFLOW STATUS BADGE - USAGE EXAMPLES
 *
 * This file demonstrates various ways to use the workflow animation system
 * in your components. Copy these patterns to your own code.
 */

import { useState } from 'react';
import { WorkflowStatusBadge, WorkflowStatusIndicator, WorkflowStatusContainer } from './WorkflowStatusBadge';
import type { WorkflowStatus } from '@/lib/workflow-animation-utils';
import { getAnimationClassString, isActiveStatus } from '@/lib/workflow-animation-utils';

/**
 * EXAMPLE 1: Simple Status Badge
 * Basic usage with default props
 */
export const SimpleStatusExample = () => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Simple Status Badges</h2>

      <div className="space-y-2">
        <WorkflowStatusBadge status="pending" />
        <WorkflowStatusBadge status="running" />
        <WorkflowStatusBadge status="complete" />
        <WorkflowStatusBadge status="error" />
        <WorkflowStatusBadge status="paused" />
      </div>
    </div>
  );
};

/**
 * EXAMPLE 2: Workflow List
 * Display multiple workflows with status indicators
 */
export const WorkflowListExample = () => {
  const workflows = [
    { id: 1, name: 'Data Processing', status: 'running' as WorkflowStatus },
    { id: 2, name: 'Report Generation', status: 'complete' as WorkflowStatus },
    { id: 3, name: 'Email Notification', status: 'pending' as WorkflowStatus },
    { id: 4, name: 'Backup Task', status: 'error' as WorkflowStatus },
    { id: 5, name: 'Scheduled Sync', status: 'paused' as WorkflowStatus },
  ];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Workflow List</h2>

      <div className="space-y-3">
        {workflows.map(workflow => (
          <div
            key={workflow.id}
            className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/50"
          >
            <div className="flex-1">
              <p className="font-medium">{workflow.name}</p>
              <p className="text-sm text-gray-400">ID: {workflow.id}</p>
            </div>
            <WorkflowStatusBadge
              status={workflow.status}
              showLabel
              showIcon
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * EXAMPLE 3: Status With Controls
 * Interactive example showing status transitions
 */
export const StatusTransitionExample = () => {
  const [status, setStatus] = useState<WorkflowStatus>('pending');

  const statuses: WorkflowStatus[] = ['pending', 'running', 'complete', 'error', 'paused'];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Status Transition Demo</h2>

      <div className="flex items-center gap-2">
        <WorkflowStatusBadge status={status} showLabel showIcon />
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded font-medium transition-all ${
              status === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isActiveStatus(status) && (
        <p className="text-sm text-gray-400">
          This status is actively animating...
        </p>
      )}
    </div>
  );
};

/**
 * EXAMPLE 4: Inline Indicators
 * Compact status indicators for dashboards
 */
export const InlineIndicatorExample = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Inline Indicators</h2>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <WorkflowStatusIndicator status="running" size="sm" />
          <span>Small running indicator</span>
        </div>

        <div className="flex items-center gap-3">
          <WorkflowStatusIndicator status="running" size="md" />
          <span>Medium running indicator</span>
        </div>

        <div className="flex items-center gap-3">
          <WorkflowStatusIndicator status="running" size="lg" />
          <span>Large running indicator</span>
        </div>

        <div className="flex items-center gap-3">
          <WorkflowStatusIndicator status="error" size="md" />
          <span>Error indicator</span>
        </div>

        <div className="flex items-center gap-3">
          <WorkflowStatusIndicator status="complete" size="md" />
          <span>Complete indicator</span>
        </div>
      </div>
    </div>
  );
};

/**
 * EXAMPLE 5: Animated Cards
 * Full workflow cards with animations
 */
export const AnimatedCardsExample = () => {
  const workflows = [
    {
      id: 1,
      name: 'Process Customer Data',
      status: 'running' as WorkflowStatus,
      progress: 65,
    },
    {
      id: 2,
      name: 'Generate Monthly Report',
      status: 'complete' as WorkflowStatus,
      progress: 100,
    },
    {
      id: 3,
      name: 'Sync External API',
      status: 'error' as WorkflowStatus,
      progress: 40,
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Animated Workflow Cards</h2>

      <div className="grid gap-4">
        {workflows.map(workflow => (
          <WorkflowStatusContainer
            key={workflow.id}
            status={workflow.status}
            className="p-4 rounded-lg border border-gray-700 bg-gray-800/50"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{workflow.name}</h3>
                <WorkflowStatusBadge
                  status={workflow.status}
                  showLabel={false}
                  showIcon
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Progress</span>
                  <span>{workflow.progress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${workflow.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </WorkflowStatusContainer>
        ))}
      </div>
    </div>
  );
};

/**
 * EXAMPLE 6: Custom CSS Classes
 * Using CSS classes directly without components
 */
export const CustomCSSExample = () => {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Custom CSS Classes</h2>

      <div className="space-y-3">
        {/* Pending state */}
        <div className="workflow-status-pending p-3 rounded-lg border border-yellow-600 bg-yellow-900/30">
          <div className="flex items-center gap-2">
            <div className="workflow-pending-dot" />
            <span>Pending - Waiting to start</span>
          </div>
        </div>

        {/* Running state */}
        <div className="workflow-status-running workflow-running-glow p-3 rounded-lg border border-blue-600 bg-blue-900/30">
          <div className="flex items-center gap-2">
            <div className="workflow-running-spinner" />
            <span>Running - In progress</span>
          </div>
          <div className="mt-2 workflow-progress-bar" />
        </div>

        {/* Complete state */}
        <div className="workflow-complete-bg p-3 rounded-lg border border-green-600 bg-green-900/30">
          <div className="flex items-center gap-2">
            <div className="workflow-checkmark" />
            <span>Complete - Successfully finished</span>
          </div>
        </div>

        {/* Error state */}
        <div className="workflow-status-error workflow-error-bg p-3 rounded-lg border border-red-600 bg-red-900/30">
          <div className="flex items-center gap-2">
            <div className="workflow-error-dot" />
            <span>Error - Something went wrong</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * EXAMPLE 7: Timeline View
 * Sequential workflow steps with animations
 */
export const TimelineViewExample = () => {
  const steps = [
    { id: 1, name: 'Upload Files', status: 'complete' as WorkflowStatus },
    { id: 2, name: 'Validate Data', status: 'complete' as WorkflowStatus },
    { id: 3, name: 'Process Records', status: 'running' as WorkflowStatus },
    { id: 4, name: 'Generate Report', status: 'pending' as WorkflowStatus },
    { id: 5, name: 'Send Notification', status: 'pending' as WorkflowStatus },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Timeline View</h2>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className={`workflow-timeline-dot ${step.status === 'running' || step.status === 'complete' ? 'active' : ''}`} />
              {index < steps.length - 1 && (
                <div
                  className={`workflow-timeline-line h-8 mt-2 ${
                    step.status === 'complete' ? 'active' : ''
                  }`}
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{step.name}</span>
                <WorkflowStatusBadge
                  status={step.status}
                  showLabel={false}
                  showIcon
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * EXAMPLE 8: Using Utility Functions
 * Programmatically work with animations
 */
export const UtilityFunctionsExample = () => {
  const status = 'running' as WorkflowStatus;

  // Get animation classes
  const animationClass = getAnimationClassString(status, 'p-4 rounded-lg');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold">Utility Functions</h2>

      <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
        <code>{`const status = 'running';

// Get animation classes
const classes = getAnimationClassString(status, 'p-4');
// → "workflow-status-running workflow-running-spinner workflow-running-glow p-4"

// Check status
if (isActiveStatus(status)) {
  // Show loading indicator
}

// Get label
const label = getStatusLabel(status);
// → "Running"
`}</code>
      </pre>

      <div
        className={animationClass}
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        }}
      >
        This element has the class: <code className="text-xs">{animationClass}</code>
      </div>
    </div>
  );
};

/**
 * EXAMPLE 9: Dark Mode Compatible
 * All animations work with dark theme
 */
export const DarkModeExample = () => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg space-y-4">
      <h2 className="text-lg font-semibold">Dark Mode Compatible</h2>

      <p className="text-sm text-gray-400">
        All workflow animations use CSS custom properties and are fully compatible with dark mode.
      </p>

      <div className="space-y-2">
        <WorkflowStatusBadge status="running" showLabel />
        <WorkflowStatusBadge status="error" showLabel />
        <WorkflowStatusBadge status="complete" showLabel />
      </div>
    </div>
  );
};

/**
 * EXAMPLE 10: Main Demo Component
 * Showcase all examples together
 */
export const WorkflowAnimationDemo = () => {
  const [activeTab, setActiveTab] = useState('simple');

  const tabs = [
    { id: 'simple', label: 'Simple Badges', component: SimpleStatusExample },
    { id: 'list', label: 'Workflow List', component: WorkflowListExample },
    { id: 'transition', label: 'Transitions', component: StatusTransitionExample },
    { id: 'inline', label: 'Inline', component: InlineIndicatorExample },
    { id: 'cards', label: 'Cards', component: AnimatedCardsExample },
    { id: 'css', label: 'CSS Classes', component: CustomCSSExample },
    { id: 'timeline', label: 'Timeline', component: TimelineViewExample },
    { id: 'utils', label: 'Utilities', component: UtilityFunctionsExample },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SimpleStatusExample;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Workflow Animation Examples</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default WorkflowAnimationDemo;
