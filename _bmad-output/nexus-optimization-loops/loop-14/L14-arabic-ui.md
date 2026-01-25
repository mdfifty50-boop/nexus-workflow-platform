# L14: Arabic-Ready UI Components with RTL Support

**Date:** 2026-01-12
**Agent:** Khalid (Localization)
**Status:** COMPLETED

---

## Summary

Implemented comprehensive Arabic language support with RTL (Right-to-Left) layout capabilities for the Nexus application. Built on the i18n foundation from L4, this implementation adds production-ready Arabic UI components with proper font loading, direction handling, and language switching.

---

## Changes Made

### 1. RTLProvider Component (NEW)

**File:** `nexus/src/components/RTLProvider.tsx`

Created a React context provider that handles:
- **RTL Context** - Provides `isRTL`, `direction`, `language`, and `fontFamily` values
- **Arabic Font Loading** - Dynamically loads Noto Sans Arabic from Google Fonts
- **Document Direction** - Applies `dir` attribute and language to document root
- **Font Family Management** - Switches between Inter and Noto Sans Arabic based on language

Key exports:
- `RTLProvider` - Main wrapper component
- `useRTL()` - Hook to access RTL context values
- `RTLFlex` - Utility component for RTL-aware flex direction
- `RTLSpacer` - Utility component for RTL-aware spacing
- `getRTLClass()` - Utility function for conditional class names
- `getRTLStyle()` - Utility function for conditional inline styles

### 2. Navbar Component (UPDATED)

**File:** `nexus/src/components/Navbar.tsx`

Changes:
- Added `useTranslation` hook for i18n
- Added `useRTL` hook for RTL support
- Updated navigation links to use `labelKey` for translations
- Applied RTL-aware flex directions (`flex-row-reverse` when `isRTL`)
- All hardcoded strings replaced with `t()` translation calls

Translation keys used:
- `app.name`
- `navigation.dashboard`, `navigation.projects`, etc.
- `auth.signOut`, `auth.user`
- `common.create`

### 3. Settings Page (UPDATED)

**File:** `nexus/src/pages/Settings.tsx`

Changes:
- Added `useTranslation` and `useLanguage` hooks
- Added `useRTL` hook for RTL support
- Added new **Language** tab with:
  - Language toggle buttons (English/Arabic)
  - Flag emoji indicators
  - Current language display
  - RTL status indicator
  - Live preview card showing translated content
- All tab labels use translation keys
- RTL-aware layouts throughout

### 4. Translation Files (UPDATED)

**English:** `nexus/src/i18n/locales/en.json`
**Arabic:** `nexus/src/i18n/locales/ar.json`

Added comprehensive translations for:
- `settings.title`, `settings.subtitle`
- `settings.tabs.*` (profile, notifications, integrations, billing, security, api, language)
- `settings.profile.*` (avatar, changeAvatar, fullName, email, company, timezone)
- `settings.notifications.*` (workflow completed/failed, weekly summary, new features)
- `settings.billing.*` (current plan, payment method, billing history)
- `settings.security.*` (2FA, change password, active sessions)
- `settings.api.*` (generate new, copy, revoke)
- `settings.language.*` (title, appLanguage, rtlSupport, enabled/disabled)
- `modals.changePassword.*`
- `modals.enable2FA.*`

---

## Technical Implementation

### RTL Detection Flow

```
Language Change
    |
    v
useLanguage() hook
    |
    v
i18n.changeLanguage(code)
    |
    v
RTLProvider detects language change
    |
    v
languageConfig[language].direction
    |
    v
Apply to document.documentElement.dir
    |
    v
useRTL() provides isRTL to components
    |
    v
Components apply conditional classes
```

### Font Loading Strategy

1. Arabic font loaded dynamically only when `language === 'ar'`
2. Google Fonts link injected into document head
3. CSS variable `--font-family` updated based on language
4. Body classes toggled: `font-arabic` vs `font-sans`

### RTL CSS Approach

Uses conditional Tailwind classes:
```tsx
className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
```

For margins/padding:
```tsx
className={isRTL ? 'ml-1.5' : 'mr-1.5'}
```

---

## Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `src/components/RTLProvider.tsx` | CREATED | RTL context and utilities |
| `src/components/Navbar.tsx` | MODIFIED | i18n + RTL support |
| `src/pages/Settings.tsx` | MODIFIED | i18n + RTL + Language tab |
| `src/i18n/locales/en.json` | MODIFIED | Settings translations |
| `src/i18n/locales/ar.json` | MODIFIED | Arabic settings translations |

---

## Usage Instructions

### Wrapping Application with RTLProvider

```tsx
// In main.tsx or App.tsx
import { RTLProvider } from '@/components/RTLProvider'

function App() {
  return (
    <RTLProvider>
      <YourApp />
    </RTLProvider>
  )
}
```

### Using RTL in Components

```tsx
import { useRTL } from '@/components/RTLProvider'
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  const { isRTL } = useRTL()

  return (
    <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
      {t('my.translation.key')}
    </div>
  )
}
```

### Changing Language

```tsx
import { useLanguage } from '@/i18n/useLanguage'

function LanguageSwitcher() {
  const { language, changeLanguage, languages } = useLanguage()

  return (
    <select value={language} onChange={e => changeLanguage(e.target.value)}>
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  )
}
```

---

## Testing Checklist

- [x] RTLProvider wraps application correctly
- [x] Arabic font loads when switching to Arabic
- [x] Document direction changes to RTL for Arabic
- [x] Navbar displays correctly in both LTR and RTL
- [x] Settings page tabs use translated labels
- [x] Language tab allows switching between English/Arabic
- [x] RTL status indicator shows correct state
- [x] Translation preview updates on language change

---

## Future Enhancements

1. **EnhancedDashboard.tsx** - Large component that could benefit from more comprehensive i18n
2. **Additional Languages** - Framework supports adding more languages easily
3. **Date/Number Formatting** - Add locale-aware formatting for dates and numbers
4. **RTL Animation Direction** - Consider reversing animations in RTL mode

---

## Dependencies

- `react-i18next` - Translation framework
- `i18next` - Internationalization core
- `i18next-browser-languagedetector` - Auto-detect user language
- Google Fonts - Noto Sans Arabic (loaded dynamically)

---

**Completion Time:** L14 Arabic UI implementation complete
