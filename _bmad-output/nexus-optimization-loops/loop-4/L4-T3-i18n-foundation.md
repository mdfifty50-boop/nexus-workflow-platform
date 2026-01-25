# L4-T3: i18n Foundation Setup

**Completed:** 2026-01-12
**Specialist:** Khalid (Localization Specialist)
**Status:** FOUNDATION READY - Packages need to be installed

---

## Summary

Established complete internationalization (i18n) infrastructure for Nexus supporting English (primary) and Arabic/Kuwaiti dialect (secondary) with full RTL support.

---

## Dependencies Required

The following packages must be installed:

```bash
cd nexus && npm install i18next react-i18next
```

**Note:** These packages are NOT yet in package.json - they need to be added before the i18n system can be used.

---

## Files Created

### 1. Core Configuration
**File:** `nexus/src/i18n/index.ts`

- i18next initialization with react-i18next
- Language detection (localStorage > browser > default)
- Automatic RTL direction setting on language change
- Support for English (en) and Arabic (ar)
- Exports utility functions: `changeLanguage()`, `getCurrentLanguageConfig()`, `isRTL()`

### 2. Translation Files

**English:** `nexus/src/i18n/locales/en.json`
**Arabic:** `nexus/src/i18n/locales/ar.json`

Both files include translations for:
- App branding
- Navigation items (Dashboard, Projects, Templates, etc.)
- Common buttons (Submit, Cancel, Create, Delete, Save, Execute, etc.)
- Authentication strings
- Error messages
- Success messages
- Workflow-specific terminology
- Template terminology
- Integration terminology
- Dashboard terminology
- Relative time expressions
- Accessibility labels
- UI hints

### 3. Language Hook
**File:** `nexus/src/i18n/useLanguage.ts`

Custom hook providing:
- `language` - Current language code
- `isRTL` - Boolean for RTL direction check
- `changeLanguage(lng)` - Switch language function
- `toggleLanguage()` - Quick toggle between en/ar
- `languages` - Array of all supported languages
- `currentLanguageConfig` - Current language metadata

Additional utility hooks:
- `useRTLClass()` - Returns appropriate class based on direction
- `useRTLStyle()` - Returns appropriate style object based on direction

### 4. Language Switcher Component
**File:** `nexus/src/components/LanguageSwitcher.tsx`

Ready-to-use component with:
- Toggle mode (simple button)
- Dropdown mode (full language selector)
- Flag icons (US/Kuwait)
- Native language names
- Accessible (ARIA labels, keyboard navigation)

### 5. RTL Stylesheet
**File:** `nexus/src/i18n/rtl.css`

Comprehensive RTL adjustments for:
- Base text alignment
- Margin/padding flipping
- Form inputs and labels
- Modals and dialogs
- Navigation elements
- Chat interface
- Progress bars
- Breadcrumbs
- Timelines
- Floating action buttons
- CSS animations
- Utility classes for manual control
- CSS logical properties support

---

## Integration Steps

### Step 1: Install Dependencies
```bash
cd nexus && npm install i18next react-i18next
```

### Step 2: Import i18n in main.tsx

Add at the top of `nexus/src/main.tsx`:
```typescript
import './i18n'
import './i18n/rtl.css'
```

### Step 3: Use in Components

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <button>{t('common.submit')}</button>
  )
}
```

### Step 4: Add Language Switcher to Navbar

In `nexus/src/components/Navbar.tsx`:
```typescript
import { LanguageSwitcher } from './LanguageSwitcher'

// In the User Menu section:
<LanguageSwitcher variant="dropdown" />
```

---

## Translation Key Structure

```
app.name              - "Nexus"
navigation.dashboard  - "Dashboard"
common.submit         - "Submit"
auth.signIn           - "Sign In"
errors.general        - "Something went wrong..."
success.saved         - "Changes saved successfully."
workflow.title        - "Workflows"
template.use          - "Use Template"
integration.connect   - "Connect"
dashboard.welcome     - "Welcome back"
time.minutesAgo       - "{{count}} minutes ago"
accessibility.dismiss - "Dismiss"
hints.proTip          - "Pro tip"
```

---

## RTL Considerations

### Automatic Handling
- Text direction (`dir="rtl"`)
- Text alignment
- Base layout flips

### Manual Classes (when needed)
- `.rtl:flip` - Mirror icon/element
- `.rtl:reverse` - Reverse flex direction
- `.rtl:text-left` - Force LTR text in RTL context

### LTR-Only Sections (maintained in RTL)
- Code blocks
- Workflow canvas
- Numeric data
- Technical diagrams

---

## Arabic Translation Notes

The Arabic translations use Modern Standard Arabic with Kuwaiti influences:
- Formal but accessible tone
- Common Kuwaiti terms where appropriate
- Technical terms kept consistent with regional usage
- Proper grammatical gender handling
- Correct plural forms for count-based strings

---

## Next Steps (Future Loops)

1. **Install packages** - Run npm install
2. **Integrate in main.tsx** - Import i18n configuration
3. **Replace hardcoded strings** - Gradually replace strings in components
4. **Add LanguageSwitcher** - Add to Navbar
5. **Test RTL** - Verify layout works correctly in Arabic
6. **Add more translations** - Expand coverage as UI grows
7. **Consider lazy loading** - For larger translation files
8. **Add date/number formatting** - Use Intl API with locale

---

## Testing Checklist

- [ ] npm install completes without errors
- [ ] App loads with default language (English)
- [ ] Language can be switched to Arabic
- [ ] RTL direction is applied when Arabic selected
- [ ] Language preference persists in localStorage
- [ ] Translation keys resolve correctly
- [ ] Missing keys fall back to English
- [ ] LanguageSwitcher component renders
- [ ] Keyboard navigation works for language selector

---

## Files Summary

| File | Purpose |
|------|---------|
| `src/i18n/index.ts` | Core i18n configuration |
| `src/i18n/locales/en.json` | English translations |
| `src/i18n/locales/ar.json` | Arabic translations |
| `src/i18n/useLanguage.ts` | Language hook utilities |
| `src/i18n/rtl.css` | RTL support styles |
| `src/components/LanguageSwitcher.tsx` | UI component |
