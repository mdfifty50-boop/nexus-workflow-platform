# Real Workflow Execution Architecture

## Overview

This document describes the architecture for Nexus's CORE function: executing real-world actions from natural language commands.

**The fundamental promise of Nexus:**
> User says: "Order healthy meal to my home"
> Nexus: Creates workflow, integrates with food delivery API, places order automatically

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                                      │
│                     (Chat, Voice, Quick Actions)                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NEXUS WORKFLOW ENGINE                                   │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Intent Parser  │  │ Workflow Generator│  │ Context Manager │          │
│  │                  │  │                  │  │                  │          │
│  │ • NL Processing  │  │ • Templates      │  │ • Saved Addresses│          │
│  │ • Entity Extract │  │ • AI Generation  │  │ • Preferences    │          │
│  │ • Pattern Match  │  │ • Step Planning  │  │ • Payment Refs   │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                 Service Integration Manager                   │          │
│  │                                                               │          │
│  │  • Food Delivery (Talabat, Carriage, Deliveroo)              │          │
│  │  • Communication (WhatsApp, Email, SMS)                       │          │
│  │  • Document Processing (PDF, OCR)                             │          │
│  │  • Travel (Booking.com, Skyscanner)                          │          │
│  │  • Payment (Stripe)                                           │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                      │
│                                                                              │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│    │ Talabat │  │WhatsApp │  │ Stripe  │  │Booking  │  │ Claude  │        │
│    │   API   │  │  API    │  │   API   │  │   API   │  │   API   │        │
│    └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Intent Parser (`intent-parser.ts`)

Converts natural language to structured intent.

**Input:** "Order healthy meal to my home"

**Output:**
```typescript
{
  id: "intent_abc123",
  category: "food_delivery",
  action: "order",
  entities: [
    { type: "product", value: "healthy meal", confidence: 0.85 },
    { type: "location", value: "home", normalized: "123 Main St", confidence: 0.95 }
  ],
  urgency: "immediate",
  constraints: [],
  preferences: [
    { category: "dietary", key: "restrictions", value: [], source: "saved_profile" }
  ],
  canExecute: true
}
```

**Key Features:**
- Pattern-based matching for common intents (fast, deterministic)
- AI-powered parsing for complex/ambiguous inputs
- Entity extraction (location, time, price, preferences)
- Context enrichment from user profile
- Missing information detection

### 2. Workflow Generator (`workflow-generator.ts`)

Transforms intent into executable workflow.

**Input:** ParsedIntent

**Output:**
```typescript
{
  id: "wf_xyz789",
  name: "Order - Food Delivery",
  steps: [
    { id: "analyze", type: "ai_reasoning", name: "Analyze Request" },
    { id: "search", type: "api_call", name: "Search Restaurants" },
    { id: "filter", type: "ai_reasoning", name: "Filter Options" },
    { id: "confirm", type: "user_confirmation", name: "Confirm Order" },
    { id: "place", type: "api_call", name: "Place Order" },
    { id: "notify", type: "notification", name: "Order Confirmation" }
  ],
  requiredIntegrations: [
    { service: "talabat", connected: true },
    { service: "carriage", connected: false }
  ],
  status: "ready"
}
```

**Step Types:**
| Type | Description | Example |
|------|-------------|---------|
| `ai_reasoning` | AI analysis/decision | Analyze food preferences |
| `api_call` | External API call | Search restaurants |
| `user_confirmation` | User approval | Confirm order details |
| `data_transform` | Process/transform data | Format order payload |
| `condition` | Branching logic | If budget > $50 |
| `parallel` | Concurrent execution | Fetch from multiple sources |
| `notification` | User notification | Order placed! |

### 3. Service Integrations (`service-integrations.ts`)

Manages external service connections.

**Supported Categories:**

| Category | Services | Status |
|----------|----------|--------|
| Food Delivery | Talabat, Carriage, Deliveroo | Ready |
| Communication | WhatsApp, Email (SendGrid), SMS (Twilio) | Ready |
| Document Processing | PDF Parser, OCR | Ready |
| Travel | Booking.com, Skyscanner | Planned |
| Payment | Stripe | Ready |

**Service Actions:**
```typescript
// Each service defines actions with input/output schemas
const talabat = {
  actions: [
    {
      id: "search_restaurants",
      inputSchema: { latitude: number, longitude: number, cuisine?: string },
      outputSchema: { restaurants: Restaurant[] }
    },
    {
      id: "place_order",
      inputSchema: { restaurantId: string, items: Item[], address: Address },
      outputSchema: { orderId: string, estimatedDelivery: string }
    }
  ]
}
```

### 4. Context Manager (`context-manager.ts`)

Persists user preferences and context.

**Stored Data:**
```typescript
{
  userId: "user_123",
  addresses: [
    {
      id: "addr_1",
      label: "home",
      fullAddress: "123 Main St, City",
      components: { street: "123 Main St", city: "City" },
      isDefault: true
    }
  ],
  paymentMethods: [
    {
      id: "pm_1",
      type: "card",
      label: "Visa ending 4242",
      lastFour: "4242",
      isDefault: true
    }
  ],
  preferences: {
    dietary: {
      restrictions: ["vegetarian"],
      allergies: ["nuts"]
    },
    budget: {
      dailyLimit: 50,
      preferredPriceRange: "moderate"
    }
  }
}
```

**Key Features:**
- Address resolution ("home" -> full address)
- Preference application (dietary, budget)
- AI-powered context extraction from conversations
- Secure storage (encrypted sensitive data)

## Execution Flow

### Example: "Order healthy meal to my home"

```
1. PARSE INTENT
   ├─ Pattern match: food_delivery.order
   ├─ Extract entities: product="healthy meal", location="home"
   ├─ Resolve location: "home" -> "123 Main St" (from context)
   └─ Result: canExecute=true

2. GENERATE WORKFLOW
   ├─ Find template: food_delivery.order
   ├─ Customize steps for "healthy meal"
   ├─ Check integrations: Talabat connected ✓
   └─ Result: 6-step workflow ready

3. EXECUTE WORKFLOW
   │
   ├─ Step 1: Analyze Request (AI)
   │   └─ Output: { cuisine: "healthy", dietary: "vegetarian" }
   │
   ├─ Step 2: Search Restaurants (API)
   │   └─ Output: { restaurants: [...15 options] }
   │
   ├─ Step 3: Filter Options (AI)
   │   └─ Output: { recommendations: [...top 3] }
   │
   ├─ Step 4: User Confirmation (WAIT)
   │   └─ User selects: "Salad Station"
   │
   ├─ Step 5: Place Order (API)
   │   └─ Output: { orderId: "TLB-123", eta: "30 mins" }
   │
   └─ Step 6: Notify User
       └─ "Order placed! Arriving in 30 mins"

4. TRACK & COMPLETE
   └─ Order tracked via webhook/polling
```

## Use Case: Document Analysis

### "Analyze this PDF travel package"

```
1. PARSE INTENT
   ├─ Category: document_analysis
   ├─ Action: analyze
   └─ Entities: { documentType: "pdf", context: "travel package" }

2. GENERATE WORKFLOW
   ├─ receive_document: Accept uploaded file
   ├─ extract_text: PDF -> text extraction
   ├─ analyze_content: AI analysis for travel
   └─ generate_summary: Human-readable report

3. EXECUTE
   │
   ├─ Extract: Dates, prices, locations, inclusions
   │
   ├─ Analyze:
   │   ├─ Value for money assessment
   │   ├─ Hidden fees detection
   │   ├─ Comparison to market rates
   │   └─ Cancellation policy review
   │
   └─ Output:
       {
         summary: "7-day Dubai package at $1,200/person",
         keyPoints: [
           "Includes flights and 4-star hotel",
           "Desert safari and city tour included",
           "Note: Airport transfers NOT included ($80)"
         ],
         recommendation: "Good value, but compare with Booking.com",
         warnings: ["No refund if cancelled < 14 days"]
       }
```

## Minimal User Intervention

The system is designed to minimize questions through:

1. **Context Persistence**
   - Saved addresses (home, work)
   - Default payment methods
   - Dietary preferences

2. **Smart Defaults**
   - Use default address if not specified
   - Apply saved preferences automatically
   - Infer urgency from context

3. **Progressive Clarification**
   - Only ask what's truly missing
   - Offer suggestions based on history
   - Auto-complete when confident

**Example Flow:**

```
User: "Order lunch"

Nexus: (Has context: home address, vegetarian, budget preference)

Internal: "lunch" -> food_delivery, time=today/noon
         Location: Use default (home)
         Preferences: vegetarian, $15-20 budget

Output: "I found 3 healthy vegetarian options near you under $20.
        Would you like me to order from Salad Station (your usual)?"

        [Yes, order usual] [Show options] [Somewhere new]
```

Only 1 question needed instead of 5+ (what, where, budget, dietary, confirm).

## Security Considerations

1. **Payment Data**
   - Never stored locally
   - Reference IDs only, actual data in payment provider
   - PCI-compliant through Stripe

2. **API Keys**
   - Stored server-side only
   - Never exposed to frontend
   - Rotated regularly

3. **User Data**
   - Encrypted at rest
   - Access controlled by RLS
   - GDPR-compliant export/delete

## Future Enhancements

1. **Voice Integration**
   - Real-time speech-to-intent
   - Voice confirmations

2. **Proactive Suggestions**
   - "It's lunchtime, order your usual?"
   - "Your flight is in 2 hours, need a taxi?"

3. **Multi-step Workflows**
   - "Plan my weekend trip to Dubai"
   - (Books flight, hotel, car, activities)

4. **Learning System**
   - Remember order patterns
   - Improve recommendations
   - Adapt to changing preferences

## File Structure

```
nexus/src/
├── lib/
│   └── workflow-engine/
│       ├── index.ts                 # Main engine + exports
│       ├── intent-parser.ts         # NL -> Intent
│       ├── workflow-generator.ts    # Intent -> Workflow
│       ├── service-integrations.ts  # External services
│       └── context-manager.ts       # User context
│
└── types/
    └── workflow-execution.ts        # Type definitions
```

## Usage Example

```typescript
import { nexusWorkflowEngine } from './lib/workflow-engine'

// Set up event handlers
nexusWorkflowEngine.onEvent((event) => {
  console.log('Workflow event:', event.type, event.data)
})

nexusWorkflowEngine.onUserAction(async (request) => {
  // Show UI for user action and return response
  return await showUserPrompt(request)
})

// Execute a command
const result = await nexusWorkflowEngine.execute(
  "Order healthy meal to my home",
  {
    userId: 'user_123',
    autoExecute: true
  }
)

console.log('Result:', result.execution?.status)
// Output: "completed"
```

## Conclusion

The Nexus Workflow Engine provides the core capability to transform natural language commands into real-world actions. Through intelligent intent parsing, templated workflow generation, and seamless service integration, users can accomplish complex tasks with minimal intervention.

**The key innovation:** Users don't need to understand workflows, APIs, or integrations. They just say what they want, and Nexus figures out the rest.
