# Nexus UX Enhancement Patterns (MANDATORY)

## Core Principle: Zero Technical Jargon

Users should NEVER see:
- Tool slugs (GMAIL_SEND_EMAIL)
- Parameter IDs (spreadsheet_id, channel_id)
- API errors (raw JSON, stack traces)
- Internal state (undefined, null, error codes)

## Parameter Collection Patterns

### 1. Smart Collection Prompts

Instead of asking for technical IDs, ask naturally:

| Bad (Technical) | Good (User-Friendly) |
|-----------------|---------------------|
| "Enter spreadsheet_id" | "Which Google Sheet should I use?" |
| "Provide channel_id" | "Which Slack channel?" |
| "Input file_id" | "Which file?" |
| "Specify user_id" | "Which user?" |

### 2. Collection UI Components

**For Emails:**
```tsx
// Show quick action buttons
<QuickAction onClick={handleSendToSelf}>
  Send to Myself
</QuickAction>
<Input
  placeholder="Or enter a different email..."
  type="email"
/>
```

**For Channels/Sheets:**
```tsx
// Show searchable list with recent items
<SearchableList
  items={recentChannels}
  placeholder="Search channels..."
  onSelect={handleSelect}
/>
```

### 3. Default Value Intelligence

Auto-fill when possible:
- Email → Use logged-in user's email for "send to myself"
- Slack channel → Suggest most frequently used
- Google Sheet → Show recently accessed

## Error Message Patterns

### Transform Technical Errors

```typescript
// Input: Raw API error
"Missing required parameters: to"

// Output: User-friendly
{
  title: "One more thing needed",
  message: "Where should I send this email?",
  action: "collect_email",
  quickAction: "Send to Myself"
}
```

### Error Categories

| Technical Error | User Message | Action |
|-----------------|--------------|--------|
| Missing required param | "Need a bit more info..." | Show collection UI |
| Tool not found | "Let me find another way..." | Show alternatives |
| Connection expired | "Need to reconnect..." | OAuth flow |
| Rate limited | "Taking a short break..." | Auto-retry |
| Network error | "Connection issue..." | Retry button |

## Workflow Preview Enhancements

### Visual Node States

```
PENDING    → Gray, subtle pulse
CONNECTING → Blue, animated spinner
EXECUTING  → Blue, progress indicator
SUCCESS    → Green, checkmark
ERROR      → Red, X with friendly message
NEEDS_INFO → Yellow, question mark + prompt
```

### Node Status Colors

```typescript
// Use semantic colors (FIX-028)
const statusColors = {
  pending: 'bg-slate-100 text-slate-600',
  connecting: 'bg-blue-50 text-blue-600',
  executing: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  needs_info: 'bg-amber-100 text-amber-700',
}
```

## Confidence Display

### Show Workflow Readiness

```typescript
// High confidence (0.9+)
<Badge variant="success">Ready to execute</Badge>

// Medium confidence (0.7-0.89)
<Badge variant="warning">May need adjustments</Badge>

// Low confidence (<0.7)
<Badge variant="info">Tell me more...</Badge>
```

### Progressive Refinement

When confidence is low:
1. Ask clarifying questions
2. Show what you understood
3. Offer alternative interpretations
4. Let user confirm or correct

## Proactive Suggestions

### When to Suggest More

After workflow succeeds:
```tsx
<SuggestionCard>
  "This workflow saves you 2 hours/week.
   Want me to also notify you on Slack when it runs?"
</SuggestionCard>
```

### Regional Intelligence

For Kuwait users:
- Suggest WhatsApp (primary communication)
- Use Arabic-compatible tools (Deepgram, ElevenLabs)
- Respect Sunday-Thursday work week
- Handle KWD currency

## Mobile UX Patterns

### Touch-Friendly Targets
- Buttons: minimum 44x44px
- Node cards: easy to tap, not too small
- Actions: visible without scrolling

### Responsive Workflow Display
- Mobile: Vertical node stack
- Tablet: Horizontal with scroll
- Desktop: Full visual graph

## Accessibility Patterns

### Screen Reader Support
- All interactive elements labeled
- Status changes announced
- Error messages prominent

### Color Independence
- Don't rely solely on color
- Include icons/text for status
- High contrast options

## Protected Patterns (DO NOT REMOVE)

These UX patterns are protected by fixes:

| Pattern | Fix | Description |
|---------|-----|-------------|
| Friendly colors | FIX-028 | Semantic status colors |
| Param collection | FIX-029 | Maps user input to tool params |
| Error messages | FIX-020 | Fallback suggestions |
| Quick actions | FIX-027 | "Send to Myself" button |

## Testing UX Changes

Before deploying UX changes:
1. Check mobile responsiveness
2. Verify no technical jargon exposed
3. Test error scenarios
4. Verify accessibility
5. Run `/validate` for protected patterns
