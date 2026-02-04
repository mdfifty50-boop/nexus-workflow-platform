# WhatsApp Architecture Protection Rules (MANDATORY)

**Last Updated:** 2026-02-02
**Status:** PRODUCTION - DO NOT MODIFY WITHOUT UNDERSTANDING

## CRITICAL: Read Before ANY WhatsApp Changes

The WhatsApp integration uses **THREE PARALLEL APPROACHES**. Each serves a specific purpose.
Modifying one may break others. ALWAYS check dependencies before changes.

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────────┐
                    │           WHATSAPP INTEGRATION              │
                    └─────────────────────────────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
         ▼                              ▼                              ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│  BAILEYS (WEB)  │          │  AISENSY (BIZ)  │          │ COMPOSIO (BIZ)  │
│  Personal Acct  │          │  Business Acct  │          │  Business Acct  │
│  QR + Pairing   │          │  Embedded OAuth │          │  OAuth + SDK    │
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│ WhatsAppBaileys │          │  AiSensyService │          │ WhatsAppComposio│
│    Service.ts   │          │      .ts        │          │   Service.ts    │
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│ whatsapp-web.ts │          │whatsapp-business│          │whatsapp-composio│
│   (routes)      │          │      .ts        │          │      .ts        │
└────────┬────────┘          └────────┬────────┘          └────────┬────────┘
         │                            │                            │
         └──────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────────────┐
                    │          FRONTEND COMPONENTS                │
                    │  WhatsAppConnectionPrompt (workflow cards)  │
                    │  WhatsAppWebIntegration (settings page)     │
                    │  WhatsAppBusinessIntegration (settings)     │
                    │  useWhatsAppWeb (React hook)                │
                    └─────────────────────────────────────────────┘
```

---

## Protected Files - DO NOT FULLY REWRITE

| File | Protection Level | Reason |
|------|-----------------|--------|
| `server/services/WhatsAppBaileysService.ts` | **CRITICAL** | FIX-092, FIX-093 - Core Baileys integration |
| `server/routes/whatsapp-web.ts` | **CRITICAL** | FIX-091, FIX-095, FIX-096 - Baileys routing |
| `server/routes/rube.ts` | **CRITICAL** | FIX-095, FIX-096, FIX-098 - WhatsApp execution |
| `server/services/WhatsAppComposioService.ts` | **HIGH** | FIX-080 - Composio integration |
| `server/routes/whatsapp-composio.ts` | **HIGH** | FIX-080, FIX-083, FIX-084 - Webhook handling |
| `src/components/chat/WorkflowPreviewCard.tsx` | **CRITICAL** | FIX-097 + 15 other fixes |
| `src/components/chat/WhatsAppConnectionPrompt.tsx` | **HIGH** | QR/Pairing UI for workflows |
| `src/hooks/useWhatsAppWeb.ts` | **HIGH** | SSE + session management |

---

## Fix Markers - NEVER REMOVE

```typescript
// @NEXUS-FIX-091: Use Baileys instead of whatsapp-web.js - DO NOT REMOVE
// @NEXUS-FIX-092: Baileys logger (pino-compatible) - DO NOT REMOVE
// @NEXUS-FIX-093: QR code data URL generation - DO NOT REMOVE
// @NEXUS-FIX-095: Route WhatsApp through Baileys when QR-connected - DO NOT REMOVE
// @NEXUS-FIX-096: Debug logging and parameter aliases - DO NOT REMOVE
// @NEXUS-FIX-097: Prevent placeholder overwriting valid phone numbers - DO NOT REMOVE
// @NEXUS-FIX-098: Fix Baileys sendMessage return type handling - DO NOT REMOVE
```

---

## Dependency Chain - Check Before Modifying

### If you modify `WhatsAppBaileysService.ts`:
- Check `whatsapp-web.ts` route imports
- Check `rube.ts` execution routing (FIX-095, FIX-098)
- Check `useWhatsAppWeb.ts` hook API calls
- Check `WhatsAppConnectionPrompt.tsx` SSE handling

### If you modify `whatsapp-web.ts` routes:
- Check `useWhatsAppWeb.ts` endpoint URLs
- Check `WhatsAppConnectionPrompt.tsx` fetch calls
- Check `WorkflowPreviewCard.tsx` connection detection

### If you modify `rube.ts` WhatsApp section:
- Check `WorkflowPreviewCard.tsx` execution flow
- Check `WhatsAppBaileysService.ts` return types
- Verify FIX-098 success handling intact

### If you modify `WorkflowPreviewCard.tsx`:
- Run `/validate` BEFORE and AFTER
- Check all 15+ @NEXUS-FIX markers
- Verify parameter collection (FIX-029, FIX-097)

---

## Session Flow - Do Not Break

```
1. User clicks "Run Beta Test"
       ↓
2. WorkflowPreviewCard checks WhatsApp connection
       ↓
3. If not connected → WhatsAppConnectionPrompt shows QR
       ↓
4. SSE stream from /api/whatsapp-web/qr/:id
       ↓
5. User scans QR → WhatsAppBaileysService emits 'ready'
       ↓
6. Frontend detects isConnected via polling
       ↓
7. Execution proceeds → rube.ts routes to Baileys (FIX-095)
       ↓
8. WhatsAppBaileysService.sendMessage() called
       ↓
9. FIX-098 handles return type → success: true
       ↓
10. UI shows "Complete" status
```

---

## Mobile Compatibility Notes

The WhatsApp components are designed for mobile:

### `WhatsAppConnectionPrompt.tsx`
- Auto-detects mobile via `window.innerWidth < 768`
- Shows **Pairing Code** on mobile (easier than QR)
- Shows **QR Code** on desktop
- Responsive padding/margins

### `WhatsAppWebIntegration.tsx`
- Mobile-first responsive design
- Touch-friendly buttons (44x44px min)
- Pairing code countdown timer

### `useWhatsAppWeb.ts`
- Handles both QR and pairing code flows
- Platform-agnostic API calls

**When building Mobile UI:**
- These components are ALREADY mobile-ready
- Just import and use - no modifications needed
- Test on actual mobile device for QR scanning

---

## Adding New WhatsApp Features

### Checklist:
1. [ ] Read this document fully
2. [ ] Identify which approach to use (Baileys/AiSensy/Composio)
3. [ ] Check dependency chain above
4. [ ] Add to appropriate service file
5. [ ] Add route endpoint if needed
6. [ ] Update frontend component
7. [ ] Add @NEXUS-FIX marker if critical
8. [ ] Update FIX_REGISTRY.json
9. [ ] Run `/validate`
10. [ ] Test end-to-end

### DO NOT:
- Create new WhatsApp service files (use existing)
- Duplicate routing logic
- Break SSE streaming
- Remove fix markers
- Modify return types without checking callers

---

## Deprecated Files - DO NOT USE

| File | Status | Use Instead |
|------|--------|-------------|
| `WhatsAppService.ts` | DEPRECATED | WhatsAppBaileysService.ts |
| `WhatsAppTriggerService.ts` | DEPRECATED | WhatsAppBusinessTriggerService.ts |
| `whatsapp.ts` (routes) | DEPRECATED | whatsapp-web.ts or whatsapp-business.ts |
| `WhatsAppIntegration.tsx` | DEPRECATED | WhatsAppBusinessIntegration.tsx |

---

## Quick Reference: API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/whatsapp-web/session` | POST | Create Baileys session |
| `/api/whatsapp-web/session/:id` | GET | Get session status |
| `/api/whatsapp-web/qr/:id` | GET | SSE stream for QR code |
| `/api/whatsapp-web/send` | POST | Send message via Baileys |
| `/api/whatsapp-web/sessions` | GET | List all sessions |
| `/api/whatsapp-business/connect` | POST | Start AiSensy OAuth |
| `/api/whatsapp-business/send` | POST | Send template message |
| `/api/whatsapp-composio/webhook` | POST | Receive incoming messages |

---

## Emergency: If WhatsApp Breaks

1. Check server logs for errors
2. Look for FIX marker removal (`git diff`)
3. Verify Baileys package installed: `npm list @whiskeysockets/baileys`
4. Check session directory exists: `.whatsapp-sessions-baileys/`
5. Run `/validate` to check fix markers
6. Restore from FIX_REGISTRY.json if needed
