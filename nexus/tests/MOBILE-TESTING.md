# Mobile Testing Checklist

**Project:** Nexus - AI-Powered Workflow Automation Platform
**Version:** 1.0.0
**Last Updated:** 2026-01-12
**Test Lead:** Ralph Wiggum (QA)

---

## Overview

This document contains mobile-specific test cases for Nexus, covering touch interactions, gestures, viewport sizes, and mobile-specific functionality.

---

## Device Matrix

### Primary Test Devices

| Device | OS Version | Screen Size | Resolution | Pixel Ratio |
|--------|------------|-------------|------------|-------------|
| iPhone 14 Pro | iOS 17 | 6.1" | 393x852 | 3x |
| iPhone 14 Pro Max | iOS 17 | 6.7" | 430x932 | 3x |
| iPhone SE (3rd gen) | iOS 17 | 4.7" | 375x667 | 2x |
| iPad Pro 12.9" | iPadOS 17 | 12.9" | 1024x1366 | 2x |
| iPad Air | iPadOS 17 | 10.9" | 820x1180 | 2x |
| Pixel 7 | Android 14 | 6.3" | 412x915 | 2.625x |
| Samsung Galaxy S23 | Android 14 | 6.1" | 360x780 | 3x |
| Samsung Galaxy Tab S8 | Android 14 | 11" | 800x1280 | 2x |

### Viewport Breakpoints

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| xs | < 480px | Small phones |
| sm | 480-767px | Large phones |
| md | 768-1023px | Tablets portrait |
| lg | 1024-1279px | Tablets landscape |
| xl | 1280px+ | Large tablets |

---

## 1. Touch Interactions

### 1.1 Basic Touch Events

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| T-001 | Single tap on button | Button activates | | |
| T-002 | Single tap on link | Link navigates | | |
| T-003 | Single tap outside modal | Modal closes (if applicable) | | |
| T-004 | Touch feedback | Visual feedback on touch | | |
| T-005 | Touch target size (44x44px min) | Easy to tap accurately | | |
| T-006 | Tap on disabled element | No action occurs | | |
| T-007 | Rapid taps | Debounced correctly, no double-submit | | |

### 1.2 Touch and Hold

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| TH-001 | Long press on workflow node | Context menu opens | | |
| TH-002 | Long press on list item | Selection mode activates | | |
| TH-003 | Long press on text | Text selection enabled | | |
| TH-004 | Long press duration | ~500ms standard timing | | |
| TH-005 | Long press cancellation | Drag finger away cancels | | |

### 1.3 Focus States

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| F-001 | Focus on input field | Keyboard appears | | |
| F-002 | Focus ring visible | Focus indicator shows | | |
| F-003 | Focus trap in modal | Tab stays within modal | | |
| F-004 | Blur on tap outside | Focus removed correctly | | |

---

## 2. Gesture Testing

### 2.1 Swipe Gestures

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| SW-001 | Swipe left on list item | Action revealed (delete/archive) | | |
| SW-002 | Swipe right on list item | Action revealed (if applicable) | | |
| SW-003 | Swipe to dismiss notification | Notification dismissed | | |
| SW-004 | Swipe between tabs/pages | Navigation works | | |
| SW-005 | Pull to refresh | Refresh triggered | | |
| SW-006 | Swipe velocity | Fast vs slow swipe handled | | |
| SW-007 | Swipe interruption | Partial swipe cancellable | | |

### 2.2 Pinch Gestures

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| P-001 | Pinch to zoom on workflow canvas | Canvas zooms | | |
| P-002 | Pinch zoom limits | Respects min/max zoom | | |
| P-003 | Pinch on images | Image zooms (if enabled) | | |
| P-004 | Pinch gesture smooth | No jank during zoom | | |
| P-005 | Double-tap to zoom | Quick zoom toggle | | |
| P-006 | Zoom reset | Can return to default zoom | | |

### 2.3 Pan/Drag Gestures

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| PAN-001 | Pan workflow canvas | Canvas moves | | |
| PAN-002 | Drag node on canvas | Node repositions | | |
| PAN-003 | Drag to reorder list | Items reorder | | |
| PAN-004 | Pan boundaries | Stops at edges | | |
| PAN-005 | Pan momentum/inertia | Smooth deceleration | | |
| PAN-006 | Two-finger pan vs scroll | Correct behavior | | |

### 2.4 Multi-Touch Gestures

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| MT-001 | Two-finger scroll | Scrolls content | | |
| MT-002 | Pan while pinching | Zoom + pan simultaneously | | |
| MT-003 | Three-finger gesture | No conflicts | | |
| MT-004 | Multi-touch on canvas | Multiple nodes selectable | | |

---

## 3. Viewport & Responsive Layout

### 3.1 Portrait Orientation

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| VP-001 | Landing page portrait | Layout correct | | |
| VP-002 | Dashboard portrait | All elements visible | | |
| VP-003 | Workflow list portrait | List scrollable | | |
| VP-004 | Workflow editor portrait | Canvas usable | | |
| VP-005 | Forms in portrait | Fields accessible | | |
| VP-006 | Navigation in portrait | Nav accessible | | |
| VP-007 | Modals in portrait | Modal fits screen | | |

### 3.2 Landscape Orientation

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| VL-001 | Landing page landscape | Layout adapts | | |
| VL-002 | Dashboard landscape | Better use of space | | |
| VL-003 | Workflow editor landscape | Enhanced canvas area | | |
| VL-004 | Forms in landscape | Keyboard doesn't obscure | | |
| VL-005 | Video/media landscape | Proper display | | |

### 3.3 Orientation Changes

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| OC-001 | Rotate portrait to landscape | Layout transitions | | |
| OC-002 | Rotate landscape to portrait | Layout transitions | | |
| OC-003 | State preservation on rotate | Data not lost | | |
| OC-004 | Scroll position preserved | Stays in place | | |
| OC-005 | Modal stays open on rotate | Modal repositions | | |
| OC-006 | Form input preserved | Text not lost | | |

### 3.4 Safe Areas

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| SA-001 | Notch/dynamic island | Content not obscured | | |
| SA-002 | Bottom home indicator | UI above indicator | | |
| SA-003 | Rounded corners | Content visible | | |
| SA-004 | Status bar area | Proper spacing | | |

---

## 4. Virtual Keyboard

### 4.1 Keyboard Behavior

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| KB-001 | Keyboard appears on focus | Smooth animation | | |
| KB-002 | Content scrolls into view | Input visible above keyboard | | |
| KB-003 | Keyboard dismissal tap | Tapping outside closes | | |
| KB-004 | Keyboard dismissal scroll | Scrolling closes (if enabled) | | |
| KB-005 | Done/Return button | Appropriate action | | |
| KB-006 | Tab to next field | Focus moves correctly | | |

### 4.2 Input Types

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| IT-001 | type="email" | Email keyboard shows | | |
| IT-002 | type="tel" | Number pad shows | | |
| IT-003 | type="number" | Number keyboard shows | | |
| IT-004 | type="url" | URL keyboard shows | | |
| IT-005 | type="search" | Search keyboard shows | | |
| IT-006 | type="password" | Secure entry enabled | | |

### 4.3 Keyboard Accessories

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| KA-001 | Autocomplete suggestions | Suggestions work | | |
| KA-002 | Password autofill | Credential manager works | | |
| KA-003 | Input accessory bar | Navigation bar works | | |
| KA-004 | Emoji keyboard | Emoji input works | | |
| KA-005 | Voice input | Dictation works | | |

---

## 5. Mobile Navigation

### 5.1 Navigation Patterns

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| MN-001 | Hamburger menu | Menu opens/closes | | |
| MN-002 | Bottom navigation | All tabs accessible | | |
| MN-003 | Back button (Android) | Navigates back | | |
| MN-004 | Swipe back (iOS) | Edge swipe works | | |
| MN-005 | Tab bar selection | Clear active state | | |
| MN-006 | Breadcrumbs (if shown) | Navigable on mobile | | |

### 5.2 Drawer/Sheet Navigation

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| DR-001 | Drawer opens | Smooth animation | | |
| DR-002 | Drawer swipe to close | Gesture works | | |
| DR-003 | Bottom sheet opens | Sheet animates up | | |
| DR-004 | Bottom sheet drag | Can drag to resize | | |
| DR-005 | Backdrop tap closes | Drawer/sheet closes | | |

---

## 6. Performance on Mobile

### 6.1 Load Performance

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| LP-001 | Initial load time (4G) | < 5 seconds | | |
| LP-002 | Initial load time (3G) | < 10 seconds | | |
| LP-003 | Time to interactive | < 7 seconds on 4G | | |
| LP-004 | Largest contentful paint | < 2.5 seconds | | |
| LP-005 | Cumulative layout shift | < 0.1 | | |

### 6.2 Runtime Performance

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| RP-001 | Scroll performance | 60fps, no jank | | |
| RP-002 | Animation smoothness | 60fps animations | | |
| RP-003 | Touch responsiveness | < 100ms response | | |
| RP-004 | Canvas interaction | Smooth pan/zoom | | |
| RP-005 | Memory usage | Stable, no leaks | | |

### 6.3 Battery Impact

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| BI-001 | Background CPU usage | Minimal when idle | | |
| BI-002 | Network polling | Efficient intervals | | |
| BI-003 | No unnecessary animations | Animations stop when hidden | | |

---

## 7. Offline & Network

### 7.1 Offline Behavior

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| OFF-001 | Airplane mode | Offline message shown | | |
| OFF-002 | Cached content available | Previously loaded data shows | | |
| OFF-003 | Offline actions queued | Actions sync when online | | |
| OFF-004 | Connection restored | Reconnects automatically | | |

### 7.2 Slow Network

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| SN-001 | Slow 3G loading | Loading indicators shown | | |
| SN-002 | Request timeout handling | Timeout message displayed | | |
| SN-003 | Retry mechanism | Retry button/auto-retry | | |
| SN-004 | Progressive loading | Content appears incrementally | | |

---

## 8. Mobile-Specific Features

### 8.1 PWA Features

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| PWA-001 | Add to home screen | Install prompt works | | |
| PWA-002 | Launch from home screen | App opens fullscreen | | |
| PWA-003 | Splash screen | Splash displays on launch | | |
| PWA-004 | App-like navigation | No browser chrome | | |
| PWA-005 | Push notifications | Notifications received | | |

### 8.2 Native Features

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| NF-001 | Share sheet integration | Can share content | | |
| NF-002 | File picker | Can select files | | |
| NF-003 | Camera access (if needed) | Camera permission works | | |
| NF-004 | Haptic feedback | Vibration on actions | | |

---

## 9. Accessibility on Mobile

### 9.1 Screen Reader

| # | Test Case | Expected Result | VoiceOver | TalkBack |
|---|-----------|-----------------|-----------|----------|
| SR-001 | All content readable | Content announced | | |
| SR-002 | Touch exploration | Elements identified | | |
| SR-003 | Gestures work | Swipe navigation | | |
| SR-004 | Focus order logical | Sequential navigation | | |
| SR-005 | Actions announced | Button labels read | | |

### 9.2 Mobile Accessibility

| # | Test Case | Expected Result | iOS | Android |
|---|-----------|-----------------|-----|---------|
| MA-001 | Text scaling | UI scales with system setting | | |
| MA-002 | Bold text | Bold text applied | | |
| MA-003 | Reduce motion | Animations reduced | | |
| MA-004 | High contrast | Contrast mode respected | | |

---

## 10. Device-Specific Issues

### iOS-Specific

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| iOS-001 | Safe area insets | Content respects safe areas | |
| iOS-002 | Rubber-band scrolling | Natural feel | |
| iOS-003 | Input zoom prevention | viewport meta correct | |
| iOS-004 | Status bar interaction | Scroll to top works | |
| iOS-005 | Face ID/Touch ID | Biometric auth works | |

### Android-Specific

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| AND-001 | Back button handling | Correct navigation | |
| AND-002 | System navigation bar | Content not obscured | |
| AND-003 | Split screen mode | App works in multi-window | |
| AND-004 | Recent apps preview | Secure content hidden | |
| AND-005 | Fingerprint auth | Biometric auth works | |

---

## Test Execution Checklist

### Before Testing

- [ ] Device charged > 50%
- [ ] Clear app data/cache
- [ ] Close other apps
- [ ] Note OS version
- [ ] Note app version
- [ ] Enable screen recording (for bug reports)

### During Testing

- [ ] Test in airplane mode first (offline)
- [ ] Test on WiFi
- [ ] Test on cellular data
- [ ] Rotate device multiple times
- [ ] Test with keyboard visible
- [ ] Check battery usage

### After Testing

- [ ] Document all issues
- [ ] Attach screenshots/recordings
- [ ] Note reproduction steps
- [ ] Categorize severity
- [ ] Identify device-specific issues

---

## Issue Reporting Template

```
## Issue Title

**Device:** [iPhone 14 Pro / Pixel 7 / etc.]
**OS Version:** [iOS 17.2 / Android 14 / etc.]
**App Version:** [1.0.0]
**Network:** [WiFi / 4G / Offline]

### Description
[Brief description of the issue]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happens]

### Attachments
- [ ] Screenshot
- [ ] Screen recording
- [ ] Console logs
```

---

## Sign-Off

| Device Category | Tester | Date | Status |
|-----------------|--------|------|--------|
| iPhone | | | |
| Android Phone | | | |
| iPad | | | |
| Android Tablet | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-12 | Ralph Wiggum | Initial document |
