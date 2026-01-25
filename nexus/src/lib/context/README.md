# User Context Auto-Save System

## Overview

The User Context Auto-Save system automatically extracts and persists user information from AI chat conversations. This enables workflows to leverage previously mentioned user data like addresses, preferences, and contacts.

## Features

- **Automatic Extraction**: Parses AI chat messages for addressable information
- **Pattern Recognition**: Detects addresses, food preferences, contacts, language preferences, and timezones
- **Dual Storage**: Saves to localStorage for immediate access and Supabase for cross-device sync
- **React Hooks**: Easy integration with React components via `useUserContext` hook
- **Privacy-Aware**: Only stores data with sufficient confidence (configurable threshold)
- **Workflow Integration**: Extracted context is available for use in workflow execution

## Architecture

```
User Message → Context Extractor → Confidence Check → Storage Layer
                    ↓                      ↓              ↓
              Pattern Matching      Threshold Test   localStorage
              NLP Analysis                            Supabase (if auth)
```

## Usage

### In React Components

```typescript
import { useUserContext } from '@/lib/context'

function MyComponent() {
  const {
    context,           // Current user context
    extractFromMessage, // Extract from single message
    saveContext,       // Manually save context
    hasContext,        // Check if context exists
  } = useUserContext({
    autoExtract: true,  // Auto-extract from messages
    autoSave: true,     // Auto-save when confidence > threshold
    minConfidence: 0.3, // Minimum confidence to save (0-1)
  })

  // Access context data
  const homeAddress = context?.addresses.find(a => a.label === 'home')
  const preferredLanguage = context?.communicationPreferences?.preferredLanguage

  return (
    <div>
      {homeAddress && <p>Home: {homeAddress.fullAddress}</p>}
    </div>
  )
}
```

### Manual Extraction

```typescript
import { extractUserContext } from '@/lib/context'

const message = "My home address is 123 Main St, San Francisco, CA 94102"
const result = extractUserContext(message)

console.log(result.extractedContext.addresses) // Parsed address
console.log(result.confidence) // 0-1 confidence score
```

### Direct Storage Operations

```typescript
import { storeUserContext, loadUserContext } from '@/lib/context'

// Store context
await storeUserContext({
  userId: 'user123',
  context: {
    userId: 'user123',
    addresses: [{
      id: 'addr1',
      label: 'home',
      fullAddress: '123 Main St, San Francisco, CA 94102',
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      isPrimary: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]
  },
  merge: true,
  source: 'chat',
})

// Load context
const context = await loadUserContext('user123')
```

## Extraction Patterns

### Addresses

The system recognizes multiple address patterns:

```
"My home address is 123 Main St, San Francisco, CA 94102"
"I live at 456 Oak Ave, New York, NY 10001"
"Our office is located at 789 Pine Rd, Austin, TX 78701"
```

**Extracted data:**
- Street address
- City
- State (2-letter code)
- ZIP code
- Label (home/work/other)

### Food Preferences

Detects dietary restrictions and preferences:

```
"I'm vegan"
"I have a nut allergy"
"I can't eat gluten"
"I prefer Italian cuisine"
```

**Categories:**
- vegan, vegetarian
- gluten-free, dairy-free
- nut allergies
- halal, kosher
- Custom preferences

### Contacts

Extracts contact information from mentions:

```
"Call my mom at 555-1234"
"Email my boss at john@company.com"
"My wife's phone is 555-5678"
```

**Extracted data:**
- Name
- Relationship (family, work, friend)
- Email or phone
- Priority level

### Language & Timezone

```
"I prefer Spanish"
"My timezone is America/New_York"
"I'm in PST"
```

## Storage

### localStorage

Stored at key: `nexus_user_context`

**Structure:**
```json
{
  "userId": "guest_123_abc",
  "fullName": "",
  "email": "",
  "addresses": [...],
  "frequentContacts": [...],
  "foodPreferences": [...],
  "communicationPreferences": {...},
  "extractedAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "source": "chat",
  "version": 1
}
```

### Supabase (Optional)

If user is authenticated, context syncs to Supabase `auth.users.user_metadata.user_context`.

**Benefits:**
- Cross-device sync
- Persistent across sessions
- Backup and recovery

## Integration with Workflows

Workflows can access user context to personalize automation:

```typescript
// In workflow execution
import { loadUserContext } from '@/lib/context'

const context = await loadUserContext()

if (context?.addresses.length > 0) {
  const homeAddress = context.addresses.find(a => a.label === 'home')
  // Use homeAddress in workflow (e.g., food delivery, package tracking)
}

if (context?.foodPreferences.length > 0) {
  // Filter restaurant recommendations
  const dietary = context.foodPreferences.filter(p => p.isRestriction)
}
```

## Privacy & Security

- **Opt-in**: Users must interact with AI chat for extraction to occur
- **Confidence threshold**: Only saves data with sufficient confidence (default 0.3)
- **Local-first**: Works without backend (localStorage only)
- **No PII in logs**: Context extraction errors don't log sensitive data
- **User control**: Users can clear context at any time

## Configuration

```typescript
const { extractFromMessage } = useUserContext({
  autoExtract: true,      // Enable automatic extraction
  autoSave: true,         // Save when confidence > threshold
  minConfidence: 0.5,     // Increase for higher accuracy (0-1)
})
```

## Future Enhancements

- [ ] Multi-language support for extraction patterns
- [ ] ML-based entity extraction (beyond pattern matching)
- [ ] User confirmation prompts for low-confidence extractions
- [ ] Context expiry and refresh mechanisms
- [ ] Export/import context for data portability
- [ ] Admin dashboard for context management

## Files

- `user-context-extractor.ts` - Pattern-based extraction logic
- `context-store.ts` - Storage layer (localStorage + Supabase)
- `useUserContext.ts` - React hooks for components
- `index.ts` - Unified exports
- `README.md` - This documentation

## Testing

Test extraction with various inputs:

```typescript
import { extractUserContext } from '@/lib/context'

const testMessages = [
  "My home is at 123 Main St, San Francisco, CA 94102",
  "I'm vegan and allergic to peanuts",
  "Call my mom at 555-1234",
  "I prefer Spanish language",
  "I'm in PST timezone"
]

testMessages.forEach(msg => {
  const result = extractUserContext(msg)
  console.log(`Message: ${msg}`)
  console.log(`Confidence: ${result.confidence}`)
  console.log(`Extracted:`, result.extractedContext)
  console.log('---')
})
```

## Contributing

When adding new extraction patterns:

1. Add pattern to relevant constant (e.g., `ADDRESS_PATTERNS`, `FOOD_PREFERENCE_PATTERNS`)
2. Update extraction function to handle the pattern
3. Test with multiple variations
4. Update this README with examples
5. Ensure confidence calculation includes new patterns

## License

Part of Nexus AI Workflow Platform. See main project LICENSE.
