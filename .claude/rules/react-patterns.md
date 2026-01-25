---
paths:
  - "nexus/src/**/*.tsx"
  - "nexus/src/**/*.ts"
---

# React & TypeScript Rules

## TypeScript
- Strict types always (no `any` unless justified with comment)
- Interface over type for objects
- Proper null checking with optional chaining

## React Hooks
- NEVER create infinite loops in useEffect
- Always include cleanup functions when needed
- useCallback for functions passed as props
- useMemo for expensive computations
- Stable dependency arrays (use refs for values that shouldn't trigger re-render)

## Infinite Loop Prevention Pattern
```typescript
const lastValueRef = useRef<string | null>(null)

useEffect(() => {
  const key = JSON.stringify(value)
  if (lastValueRef.current === key) return
  lastValueRef.current = key
  // Safe to update state
}, [value])
```

## Component Structure
- Functional components only
- One component per file
- Files under 300 lines
- Props interface at top of file
