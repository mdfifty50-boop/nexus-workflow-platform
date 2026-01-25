# User Context Auto-Save Feature

## Overview

The User Context Auto-Save system automatically extracts and stores user information mentioned in AI chat conversations. This enables workflows to access previously mentioned addresses, preferences, and contacts without requiring users to re-enter information.

## How It Works

### 1. Automatic Extraction

When users chat with the AI assistant, the system analyzes each message for extractable information:

```
User: "My home address is 123 Main St, San Francisco, CA 94102"
      ↓
System: Extracts address → Confidence: 0.8 → Auto-saves to storage
```

### 2. Storage Layers

**localStorage (Always)**
- Immediate persistence
- Works offline
- Survives page refreshes
- Device-specific

**Supabase (Optional)**
- Requires authentication
- Cross-device sync
- Backup and recovery
- Cloud persistence

### 3. Usage in Workflows

Workflows can access saved context to personalize automation:

```typescript
// Example: Food delivery workflow
const context = await loadUserContext()
const homeAddress = context?.addresses.find(a => a.label === 'home')

if (homeAddress) {
  // Use address for delivery
  orderFood({
    deliveryAddress: homeAddress.fullAddress,
    dietary: context.foodPreferences.map(p => p.category)
  })
}
```

## What Gets Extracted

### Addresses

**Patterns recognized:**
- "My home address is 123 Main St, San Francisco, CA 94102"
- "I live at 456 Oak Ave, New York, NY 10001"
- "Send it to my office at 789 Pine Rd, Austin, TX 78701"

**Data captured:**
- Street address
- City, State, ZIP
- Label (home/work/other)
- Primary address flag

### Food Preferences

**Patterns recognized:**
- "I'm vegan"
- "I'm allergic to peanuts"
- "I can't eat gluten"
- "I prefer Italian food"

**Categories:**
- Dietary restrictions (vegan, vegetarian, gluten-free, dairy-free)
- Allergies (nut, shellfish, etc.)
- Preferences (cuisine types, flavors)
- Religious (halal, kosher)

### Contacts

**Patterns recognized:**
- "Call my mom at 555-1234"
- "Email my boss at john@company.com"
- "Text my wife at 555-5678"

**Data captured:**
- Name
- Relationship (family/work/friend)
- Contact method (phone/email)
- Priority level

### Language & Timezone

**Patterns recognized:**
- "I prefer Spanish"
- "My timezone is America/New_York"
- "I'm in PST"

**Data captured:**
- Preferred language
- Timezone (IANA format)
- Communication preferences

## Integration in SmartAIChatbot

The extraction happens automatically when users send messages:

```typescript
// In SmartAIChatbot.tsx
const { extractFromMessage } = useUserContext({
  autoSave: true,
  minConfidence: 0.3,
})

// On each user message
await extractFromMessage(message)
// → Extracts context
// → Saves if confidence > 0.3
// → Merges with existing context
```

## Example Conversation

```
User: "Hi! I need help ordering healthy meals to my home."

AI: "I'd be happy to help! Where would you like the meals delivered?"

User: "My address is 123 Main St, San Francisco, CA 94102. I'm vegan and allergic to peanuts."

[System extracts and saves:]
✓ Address: 123 Main St, San Francisco, CA 94102 (home)
✓ Food preference: vegan
✓ Food restriction: nut allergy (severe)

AI: "Perfect! I've noted your address and dietary requirements. Setting up your meal plan now..."

[Later conversation]

User: "Can you schedule a weekly grocery delivery?"

AI: "Sure! I'll use your saved address at 123 Main St. Would you like vegan products as usual?"

[System retrieved saved context - no need to re-ask]
```

## Privacy & Control

### What Users Should Know

1. **Opt-in by participation**: Context extraction only occurs during AI chat interactions
2. **Confidence-based saving**: Only saves data when system is confident in accuracy (>30% by default)
3. **Local-first**: Works without sending data to servers (localStorage only)
4. **User control**: Users can clear their context at any time

### Data Storage

**localStorage Key**: `nexus_user_context`

**Supabase Location**: `auth.users.user_metadata.user_context`

**Clearing Data**:
```typescript
import { clearUserContext } from '@/lib/context'
clearUserContext() // Removes all stored context
```

## Configuration

Adjust extraction behavior:

```typescript
const { extractFromMessage } = useUserContext({
  autoSave: true,        // Enable/disable auto-save
  minConfidence: 0.5,    // Require higher confidence (0-1)
})
```

## Future Enhancements

Planned improvements:

- [ ] Multi-language extraction (beyond English)
- [ ] ML-based entity recognition (vs pattern matching)
- [ ] User confirmation prompts for uncertain extractions
- [ ] Context expiry (auto-delete old data)
- [ ] Export/import context JSON
- [ ] Privacy dashboard for context management

## Technical Details

**Files**:
- `src/lib/context/user-context-extractor.ts` - Extraction logic
- `src/lib/context/context-store.ts` - Storage layer
- `src/lib/context/useUserContext.ts` - React hook
- `src/types/user-context.ts` - TypeScript types

**Dependencies**:
- None (pure TypeScript/React)
- Optional: Supabase (for cloud sync)

**Performance**:
- Extraction: <10ms per message
- Storage: <5ms (localStorage)
- No impact on chat responsiveness

## Testing

Test extraction manually:

```typescript
import { extractUserContext } from '@/lib/context'

const result = extractUserContext("My home is at 123 Main St, San Francisco, CA 94102")

console.log(result.extractedContext.addresses)
// [{
//   id: "addr_...",
//   label: "home",
//   fullAddress: "123 Main St, San Francisco, CA 94102",
//   street: "123 Main St",
//   city: "San Francisco",
//   state: "CA",
//   postalCode: "94102",
//   country: "US",
//   isPrimary: true,
//   ...
// }]

console.log(result.confidence) // 0.8
```

## Support

For issues or questions:
- Check `src/lib/context/README.md` for detailed API docs
- Review extraction patterns in `user-context-extractor.ts`
- Test with various message formats
- Adjust `minConfidence` if too sensitive/insensitive

---

**Note**: This feature is designed to enhance user experience by reducing repetitive data entry. Users maintain full control over their data and can clear it at any time.
