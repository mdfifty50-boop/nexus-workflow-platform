# Regional Compliance Demo Script

**Duration:** ~4 minutes
**Target Audience:** GCC businesses (Saudi Arabia & Kuwait focus)
**Platform:** Nexus Workflow Automation

---

## Opening (20 seconds)

> "Operating in the GCC means navigating complex regional requirements - from Saudi's ZATCA e-invoicing mandates to Kuwait's KNET payment ecosystem. Today I'll show you how Nexus handles regional compliance automatically."

**Screen:** Nexus dashboard with Arabic language option visible

---

## Demo 1: ZATCA E-Invoicing for Saudi Arabia (120 seconds)

### Setup Scene
> "Starting January 2026, businesses in Saudi Arabia with turnover above SAR 750,000 must submit invoices to ZATCA in real-time. Let's see how Nexus automates this."

### Steps to Show

1. **Create Invoice via Chat**
   - Type: "Create invoice for Al-Rashid Trading, SAR 5,000"
   - Show Nexus understanding Saudi context

2. **ZATCA-Compliant Invoice Generated**
   ```
   Invoice #2026-0001
   ──────────────────────
   Seller: Nexus Solutions
   VAT: 310123456789003

   Buyer: Al-Rashid Trading
   VAT: 300987654321098

   Item: Consulting Services
   Amount: SAR 4,347.83
   VAT (15%): SAR 652.17
   Total: SAR 5,000.00

   QR Code: [ZATCA-compliant TLV encoded]
   UUID: 550e8400-e29b-41d4-a716-446655440000
   ```

3. **Automatic ZATCA Submission**
   - Show "Submitting to ZATCA..." status
   - Show "CLEARED" response
   - Show cryptographic stamp applied

4. **Compliance Dashboard**
   - Show compliance rate: 100%
   - Show rejected invoices: 0
   - Show monthly VAT summary

### Key Talking Points
> "Every invoice is automatically formatted for ZATCA compliance, digitally signed, and submitted within seconds. No manual XML generation, no portal uploads."

### Arabic Support Demo
> "And yes, Nexus supports Arabic invoice generation too."
- Show Arabic invoice variant
- Show bilingual output option

---

## Demo 2: KNET Payments for Kuwait (90 seconds)

### Setup Scene
> "KNET is Kuwait's dominant payment method. Over 95% of local transactions go through KNET. Let's integrate a payment flow."

### Steps to Show

1. **Create Payment Link via Chat**
   - Type: "Create payment for KWD 50 from customer Ahmad"
   - Show payment link generated

2. **Customer Payment Experience**
   ```
   Payment Request
   ──────────────────────
   Amount: KWD 50.000
   Merchant: Your Business

   [Pay with KNET] [Pay with Card]
   ```

3. **Instant WhatsApp Confirmation**
   ```
   ✅ Payment Successful!

   Amount: 50.000 KWD
   Reference: KNET20260001
   Card: KNET ending in 4532

   Thank you for your payment!
   ```

4. **Automatic Bookkeeping**
   - Show transaction logged
   - Show daily reconciliation report

### Key Talking Point
> "From payment link generation to WhatsApp confirmation, the entire flow takes seconds. And customers pay with the method they trust most - KNET."

---

## Demo 3: Regional Workflow Intelligence (60 seconds)

### Nexus Understands GCC Context

1. **Work Week Awareness**
   - Show calendar defaulting to Sunday-Thursday
   - "Schedule meeting on the weekend" → Saturday is weekend

2. **Currency Intelligence**
   - Saudi amounts in SAR (2 decimals)
   - Kuwaiti amounts in KWD (3 decimals)
   - Auto-format based on detected country

3. **Language Adaptation**
   - Arabic input → Arabic response
   - Gulf dialect recognition
   - Formal vs. casual Arabic options

4. **Holiday Awareness**
   - Ramadan schedule adjustments
   - National Day holidays
   - Eid notifications

### Key Talking Point
> "Nexus doesn't just translate - it understands the region. From work week customs to currency formatting, everything adapts to local expectations."

---

## Demo 4: Compliance Reporting (30 seconds)

### Quick Overview

1. **ZATCA Compliance Report**
   - Show monthly invoice summary
   - Show VAT collected vs. submitted
   - Show penalty risk: NONE

2. **Payment Reconciliation**
   - Show KNET daily settlement
   - Show transaction success rate: 98.5%
   - Show failed transaction recovery

---

## Closing (20 seconds)

> "Regional compliance shouldn't be a burden. With Nexus, ZATCA submissions happen automatically, KNET payments flow seamlessly, and your business stays compliant without the complexity."

**Call to Action:**
- "Connect your Saudi VAT ID for ZATCA integration"
- "Connect your KNET merchant account"
- "Start your 14-day regional compliance trial"

---

## Demo Environment Setup

### Before Recording

1. **Accounts Configured:**
   - [ ] ZATCA sandbox credentials
   - [ ] KNET sandbox merchant account
   - [ ] Arabic language pack

2. **Test Data:**
   - Saudi company: "شركة النخبة للتجارة" (Elite Trading Co.)
   - VAT: 310123456789003
   - Kuwaiti customer: "Ahmad Al-Kuwaiti"
   - Amount: KWD 50.000

3. **Environment:**
   - Arabic keyboard visible
   - RTL interface enabled
   - WhatsApp in Arabic

### Key Screenshots Needed

1. ZATCA-compliant invoice with QR code
2. ZATCA submission confirmation
3. KNET payment page
4. WhatsApp payment confirmation (Arabic)
5. Regional compliance dashboard

---

## Localization Notes

### Arabic Terminology

| English | Arabic |
|---------|--------|
| Invoice | فاتورة |
| VAT | ضريبة القيمة المضافة |
| Payment | دفع |
| Refund | استرداد |
| Compliance | الامتثال |
| Tax Authority | هيئة الزكاة والضريبة |

### Currency Formatting

| Country | Currency | Decimals | Example |
|---------|----------|----------|---------|
| Saudi Arabia | SAR | 2 | 5,000.00 ر.س |
| Kuwait | KWD | 3 | 50.000 د.ك |
| UAE | AED | 2 | 1,000.00 د.إ |
| Bahrain | BHD | 3 | 100.000 د.ب |
| Qatar | QAR | 2 | 500.00 ر.ق |
| Oman | OMR | 3 | 200.000 ر.ع |

---

## Technical Notes

### Services Used

| Feature | Backend Service | Fix Marker |
|---------|----------------|------------|
| ZATCA E-Invoicing | `ZATCAService.ts` | @NEXUS-FIX-088 |
| KNET Payments | `KNETService.ts` | @NEXUS-FIX-089 |

### ZATCA API Endpoints

| Environment | URL |
|-------------|-----|
| Sandbox | https://gw-fatoora.zatca.gov.sa/sandbox |
| Production | https://gw-fatoora.zatca.gov.sa |

### KNET Integration Partners

| Partner | Best For | URL |
|---------|----------|-----|
| Tap Payments | Multi-GCC | tap.company |
| MyFatoorah | Kuwait/Bahrain | myfatoorah.com |
| UpayME | SMB Kuwait | upayme.io |

### Compliance Deadlines

| Wave | Threshold | Deadline |
|------|-----------|----------|
| 23 | SAR 750K+ | Mar 2026 |
| 24 | SAR 375K+ | Jun 2026 |
| 25 | All VAT registered | Dec 2026 |

---

## Sources

Research compiled from:
- [ZATCA Official E-Invoicing Page](https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx)
- [ZATCA Roll-out Phases](https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/Roll-out-phases.aspx)
- [Wafeq ZATCA Phase 2 Guide](https://www.wafeq.com/en-sa/e-invoicing-in-saudi-arabia/preparing-for-e-invoicing/zatca-e-invoicing-phase-2)
- [EY Saudi Arabia Tax Alert](https://www.ey.com/en_gl/technical/tax-alerts/saudi-arabia-announces-23rd-wave-of-phase-2-e-invoicing-integration)

---

*Last Updated: February 2, 2026*
*Demo Version: 1.0*
