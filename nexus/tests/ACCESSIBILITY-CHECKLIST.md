# Accessibility Checklist (WCAG 2.1 AA Compliance)

**Project:** Nexus - AI-Powered Workflow Automation Platform
**Version:** 1.0.0
**Last Updated:** 2026-01-12
**Test Lead:** Ralph Wiggum (QA)
**Standard:** WCAG 2.1 Level AA

---

## Overview

This document provides a comprehensive accessibility checklist for Nexus based on Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. All items must pass for accessibility compliance.

---

## Testing Tools

### Automated Testing
- [ ] axe DevTools (Browser Extension)
- [ ] WAVE Evaluation Tool
- [ ] Lighthouse Accessibility Audit
- [ ] Pa11y
- [ ] jest-axe (Unit Tests)
- [ ] @axe-core/playwright (E2E Tests)

### Manual Testing Tools
- [ ] Screen Reader (NVDA, VoiceOver, JAWS)
- [ ] Keyboard Only Navigation
- [ ] Color Contrast Analyzer
- [ ] Browser Zoom (up to 200%)

---

## 1. Perceivable

### 1.1 Text Alternatives (Guideline 1.1)

#### 1.1.1 Non-text Content (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.1.1-a | All images have alt text | Inspect img elements | | |
| 1.1.1-b | Decorative images have empty alt="" | Check decorative images | | |
| 1.1.1-c | Complex images have long descriptions | Review infographics/charts | | |
| 1.1.1-d | Icons have accessible labels | Check icon buttons | | |
| 1.1.1-e | Form inputs have labels | Inspect form elements | | |
| 1.1.1-f | CAPTCHA has alternatives | If applicable | | |

### 1.2 Time-based Media (Guideline 1.2)

#### 1.2.1 Audio-only and Video-only (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.2.1-a | Audio-only has text transcript | Review audio content | | |
| 1.2.1-b | Video-only has text/audio description | Review video content | | |

#### 1.2.2 Captions (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.2.2-a | Pre-recorded video has captions | Check videos | | |

#### 1.2.3 Audio Description (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.2.3-a | Pre-recorded video has audio description | Check videos | | |

#### 1.2.4 Captions (Live) (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.2.4-a | Live video has captions | Check live content | | |

#### 1.2.5 Audio Description (Pre-recorded) (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.2.5-a | Video has audio description | Check video descriptions | | |

### 1.3 Adaptable (Guideline 1.3)

#### 1.3.1 Info and Relationships (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.3.1-a | Headings use proper h1-h6 tags | Inspect heading structure | | |
| 1.3.1-b | Lists use ul/ol/dl properly | Check list markup | | |
| 1.3.1-c | Tables have headers (th) | Inspect data tables | | |
| 1.3.1-d | Form labels associated correctly | Check label/for attributes | | |
| 1.3.1-e | Fieldsets group related fields | Check form groupings | | |
| 1.3.1-f | Required fields indicated | Check required indicators | | |
| 1.3.1-g | Landmarks used appropriately | Check ARIA landmarks | | |

#### 1.3.2 Meaningful Sequence (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.3.2-a | DOM order matches visual order | Compare DOM to display | | |
| 1.3.2-b | CSS doesn't alter logical sequence | Check with CSS disabled | | |

#### 1.3.3 Sensory Characteristics (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.3.3-a | Instructions don't rely on shape alone | Review instructions | | |
| 1.3.3-b | Instructions don't rely on color alone | Check color usage | | |
| 1.3.3-c | Instructions don't rely on location alone | Review spatial refs | | |

#### 1.3.4 Orientation (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.3.4-a | Content works in portrait and landscape | Rotate device | | |
| 1.3.4-b | No orientation lock (unless essential) | Check CSS/meta | | |

#### 1.3.5 Identify Input Purpose (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.3.5-a | Input fields have autocomplete attributes | Check form inputs | | |
| 1.3.5-b | Personal data fields identified | Inspect autocomplete values | | |

### 1.4 Distinguishable (Guideline 1.4)

#### 1.4.1 Use of Color (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.1-a | Color not sole indicator | Review UI elements | | |
| 1.4.1-b | Links distinguishable without color | Check link styling | | |
| 1.4.1-c | Error states have non-color indicators | Check error messages | | |
| 1.4.1-d | Charts/graphs have patterns | Review data visualizations | | |

#### 1.4.2 Audio Control (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.2-a | Auto-playing audio > 3s can be paused | Check audio elements | | |
| 1.4.2-b | Audio control is keyboard accessible | Tab to controls | | |

#### 1.4.3 Contrast (Minimum) (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.3-a | Text contrast ratio >= 4.5:1 | Use contrast checker | | |
| 1.4.3-b | Large text contrast >= 3:1 | Check large text (18px+) | | |
| 1.4.3-c | Disabled text exempt | N/A | | |
| 1.4.3-d | Logos exempt | N/A | | |

#### 1.4.4 Resize Text (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.4-a | Text resizes up to 200% | Browser zoom to 200% | | |
| 1.4.4-b | No horizontal scrolling at 200% | Check layout at 200% | | |
| 1.4.4-c | Content remains readable | Review zoomed content | | |

#### 1.4.5 Images of Text (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.5-a | Avoid images of text | Check for text images | | |
| 1.4.5-b | Logos with text exempt | N/A | | |

#### 1.4.10 Reflow (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.10-a | No horizontal scroll at 320px width | Test at 320px | | |
| 1.4.10-b | Content reflows properly | Check responsive layout | | |
| 1.4.10-c | Data tables can scroll | Allow table scroll | | |

#### 1.4.11 Non-text Contrast (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.11-a | UI component contrast >= 3:1 | Check buttons, inputs | | |
| 1.4.11-b | Graphical object contrast >= 3:1 | Check icons, charts | | |
| 1.4.11-c | Focus indicators contrast >= 3:1 | Check focus rings | | |

#### 1.4.12 Text Spacing (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.12-a | Content works with increased spacing | Apply text spacing | | |
| 1.4.12-b | No loss of content with spacing | Test with bookmarklet | | |

#### 1.4.13 Content on Hover or Focus (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 1.4.13-a | Hover content dismissible | Press Escape | | |
| 1.4.13-b | Hover content hoverable | Move to tooltip | | |
| 1.4.13-c | Hover content persistent | Content stays visible | | |

---

## 2. Operable

### 2.1 Keyboard Accessible (Guideline 2.1)

#### 2.1.1 Keyboard (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.1.1-a | All functions keyboard accessible | Tab through page | | |
| 2.1.1-b | Can activate buttons with Enter/Space | Test button activation | | |
| 2.1.1-c | Can navigate dropdowns with arrows | Test select elements | | |
| 2.1.1-d | Custom components keyboard accessible | Test custom widgets | | |
| 2.1.1-e | Drag-and-drop has keyboard alternative | Test workflow canvas | | |

#### 2.1.2 No Keyboard Trap (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.1.2-a | Can Tab out of all components | Test Tab key | | |
| 2.1.2-b | Modals properly trap and release focus | Test modal focus | | |
| 2.1.2-c | Custom widgets allow exit | Test custom components | | |

#### 2.1.4 Character Key Shortcuts (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.1.4-a | Single-key shortcuts can be disabled | Check keyboard shortcuts | | |
| 2.1.4-b | Single-key shortcuts can be remapped | Check settings | | |

### 2.2 Enough Time (Guideline 2.2)

#### 2.2.1 Timing Adjustable (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.2.1-a | Can extend time limits | Check session timeouts | | |
| 2.2.1-b | Warning before timeout | Verify timeout warnings | | |
| 2.2.1-c | Option to disable timeout | Check settings | | |

#### 2.2.2 Pause, Stop, Hide (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.2.2-a | Moving content can be paused | Check carousels/animations | | |
| 2.2.2-b | Auto-updating content can be paused | Check live feeds | | |
| 2.2.2-c | No content flashes > 3 times/second | Check animations | | |

### 2.3 Seizures and Physical Reactions (Guideline 2.3)

#### 2.3.1 Three Flashes or Below Threshold (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.3.1-a | No content flashes > 3 times/second | Review all animations | | |
| 2.3.1-b | Flashing area is small if present | Measure flash area | | |

### 2.4 Navigable (Guideline 2.4)

#### 2.4.1 Bypass Blocks (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.1-a | Skip to main content link | Test skip link | | |
| 2.4.1-b | Skip link visible on focus | Tab to skip link | | |
| 2.4.1-c | Proper landmark regions | Check main, nav, etc. | | |

#### 2.4.2 Page Titled (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.2-a | Each page has descriptive title | Check title tags | | |
| 2.4.2-b | Title changes with content | Navigate and check | | |
| 2.4.2-c | Title format consistent | Review all titles | | |

#### 2.4.3 Focus Order (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.3-a | Focus order logical | Tab through page | | |
| 2.4.3-b | Focus follows visual order | Compare Tab to visual | | |
| 2.4.3-c | Modals focus trapped properly | Test modal focus | | |

#### 2.4.4 Link Purpose (In Context) (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.4-a | Link text describes destination | Review link text | | |
| 2.4.4-b | No "click here" or "read more" alone | Check generic links | | |
| 2.4.4-c | Icon links have accessible names | Check icon buttons | | |

#### 2.4.5 Multiple Ways (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.5-a | Multiple ways to find pages | Check nav, search | | |
| 2.4.5-b | Site map or search available | Verify features | | |

#### 2.4.6 Headings and Labels (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.6-a | Headings are descriptive | Review heading text | | |
| 2.4.6-b | Labels are descriptive | Review form labels | | |
| 2.4.6-c | Heading hierarchy logical | Check h1-h6 order | | |

#### 2.4.7 Focus Visible (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.4.7-a | Focus indicator visible | Tab and observe | | |
| 2.4.7-b | Custom focus styles meet contrast | Check focus ring | | |
| 2.4.7-c | Focus not suppressed with outline: none | Inspect CSS | | |

### 2.5 Input Modalities (Guideline 2.5)

#### 2.5.1 Pointer Gestures (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.5.1-a | Multi-point gestures have alternatives | Check pinch/swipe | | |
| 2.5.1-b | Path-based gestures have alternatives | Check drag operations | | |

#### 2.5.2 Pointer Cancellation (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.5.2-a | Can cancel pointer actions | Test click and drag away | | |
| 2.5.2-b | Actions on up-event, not down | Test mouse/touch | | |

#### 2.5.3 Label in Name (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.5.3-a | Visible label in accessible name | Compare visible/ARIA | | |
| 2.5.3-b | Accessible name starts with visible | Check name order | | |

#### 2.5.4 Motion Actuation (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 2.5.4-a | Motion controls have UI alternatives | Check shake/tilt | | |
| 2.5.4-b | Motion can be disabled | Check settings | | |

---

## 3. Understandable

### 3.1 Readable (Guideline 3.1)

#### 3.1.1 Language of Page (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.1.1-a | Page has lang attribute | Check html element | | |
| 3.1.1-b | Lang value is correct | Verify language code | | |

#### 3.1.2 Language of Parts (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.1.2-a | Content in other languages marked | Check lang on elements | | |

### 3.2 Predictable (Guideline 3.2)

#### 3.2.1 On Focus (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.2.1-a | No context change on focus | Tab through elements | | |
| 3.2.1-b | No popups on focus alone | Test focus behavior | | |

#### 3.2.2 On Input (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.2.2-a | No unexpected context change | Fill form fields | | |
| 3.2.2-b | Submit requires explicit action | Test form submission | | |

#### 3.2.3 Consistent Navigation (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.2.3-a | Navigation consistent across pages | Compare pages | | |
| 3.2.3-b | Nav order consistent | Check menu order | | |

#### 3.2.4 Consistent Identification (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.2.4-a | Same functions have same labels | Compare across pages | | |
| 3.2.4-b | Icons consistent throughout | Check icon usage | | |

### 3.3 Input Assistance (Guideline 3.3)

#### 3.3.1 Error Identification (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.3.1-a | Errors identified in text | Submit invalid forms | | |
| 3.3.1-b | Error field highlighted | Check error styling | | |
| 3.3.1-c | Error messages descriptive | Review error text | | |

#### 3.3.2 Labels or Instructions (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.3.2-a | Form fields have labels | Check all inputs | | |
| 3.3.2-b | Required fields indicated | Check required markers | | |
| 3.3.2-c | Format requirements shown | Check format hints | | |

#### 3.3.3 Error Suggestion (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.3.3-a | Errors include fix suggestions | Trigger errors | | |
| 3.3.3-b | Suggestions are specific | Review error messages | | |

#### 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 3.3.4-a | Submissions reversible | Test delete/cancel | | |
| 3.3.4-b | Data checked before submission | Test validation | | |
| 3.3.4-c | Confirmation for important actions | Test critical actions | | |

---

## 4. Robust

### 4.1 Compatible (Guideline 4.1)

#### 4.1.1 Parsing (Level A) - Obsolete in WCAG 2.2

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 4.1.1-a | Valid HTML | Run HTML validator | | |

#### 4.1.2 Name, Role, Value (Level A)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 4.1.2-a | Custom controls have accessible names | Check ARIA labels | | |
| 4.1.2-b | Custom controls have proper roles | Check ARIA roles | | |
| 4.1.2-c | State changes announced | Test with screen reader | | |
| 4.1.2-d | ARIA used correctly | Validate ARIA usage | | |

#### 4.1.3 Status Messages (Level AA)

| # | Requirement | How to Test | Status | Notes |
|---|-------------|-------------|--------|-------|
| 4.1.3-a | Status messages use aria-live | Check live regions | | |
| 4.1.3-b | Toast notifications announced | Test with screen reader | | |
| 4.1.3-c | Loading states announced | Check loading indicators | | |
| 4.1.3-d | Form submission status announced | Submit forms | | |

---

## Component-Specific Checklist

### Buttons

| # | Requirement | Status |
|---|-------------|--------|
| BTN-1 | Has accessible name (text or aria-label) | |
| BTN-2 | Activates with Enter and Space | |
| BTN-3 | Has visible focus indicator | |
| BTN-4 | Disabled state communicated | |
| BTN-5 | Loading state communicated | |

### Forms

| # | Requirement | Status |
|---|-------------|--------|
| FORM-1 | All inputs have associated labels | |
| FORM-2 | Required fields marked with aria-required | |
| FORM-3 | Error messages linked with aria-describedby | |
| FORM-4 | Error summary at form top | |
| FORM-5 | Field validation on blur or submit | |
| FORM-6 | Autocomplete attributes present | |

### Modals/Dialogs

| # | Requirement | Status |
|---|-------------|--------|
| MOD-1 | Has role="dialog" or <dialog> | |
| MOD-2 | Has aria-labelledby for title | |
| MOD-3 | Focus trapped within modal | |
| MOD-4 | Focus returns to trigger on close | |
| MOD-5 | Closes with Escape key | |
| MOD-6 | Background content inert | |

### Navigation

| # | Requirement | Status |
|---|-------------|--------|
| NAV-1 | Uses <nav> element | |
| NAV-2 | Has aria-label if multiple navs | |
| NAV-3 | Current page indicated with aria-current | |
| NAV-4 | Dropdown menus keyboard accessible | |
| NAV-5 | Mobile menu accessible | |

### Tables

| # | Requirement | Status |
|---|-------------|--------|
| TBL-1 | Has <caption> or aria-label | |
| TBL-2 | Header cells use <th> | |
| TBL-3 | Headers have scope attribute | |
| TBL-4 | Complex tables use id/headers | |
| TBL-5 | Sortable columns announce state | |

### Workflow Canvas (Custom)

| # | Requirement | Status |
|---|-------------|--------|
| WF-1 | Nodes have accessible names | |
| WF-2 | Keyboard navigation available | |
| WF-3 | Node selection announced | |
| WF-4 | Connection creation keyboard accessible | |
| WF-5 | Zoom controls accessible | |
| WF-6 | Pan has keyboard alternative | |

---

## Screen Reader Testing Script

### NVDA (Windows)

```
1. Open NVDA (Ctrl+Alt+N)
2. Navigate to http://localhost:5173
3. Read page title (Insert+T)
4. List all headings (Insert+F7, select Headings)
5. Navigate by headings (H key)
6. List all links (Insert+F7, select Links)
7. Navigate form fields (F key)
8. Test forms with screen reader
9. Test modal interactions
10. Test workflow canvas
```

### VoiceOver (macOS)

```
1. Enable VoiceOver (Cmd+F5)
2. Navigate to http://localhost:5173
3. Read page summary (VO+Shift+I)
4. Open Web Rotor (VO+U)
5. Navigate landmarks, headings, links
6. Test all interactive elements
7. Test with trackpad commander
```

---

## Automated Test Integration

### Jest + jest-axe

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Playwright + @axe-core/playwright

```typescript
import AxeBuilder from '@axe-core/playwright';

test('should be accessible', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Compliance Summary

| Principle | Total Items | Passed | Failed | N/A |
|-----------|-------------|--------|--------|-----|
| 1. Perceivable | | | | |
| 2. Operable | | | | |
| 3. Understandable | | | | |
| 4. Robust | | | | |
| **Total** | | | | |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Accessibility Specialist | | | |
| Dev Lead | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-12 | Ralph Wiggum | Initial document |
