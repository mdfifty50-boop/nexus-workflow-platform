# Audio Lifecycle Management Implementation

## Overview

Implemented comprehensive audio lifecycle management for the AI Meeting Room to ensure that TTS audio stops immediately when the meeting room is closed, minimized, or when switching between workflows.

## Implementation Date
2026-01-12

## Problem Statement

Previously, TTS audio would continue playing even after:
- Closing the AI Meeting Room
- Minimizing the meeting room to "peek" mode
- Switching between different workflows
- Navigating away from the page

This created a poor user experience where audio from an inactive meeting room would continue playing in the background.

## Solution

### 1. Enhanced TTS Service (`human-tts-service.ts`)

Added workflow-specific audio tracking and lifecycle management:

#### New State Variables
```typescript
private activeWorkflowId: string | null = null
private isActive: boolean = true
```

#### New Methods

**`stopAllAudio(): void`**
- Immediately clears the speech queue
- Stops current audio playback (both HTML Audio and SpeechSynthesis)
- Resets processing flag
- Marks service as inactive

**`setActiveWorkflow(workflowId: string | null): void`**
- Sets the active workflow ID
- Automatically stops audio if switching between workflows
- Updates active state

**`shouldPlayAudio(workflowId: string): boolean`**
- Checks if audio should play for a given workflow
- Returns true only if workflow matches and service is active

**`getActiveWorkflow(): string | null`**
- Returns the current active workflow ID

**`isServiceActive(): boolean`**
- Returns whether the service is currently active

### 2. Enhanced AI Meeting Room Component (`AIMeetingRoom.tsx`)

#### New Props
```typescript
workflowId?: string // For workflow-specific audio tracking
```

#### Lifecycle Effects

**Effect 1: Workflow Context Management**
```typescript
useEffect(() => {
  // Set the active workflow when component mounts or workflowId changes
  if (isOpen) {
    humanTTSService.setActiveWorkflow(workflowId || 'default-meeting-room')
  }

  // Cleanup: Stop all audio when component unmounts or closes
  return () => {
    humanTTSService.stopAllAudio()
    humanTTSService.setActiveWorkflow(null)
  }
}, [isOpen, workflowId])
```

**Effect 2: Close Handler**
```typescript
useEffect(() => {
  if (!isOpen) {
    humanTTSService.stopAllAudio()
  }
}, [isOpen])
```

**Effect 3: Mobile Minimize Handler**
```typescript
useEffect(() => {
  if (isMobile && bottomSheet.snapPoint === 'peek') {
    humanTTSService.stopAllAudio()
  }
}, [isMobile, bottomSheet.snapPoint])
```

#### Updated Stop Discussion Handler
```typescript
const handleStopDiscussion = () => {
  discussionRef.current = false
  setIsDiscussing(false)
  setActiveAgent(null)
  setCurrentSpeech('')
  // Stop all audio immediately (clears queue and stops playback)
  humanTTSService.stopAllAudio()
}
```

## Features Implemented

### 1. Stop Audio on Close
- Audio stops immediately when the user closes the meeting room
- All queued speech is cleared
- Both streaming audio and browser TTS are cancelled

### 2. Stop Audio on Minimize (Mobile)
- When the bottom sheet is dragged down to "peek" mode (minimized), audio stops
- Prevents background audio from a minimized sheet

### 3. Workflow-Specific Audio
- Each meeting room instance is tracked by workflow ID
- When switching workflows, audio from the previous workflow stops automatically
- Only the active workflow's audio will play

### 4. Component Unmount Cleanup
- Cleanup function ensures audio stops when component unmounts
- Prevents memory leaks and orphaned audio playback

## Usage

### For Component Users

When opening the AI Meeting Room, optionally pass a workflow ID:

```typescript
<AIMeetingRoom
  isOpen={isOpen}
  onClose={handleClose}
  workflowId={currentWorkflow.id} // Optional: for workflow-specific audio
  workflowTitle="My Workflow"
  workflowContext="Context about the workflow..."
  mode="optimization"
/>
```

### For Service Users

The TTS service now supports workflow-specific audio:

```typescript
// Set active workflow before playing audio
humanTTSService.setActiveWorkflow('workflow-123')

// Check if audio should play
if (humanTTSService.shouldPlayAudio('workflow-123')) {
  humanTTSService.queueSpeech('Hello!', 'pm')
}

// Stop all audio immediately
humanTTSService.stopAllAudio()

// Clear workflow context
humanTTSService.setActiveWorkflow(null)
```

## Testing Scenarios

1. **Close Button**: Click the X button → Audio stops immediately
2. **Minimize on Mobile**: Drag bottom sheet to peek → Audio stops
3. **Component Unmount**: Navigate away from page → Audio stops and cleans up
4. **Workflow Switch**: Open meeting room for different workflow → Previous audio stops
5. **Stop Discussion**: Click "Stop Discussion" button → Audio stops and queue clears

## Files Modified

1. `nexus/src/lib/human-tts-service.ts`
   - Added workflow tracking state
   - Implemented `stopAllAudio()` method
   - Implemented `setActiveWorkflow()` method
   - Implemented `shouldPlayAudio()` method
   - Implemented `getActiveWorkflow()` method
   - Implemented `isServiceActive()` method

2. `nexus/src/components/AIMeetingRoom.tsx`
   - Added `workflowId` prop to interface
   - Added 3 lifecycle useEffect hooks
   - Updated `handleStopDiscussion` to use `stopAllAudio()`

## Benefits

1. **Better UX**: Audio doesn't continue playing after user closes or minimizes
2. **Workflow Isolation**: Each workflow has its own audio context
3. **Resource Management**: Proper cleanup prevents memory leaks
4. **Mobile Friendly**: Respects minimize gesture on mobile devices
5. **Predictable Behavior**: Audio state matches UI state

## Future Enhancements

Potential improvements for the future:

1. **Fade Out**: Add a brief fade-out effect when stopping audio
2. **Resume Support**: Save audio position and resume when returning to workflow
3. **Multiple Workflows**: Support multiple meeting rooms with independent audio
4. **Audio Priority**: Implement priority levels for different audio sources
5. **Persistence**: Remember mute state per workflow across sessions

## Technical Notes

- The service uses a singleton pattern (`humanTTSService`)
- Cleanup is handled through React's useEffect cleanup function
- Both HTML5 Audio and Web Speech API are properly cancelled
- The queue is cleared synchronously to prevent race conditions
- Mobile bottom sheet state is tracked via the `useBottomSheetSnap` hook

## Compatibility

- Works with ElevenLabs TTS
- Works with OpenAI TTS
- Works with browser SpeechSynthesis API
- Mobile-responsive with proper touch handling
- Tested on iOS and Android through browser compatibility
