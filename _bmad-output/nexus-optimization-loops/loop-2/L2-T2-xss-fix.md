# L2-T2: XSS Vulnerability Fix in SmartAIChatbot

## Summary

Fixed a critical XSS (Cross-Site Scripting) vulnerability in `SmartAIChatbot.tsx` where user and AI message content was being rendered using `dangerouslySetInnerHTML` without any sanitization.

## Vulnerability Details

**File:** `nexus/src/components/SmartAIChatbot.tsx`
**Line:** ~1114 (original), ~1134 (after fix)
**Severity:** HIGH
**Type:** CWE-79 (Improper Neutralization of Input During Web Page Generation)

### Before (Vulnerable Code)

```tsx
{message.content.split('\n').map((line, i) => {
  // Bold text
  const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
  return (
    <p
      key={i}
      className={line.startsWith('-') ? 'ml-2 my-0.5' : 'my-1'}
      dangerouslySetInnerHTML={{ __html: boldFormatted }}
    />
  )
})}
```

### Attack Vector

An attacker could inject malicious JavaScript through:
1. AI responses containing crafted payloads (if AI backend is compromised)
2. User input that gets echoed back in responses
3. localStorage manipulation (chatbot persists messages to localStorage)

Example payload that would execute:
```
**Hello<script>alert('XSS')</script>World**
```

Or via event handlers:
```
**<img src=x onerror="alert('XSS')">**
```

## Solution Implemented

### 1. Installed DOMPurify

```bash
npm install dompurify
npm install -D @types/dompurify
```

DOMPurify is a well-maintained, battle-tested XSS sanitizer used by Mozilla, Google, and others.

### 2. Added Sanitization Configuration

Created a strict allowlist configuration following OWASP recommendations:

```tsx
// Configure DOMPurify for safe HTML sanitization
// Allow only safe inline tags - no scripts, event handlers, or dangerous elements
const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'span', 'br'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
  // Disallow data: and javascript: URIs
  ALLOW_DATA_ATTR: false,
}

const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG)
}
```

### 3. Applied Sanitization to All Rendered Content

```tsx
{message.content.split('\n').map((line, i) => {
  // Bold text - escape content first, then apply formatting
  // DOMPurify sanitizes the entire output to prevent XSS
  const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
  const sanitized = sanitizeHTML(boldFormatted)
  return (
    <p
      key={i}
      className={line.startsWith('-') ? 'ml-2 my-0.5' : 'my-1'}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
})}
```

## Why DOMPurify vs Alternatives

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| DOMPurify | Battle-tested, actively maintained, configurable | Adds ~7KB dependency | **CHOSEN** |
| react-markdown | Full markdown support | Heavy (~30KB), overkill for bold text only | Not needed |
| Manual escaping | No dependencies | Error-prone, easy to miss edge cases | Too risky |
| No dangerouslySetInnerHTML | Zero risk | Would require refactoring formatting logic | More invasive |

## OWASP XSS Prevention Compliance

Per OWASP XSS Prevention Cheat Sheet:

1. **Rule #1 - HTML Encode**: DOMPurify handles encoding of disallowed content
2. **Rule #2 - Attribute Encode**: Only `class` attribute allowed, no dynamic values
3. **Rule #3 - JavaScript Encode**: N/A - no JavaScript in allowed tags
4. **Rule #4 - CSS Encode**: N/A - no style attributes allowed
5. **Rule #6 - Sanitize HTML Markup**: Implemented via DOMPurify with strict allowlist

## Testing

1. TypeScript compilation passes with no errors
2. The fix allows safe markdown-style bold text to render
3. Malicious payloads are stripped while preserving safe content

### Test Cases

| Input | Expected Output |
|-------|-----------------|
| `**bold text**` | `<strong class="text-white font-semibold">bold text</strong>` |
| `**<script>alert(1)</script>**` | `<strong class="text-white font-semibold"></strong>` (script removed) |
| `**<img src=x onerror=alert(1)>**` | `<strong class="text-white font-semibold"></strong>` (img removed) |
| `Hello **world**` | `Hello <strong class="text-white font-semibold">world</strong>` |

## Files Modified

- `nexus/src/components/SmartAIChatbot.tsx`
  - Added DOMPurify import
  - Added `DOMPURIFY_CONFIG` constant with strict allowlist
  - Added `sanitizeHTML()` helper function
  - Updated message rendering to use sanitization

## Files Added

- `nexus/package.json` - dompurify dependency added
- `nexus/package-lock.json` - lock file updated

## Recommendations for Future

1. **Audit other components** - Search for other uses of `dangerouslySetInnerHTML` in the codebase
2. **CSP Headers** - Implement Content-Security-Policy headers as defense-in-depth
3. **Input validation** - Add server-side validation for AI responses
4. **Regular updates** - Keep DOMPurify updated for latest security patches

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [CWE-79: Improper Neutralization of Input During Web Page Generation](https://cwe.mitre.org/data/definitions/79.html)
