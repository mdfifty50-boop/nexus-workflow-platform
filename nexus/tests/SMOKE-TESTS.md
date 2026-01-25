# Smoke Test Checklist

**Project:** Nexus - AI-Powered Workflow Automation Platform
**Version:** 1.0.0
**Last Updated:** 2026-01-12
**Test Lead:** Ralph Wiggum (QA)

---

## Overview

This document contains the manual smoke test checklist for Nexus. Smoke tests verify that critical functionality works after each deployment or significant change. These tests should be executed in order and all must pass before release.

---

## Pre-Test Requirements

- [ ] Development server running (`npm run dev`)
- [ ] Browser DevTools console open (check for errors)
- [ ] Network tab open (monitor API calls)
- [ ] Test user account credentials available
- [ ] Clean browser state (cleared cache/cookies) OR incognito mode

---

## 1. Application Launch

### 1.1 Initial Load
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 1.1.1 | Navigate to `http://localhost:5173` | Landing page loads within 3 seconds | | |
| 1.1.2 | Check console for errors | No JavaScript errors in console | | |
| 1.1.3 | Verify favicon loads | Nexus favicon visible in browser tab | | |
| 1.1.4 | Check page title | Title displays "Nexus" or appropriate page title | | |

### 1.2 Asset Loading
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 1.2.1 | Verify CSS loads | Page styled correctly, no FOUC | | |
| 1.2.2 | Verify fonts load | Custom fonts render (no fallback fonts) | | |
| 1.2.3 | Verify images load | All images display without broken links | | |
| 1.2.4 | Verify icons render | All icons display correctly | | |

---

## 2. Authentication Flow

### 2.1 Login
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.1.1 | Navigate to login page | Login form displays | | |
| 2.1.2 | Enter valid credentials | Form accepts input | | |
| 2.1.3 | Submit login form | Redirects to dashboard | | |
| 2.1.4 | Verify session created | User remains logged in on refresh | | |

### 2.2 Logout
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.2.1 | Click logout button | Logout action triggers | | |
| 2.2.2 | Verify redirect | Returns to landing/login page | | |
| 2.2.3 | Verify session cleared | Cannot access protected routes | | |

### 2.3 Registration (if applicable)
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 2.3.1 | Navigate to registration | Registration form displays | | |
| 2.3.2 | Enter valid details | Form accepts input with validation | | |
| 2.3.3 | Submit registration | Account created, redirects appropriately | | |

---

## 3. Dashboard

### 3.1 Dashboard Load
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.1.1 | Navigate to `/dashboard` | Dashboard loads completely | | |
| 3.1.2 | Verify stats display | Statistics cards show data | | |
| 3.1.3 | Verify achievements load | Achievement system renders | | |
| 3.1.4 | Verify AI suggestions | AI suggestions panel displays | | |
| 3.1.5 | Check for infinite loops | No "Maximum update depth" errors | | |

### 3.2 Dashboard Interactions
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 3.2.1 | Click on stat card | Navigates to relevant section | | |
| 3.2.2 | Interact with achievements | Achievement details accessible | | |
| 3.2.3 | Click AI suggestion | Suggestion action triggers | | |

---

## 4. Workflow Management

### 4.1 Workflow List
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.1.1 | Navigate to `/workflows` | Workflow list page loads | | |
| 4.1.2 | Verify workflows display | List of workflows renders | | |
| 4.1.3 | Verify pagination (if exists) | Pagination controls work | | |
| 4.1.4 | Verify search/filter | Search functionality works | | |

### 4.2 Workflow Creation
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.2.1 | Click "Create Workflow" | Creation form/modal opens | | |
| 4.2.2 | Enter workflow details | Form accepts input | | |
| 4.2.3 | Save workflow | Workflow saved, appears in list | | |
| 4.2.4 | Cancel creation | Modal closes, no workflow created | | |

### 4.3 Workflow Editor
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.3.1 | Open existing workflow | Workflow editor loads | | |
| 4.3.2 | Add node to canvas | Node added successfully | | |
| 4.3.3 | Connect nodes | Connection created | | |
| 4.3.4 | Delete node | Node removed from canvas | | |
| 4.3.5 | Save changes | Changes persisted | | |
| 4.3.6 | Undo/Redo (if exists) | Actions reversible | | |

### 4.4 Workflow Execution
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 4.4.1 | Click "Run Workflow" | Execution starts | | |
| 4.4.2 | Verify progress indicator | Progress visible during execution | | |
| 4.4.3 | Verify completion | Success message shown | | |
| 4.4.4 | View execution results | Results accessible | | |

---

## 5. Workflow Demo (n8n-style)

### 5.1 Demo Canvas
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 5.1.1 | Navigate to `/workflow-demo` | Demo page loads | | |
| 5.1.2 | Verify canvas renders | Canvas element visible | | |
| 5.1.3 | Pan canvas | Canvas pans with drag | | |
| 5.1.4 | Zoom canvas | Canvas zooms in/out | | |

### 5.2 Node Operations
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 5.2.1 | Drag node from palette | Node added to canvas | | |
| 5.2.2 | Select node | Node selection indicator shows | | |
| 5.2.3 | Move node | Node repositions | | |
| 5.2.4 | Open node config | Configuration panel opens | | |
| 5.2.5 | Delete node | Node removed | | |

---

## 6. Templates

### 6.1 Template Gallery
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 6.1.1 | Navigate to `/templates` | Template gallery loads | | |
| 6.1.2 | Verify templates display | Template cards render | | |
| 6.1.3 | Filter templates | Filtering works | | |
| 6.1.4 | Search templates | Search returns results | | |

### 6.2 Template Usage
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 6.2.1 | Click template card | Template details show | | |
| 6.2.2 | Click "Use Template" | New workflow created from template | | |
| 6.2.3 | Preview template | Preview displays | | |

---

## 7. Integrations

### 7.1 Integration List
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 7.1.1 | Navigate to `/integrations` | Integrations page loads | | |
| 7.1.2 | Verify integrations display | Available integrations shown | | |
| 7.1.3 | Filter by category | Category filter works | | |

### 7.2 Integration Management
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 7.2.1 | Click integration | Details panel opens | | |
| 7.2.2 | Connect integration | OAuth flow initiates (if applicable) | | |
| 7.2.3 | Disconnect integration | Integration disconnected | | |
| 7.2.4 | View connection status | Status accurately displayed | | |

---

## 8. Settings

### 8.1 Settings Page
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 8.1.1 | Navigate to `/settings` | Settings page loads | | |
| 8.1.2 | Verify sections display | All setting sections visible | | |

### 8.2 Setting Changes
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 8.2.1 | Change theme (if exists) | Theme changes immediately | | |
| 8.2.2 | Update notification prefs | Preferences saved | | |
| 8.2.3 | Change password | Password updated | | |
| 8.2.4 | Update profile info | Profile info saved | | |

---

## 9. Profile

### 9.1 Profile Page
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 9.1.1 | Navigate to `/profile` | Profile page loads | | |
| 9.1.2 | Verify user info displays | User information visible | | |
| 9.1.3 | Verify achievements | Achievements section renders | | |

---

## 10. Navigation

### 10.1 Main Navigation
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 10.1.1 | Click all nav items | Each item navigates correctly | | |
| 10.1.2 | Verify active states | Active route highlighted | | |
| 10.1.3 | Mobile menu (responsive) | Menu opens/closes on mobile | | |

### 10.2 Breadcrumbs/Back Navigation
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 10.2.1 | Browser back button | Navigates to previous page | | |
| 10.2.2 | Browser forward button | Navigates to next page | | |
| 10.2.3 | Breadcrumb links (if exist) | Navigate correctly | | |

---

## 11. Error Handling

### 11.1 Network Errors
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 11.1.1 | Disconnect network | Offline message displays | | |
| 11.1.2 | Reconnect network | App recovers gracefully | | |
| 11.1.3 | API timeout | Timeout error displayed | | |

### 11.2 404/Error Pages
| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 11.2.1 | Navigate to invalid URL | 404 page displays | | |
| 11.2.2 | Verify error page | Error page has navigation back | | |

---

## 12. Performance Quick Checks

| # | Test Case | Expected Result | Pass/Fail | Notes |
|---|-----------|-----------------|-----------|-------|
| 12.1 | Initial page load | < 3 seconds on broadband | | |
| 12.2 | Route transitions | < 500ms between pages | | |
| 12.3 | No memory leaks | Memory stable during usage | | |
| 12.4 | No excessive network calls | No duplicate/unnecessary requests | | |

---

## Test Execution Log

| Date | Tester | Environment | Browser | Overall Result | Notes |
|------|--------|-------------|---------|----------------|-------|
| | | | | | |
| | | | | | |
| | | | | | |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Dev Lead | | | |
| Product Owner | | | |

---

## Notes

- All critical path tests (sections 1-4) must pass for release
- Sections 5-11 should have 90%+ pass rate
- Any failures should be documented with screenshots and console logs
- Re-test after fixes before marking as passed
