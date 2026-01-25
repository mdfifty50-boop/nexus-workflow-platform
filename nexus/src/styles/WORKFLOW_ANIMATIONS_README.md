# Workflow Animation System

Complete CSS animation suite for workflow execution states. Provides smooth, polished animations for status indicators across the Nexus platform.

## Overview

The workflow animation system includes:

- **4 Primary Status Animations**: Pending, Running, Complete, Error
- **2 Additional States**: Success, Paused
- **20+ CSS Classes**: Ready to use in components
- **Utility Functions**: TypeScript helpers for easy integration
- **Example Components**: Pre-built status badge and indicator components
- **Accessibility**: Respects `prefers-reduced-motion` preference

## Files

- `workflow-animations.css` - Core CSS animations (300+ lines)
- `workflow-animation-utils.ts` - TypeScript utility functions
- `WorkflowStatusBadge.tsx` - Example React component

## Quick Start

### 1. Using CSS Classes Directly

```html
<!-- Pending state - subtle pulse -->
<div class="workflow-status-pending">Pending task</div>

<!-- Running state - spinner + glow -->
<div class="workflow-status-running workflow-running-glow">
  <span class="workflow-running-spinner"></span>
  Running...
</div>

<!-- Complete state - checkmark -->
<div class="workflow-status-complete">
  <span class="workflow-checkmark"></span>
  Complete!
</div>

<!-- Error state - shake + red flash -->
<div class="workflow-status-error workflow-error-bg">
  <span class="workflow-error-dot"></span>
  Error occurred
</div>
```

### 2. Using React Component

```tsx
import { WorkflowStatusBadge } from '@/components/WorkflowStatusBadge';

// Basic usage
<WorkflowStatusBadge status="running" />

// With label and icon
<WorkflowStatusBadge status="complete" showLabel showIcon />

// Disabled animations
<WorkflowStatusBadge status="error" animated={false} />

// Custom styling
<WorkflowStatusBadge
  status="pending"
  className="text-sm px-3 py-2"
/>
```

### 3. Using Utility Functions

```tsx
import {
  getAnimationClassString,
  getStatusLabel,
  isActiveStatus,
} from '@/lib/workflow-animation-utils';

const status = 'running';

// Get all animation classes
const classes = getAnimationClassString(status, 'p-4 rounded-lg');
// → "workflow-status-running workflow-running-spinner workflow-running-glow p-4 rounded-lg"

// Get human-readable label
const label = getStatusLabel(status);
// → "Running"

// Check if actively animating
if (isActiveStatus(status)) {
  // Show loading indicator
}
```

## Animation States

### Pending
- **Animation**: Subtle pulse (2s cycle)
- **Color**: Golden/amber
- **Icon**: Dot indicator
- **Use Case**: Task waiting to start

```css
.workflow-status-pending
.workflow-pending-dot
```

### Running
- **Animation**: Rotating spinner + progress glow (0.8s/1.5s)
- **Color**: Primary blue
- **Icon**: Spinner
- **Use Case**: Task actively executing

```css
.workflow-status-running
.workflow-running-spinner
.workflow-running-glow
.workflow-progress-bar
```

### Complete
- **Animation**: Checkmark fade-in + scale (0.6s)
- **Color**: Green
- **Icon**: Checkmark
- **Use Case**: Task finished successfully

```css
.workflow-status-complete
.workflow-checkmark
.workflow-complete-bg
```

### Success
- **Animation**: Pulse + celebration ring (0.8s)
- **Color**: Green
- **Icon**: Checkmark
- **Use Case**: Successful completion with emphasis

```css
.workflow-status-success
.workflow-success-ring
```

### Error
- **Animation**: Shake (0.5s) + red flash
- **Color**: Red
- **Icon**: X mark
- **Use Case**: Task failed

```css
.workflow-status-error
.workflow-error-dot
.workflow-error-bg
```

### Paused
- **Animation**: Breathing (3s cycle)
- **Color**: Muted gray
- **Icon**: Pause bars
- **Use Case**: Task paused/suspended

```css
.workflow-status-paused
.workflow-paused-bars
```

## CSS Classes Reference

### Main Status Classes
- `.workflow-status-pending` - Pending animation
- `.workflow-status-running` - Running animation
- `.workflow-status-complete` - Complete animation
- `.workflow-status-success` - Success celebration animation
- `.workflow-status-error` - Error shake animation
- `.workflow-status-paused` - Paused breathing animation
- `.workflow-status-disabled` - Disabled/inactive state

### Indicator Classes
- `.workflow-pending-dot` - Pending indicator with pulse
- `.workflow-running-spinner` - Rotating spinner
- `.workflow-checkmark` - Animated checkmark
- `.workflow-error-dot` - Error indicator with flash
- `.workflow-success-ring` - Success celebration ring
- `.workflow-paused-bars` - Pause indicator

### Container Classes
- `.workflow-status-badge` - Status badge container
- `.workflow-item-animating` - Full item animation wrapper
- `.workflow-status-transition` - Smooth status transition

### Effect Classes
- `.workflow-running-glow` - Progress glow effect
- `.workflow-progress-bar` - Animated progress bar
- `.workflow-complete-bg` - Completion background flash
- `.workflow-error-bg` - Error background flash
- `.workflow-item-animating::before` - Glimmer effect

### Timeline Classes
- `.workflow-timeline-dot` - Timeline step indicator
- `.workflow-timeline-dot.active` - Active timeline step
- `.workflow-timeline-line` - Timeline connector
- `.workflow-timeline-line.active` - Active timeline line

## Utility Functions

### `getStatusAnimationClass(status)`
Get the main animation class for a status.

```tsx
getStatusAnimationClass('running')
// → 'workflow-status-running'
```

### `getIndicatorAnimationClass(status)`
Get the indicator animation class.

```tsx
getIndicatorAnimationClass('error')
// → 'workflow-error-dot'
```

### `getAnimationClassString(status, additionalClasses)`
Get all relevant classes combined.

```tsx
getAnimationClassString('running', 'p-4')
// → 'workflow-status-running workflow-running-spinner workflow-running-glow p-4'
```

### `getStatusLabel(status)`
Get human-readable status label.

```tsx
getStatusLabel('paused')
// → 'Paused'
```

### `getStatusColor(status)`
Get status color value.

```tsx
getStatusColor('error')
// → 'hsl(var(--destructive))'
```

### `isActiveStatus(status)`
Check if status has active animations.

```tsx
isActiveStatus('running')
// → true

isActiveStatus('complete')
// → false
```

### `isCompletionStatus(status)`
Check if status is a completion state.

```tsx
isCompletionStatus('success')
// → true
```

### `isErrorStatus(status)`
Check if status is an error state.

```tsx
isErrorStatus('error')
// → true
```

## Constants

### `ANIMATION_TIMINGS`
Animation duration values in milliseconds.

```tsx
ANIMATION_TIMINGS.spinner      // 800ms
ANIMATION_TIMINGS.pulse        // 2000ms
ANIMATION_TIMINGS.progressGlow // 1500ms
ANIMATION_TIMINGS.checkmark    // 500ms
ANIMATION_TIMINGS.errorShake   // 500ms
```

### `STATUS_BADGE_CONFIG`
Configuration object for status badges.

```tsx
STATUS_BADGE_CONFIG.running.icon  // '⟳'
STATUS_BADGE_CONFIG.error.class   // 'workflow-status-badge error'
```

## Component Examples

### WorkflowStatusBadge
Full-featured status badge with icon and label.

```tsx
<WorkflowStatusBadge
  status="running"
  showLabel={true}
  showIcon={true}
  animated={true}
  className="custom-class"
/>
```

Props:
- `status` (required) - Workflow status
- `showLabel` - Show status text (default: true)
- `showIcon` - Show status icon (default: true)
- `animated` - Apply animations (default: true)
- `className` - Additional CSS classes
- `label` - Custom label text
- `onStatusChange` - Callback when status changes

### WorkflowStatusIndicator
Compact inline indicator.

```tsx
<WorkflowStatusIndicator
  status="running"
  size="md"
  animated={true}
/>
```

Props:
- `status` (required) - Workflow status
- `size` - Indicator size: 'sm' | 'md' | 'lg' (default: 'md')
- `animated` - Apply animations (default: true)
- `pulse` - Add pulsing effect (default: false)

### WorkflowStatusContainer
Wrapper for animated workflow items.

```tsx
<WorkflowStatusContainer status="running" animated={true}>
  <div>Workflow content here</div>
</WorkflowStatusContainer>
```

Props:
- `status` (required) - Workflow status
- `animated` - Apply animations (default: true)
- `className` - Additional CSS classes
- `children` (required) - Content to wrap

## Accessibility

### Respects User Preferences
All animations automatically disable when `prefers-reduced-motion` is set:

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
  animation: none !important;
}
```

### ARIA Labels
- `role="status"` - Badge announces status updates
- `aria-label` - Descriptive status label
- `aria-hidden` - Icon-only elements properly hidden

### Keyboard Support
- All components are keyboard accessible
- No animation blocks keyboard interaction
- Focus states preserved

## Customization

### Color Theme
Animations use CSS variables from design system:

```css
--primary         /* Running, complete states */
--destructive     /* Error state */
--accent          /* Secondary actions */
--muted-foreground/* Pending, paused states */
```

### Timing Adjustments
Modify animation speeds in `ANIMATION_TIMINGS`:

```tsx
// Faster animations
const ANIMATION_TIMINGS = {
  pulse: 1000,      // Was 2000ms
  spinner: 400,     // Was 800ms
  // ...
}
```

### Custom Animations
Extend with custom CSS:

```css
.workflow-status-custom {
  animation: myCustomAnimation 1s ease-in-out;
}

@keyframes myCustomAnimation {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

## Performance Considerations

### GPU Acceleration
Animations use GPU-accelerated properties:
- `transform` - Scale, rotate, translate
- `opacity` - Fade in/out
- No expensive properties like `width`, `height`, `left`, `top`

### Animation Performance
- Spinner: ~60 FPS at 0.8s cycle
- Pulse: ~30 FPS for breathing effects
- Combined: No more than 2-3 concurrent animations per element

### Recommended Limits
- Max 5-10 animating elements per view
- Use `will-change` sparingly on parent containers
- Consider reducing animation count on mobile devices

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 12+)
- Mobile browsers: Full support with `prefers-reduced-motion` respected

## Integration Checklist

- [x] CSS file created and imported in `index.css`
- [x] Utility functions exported from `workflow-animation-utils.ts`
- [x] Example components in `WorkflowStatusBadge.tsx`
- [x] TypeScript types defined
- [x] Accessibility features implemented
- [x] Respects `prefers-reduced-motion`
- [x] CSS custom properties used for colors
- [x] Performance optimized with transform/opacity

## Usage Patterns

### Pattern 1: Status Badge in Workflow List
```tsx
{workflows.map(workflow => (
  <div key={workflow.id} className="flex items-center gap-4">
    <WorkflowStatusBadge status={workflow.status} showLabel />
    <span>{workflow.name}</span>
  </div>
))}
```

### Pattern 2: Running Indicator
```tsx
<div className="flex items-center gap-2">
  <WorkflowStatusIndicator status="running" size="sm" />
  <span>Processing...</span>
</div>
```

### Pattern 3: Animated Workflow Card
```tsx
<WorkflowStatusContainer status={status} className="p-4 rounded-lg border">
  <h3>{workflow.name}</h3>
  <p>{workflow.description}</p>
  <WorkflowStatusBadge status={status} />
</WorkflowStatusContainer>
```

### Pattern 4: Timeline View
```tsx
{steps.map((step, i) => (
  <div key={step.id} className="flex items-center">
    <div className={`workflow-timeline-dot ${step.active ? 'active' : ''}`} />
    <div className={`workflow-timeline-line ${step.active ? 'active' : ''}`} />
    <span>{step.name}</span>
  </div>
))}
```

## Troubleshooting

### Animation Not Playing
- Ensure `workflow-animations.css` is imported in `index.css`
- Check browser console for CSS errors
- Verify status class is applied correctly
- Check if `prefers-reduced-motion` is enabled

### Animation Stuttering
- Check for 30+ concurrent animations
- Verify GPU acceleration is enabled
- Reduce animation complexity
- Use `will-change: transform` on parent

### Colors Not Showing
- Verify CSS variables are defined in `:root`
- Check Tailwind CSS is imported first
- Ensure color values use `hsl()` format
- Test in different color modes

## Future Enhancements

Potential additions:
- Skeleton loading animations
- Progress percentage display
- Advanced timeline view animations
- Custom animation builders
- Animation preset system
- Performance monitoring
