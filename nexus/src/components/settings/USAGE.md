# VoiceLanguageSettings Component

A clean and simple voice language configuration UI component for the Nexus application.

## Features

- **Language Selection**: Choose from 5 languages (English, Arabic, French, Spanish, German)
- **Dialect Preference**: Select from multiple Arabic dialects (Modern Standard, Kuwaiti, Egyptian, Gulf, Levantine, Moroccan)
- **Voice Gender**: Choose between Male and Female voices
- **Speed Control**: Adjust speech speed from 0.5x to 2x using a smooth slider
- **Voice Preview**: Test current settings with a built-in preview button using Web Speech API
- **localStorage Persistence**: All settings are automatically saved to localStorage
- **Responsive Design**: Works beautifully on mobile and desktop using Tailwind CSS
- **Toast Notifications**: User feedback for all actions

## Usage

```typescript
import { VoiceLanguageSettings } from '@/components/settings/VoiceLanguageSettings'

export function MySettingsPage() {
  return (
    <div>
      <h1>Voice Settings</h1>
      <VoiceLanguageSettings className="max-w-2xl" />
    </div>
  )
}
```

## Integration with Settings Page

To add to the main Settings.tsx page:

1. Import the component:
```typescript
import { VoiceLanguageSettings } from '@/components/settings/VoiceLanguageSettings'
```

2. Add a new tab to the tabs array:
```typescript
const tabs = [
  // ... existing tabs ...
  { id: 'voice', labelKey: 'settings.tabs.voice', icon: '🎤' },
]
```

3. Add the content section:
```typescript
{activeTab === 'voice' && (
  <VoiceLanguageSettings />
)}
```

## Data Structure

The component stores preferences in localStorage under the key `nexus_voicePreferences`:

```typescript
interface VoicePreferences {
  language: 'en' | 'ar' | 'fr' | 'es' | 'de'
  dialect: 'standard' | 'kuwaiti' | 'egyptian' | 'gulf' | 'levantine' | 'moroccan'
  voiceGender: 'male' | 'female'
  speed: number // 0.5 to 2.0
}
```

## Default Values

```typescript
{
  language: 'en',
  dialect: 'standard',
  voiceGender: 'female',
  speed: 1
}
```

## Dependencies

- React (useState, useEffect hooks)
- @/components/ui/button (shadcn/ui)
- @/components/ui/label (shadcn/ui)
- @/contexts/ToastContext (custom toast notifications)
- Web Speech API (for preview functionality)

## Styling

The component uses:
- Tailwind CSS for styling
- shadcn/ui component patterns
- Custom card layouts with borders and backgrounds
- Responsive grid layouts

## Accessibility

- Proper label associations with form elements
- Radio button controls for dialect selection
- Range slider with visual feedback
- Semantic HTML structure
- ARIA-friendly status messages

## Browser Support

- Modern browsers with Web Speech API support
- Graceful fallback if Web Speech API unavailable
- localStorage support required

## Notes

- The dialect selection is dynamically updated based on the selected language
- Only showing relevant dialects for each language
- Speed values displayed as percentages (0.5x = 50%)
- Preview uses native browser speech synthesis
- All preferences are auto-saved to localStorage on any change
