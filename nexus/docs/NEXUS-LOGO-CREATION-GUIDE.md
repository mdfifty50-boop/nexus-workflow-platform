# Nexus Logo Creation Guide — Complete Brief + Tools + Prompts

**Created:** 2026-02-20
**Status:** Nexus currently has NO logo (uses Vite favicon + Lucide Zap icon placeholder)
**Budget:** $0

---

## BRAND IDENTITY SUMMARY (Extracted from Nexus Codebase)

### Brand Essence
Nexus is the intelligent bridge between what you want done and the technology that does it — turning plain language into automated action.

### Brand Personality (5 Adjectives)
1. **Intelligent** — AI-first, deep business knowledge
2. **Approachable** — Chat interface, plain English, zero jargon
3. **Sleek** — Dark premium UI, glassmorphism, gradient glows
4. **Decisive** — Action-oriented, concise, "gets straight to the point"
5. **Culturally fluent** — Bilingual, globally aware, adapts to context

### Current Color DNA (from the product)

| Role | Color | Hex |
|------|-------|-----|
| Primary (UI) | Sky Blue | `#0EA5E9` |
| AI Accent | Violet/Purple | `#8B5CF6` |
| Energy/Highlight | Fuchsia | `#D946EF` |
| Dark Background | Slate 900 | `#0F172A` |
| Text on Dark | Slate 50 | `#F8FAFC` |
| Signature Gradient | Sky Blue → Violet | `#0EA5E9 → #8B5CF6` |

### Typography
- **Product font:** Inter (self-hosted)
- **Logo font recommendation:** **Satoshi** (geometric sans-serif, free, premium SaaS feel) or custom Inter-based lettering

---

## COMPETITIVE LANDSCAPE (What to Avoid)

| Competitor | Logo Style | Color | Avoid Because |
|-----------|-----------|-------|---------------|
| **Zapier** | Wordmark + underline | Orange `#FF4F00` | They OWN orange in automation |
| **Make** | 3 parallelogram dominoes | Purple/Magenta | Too close to our purple accent |
| **n8n** | Wordmark "n8n" | Black + pink accent | Node-connection imagery overused |
| **IFTTT** | Text in rounded square | Black/White | Too minimal, no metaphor |
| **Power Automate** | Flowing arrows | Blue `#0078D4` | Generic "tech blue" + arrows |
| **Notion** | Stylized "N" lettermark | Black/White | They own the "N in a box" concept |
| **Linear** | Abstract "L" + gradient sphere | Purple/blue gradient | Gradient orb trend peaked 2024 |

### Visual Motifs to AVOID
- Connected circles with lines (n8n, Power Automate, every AI startup)
- Lightning bolts (too close to Zapier's old icon AND our current Zap placeholder)
- Generic "N" in a square/circle (Notion owns this)
- Brain/neural network imagery (overused in AI)
- Gear/cog icons (feels "settings", not "intelligence")
- Right-pointing arrows (Power Automate)
- Generic chat bubbles (every AI chatbot)

---

## THREE LOGO CONCEPT DIRECTIONS

### Concept 1: "The Convergence" — TOP PICK (Score: 77/90)

**Description:** Three geometric lines converging from different angles into a single central point, subtly forming an "N" at the intersection. The convergence point represents the "nexus" — where everything comes together.

**Why it wins:**
- Directly represents the meaning of "nexus" (a point of connection)
- No competitor uses convergence imagery
- Animates naturally (lines flowing inward)
- Scales perfectly to 16px favicon
- Forms an "N" without being a literal lettermark
- Works in monochrome AND gradient

**Visual:** Imagine three paths — one from upper-left, one from left, one from lower-left — converging at a single point on the right side. The negative space between the lines suggests the letter "N". The convergence point can glow with the brand gradient.

### Concept 2: "The Keystone" (Premium/Enterprise, Score: 70/90)

**Description:** A hexagonal keystone shape with the letter "N" formed through negative space. The metaphor: "remove the keystone and everything falls apart" — Nexus is the critical piece that holds your automation together.

**Why it works:**
- Hexagonal geometry already exists in Nexus UI (current NexusAILogo SVG)
- Architectural metaphor = trust, stability, indispensability
- Clean negative-space "N" is sophisticated
- Works beautifully as an app icon (hex fits in rounded square)

### Concept 3: "The Weave" (Most Creative, Score: 72/90)

**Description:** Flowing lines that interweave into a compact knot, inspired by the Latin root "nectere" (to bind). Represents data streams weaving together into a unified automation.

**Why it works:**
- Completely unique in automation branding
- Best animation potential (flowing, weaving motion)
- Communicates both connection AND intelligence
- Organic feel contrasts with competitors' geometric rigidity

---

## RECOMMENDED COLOR STRATEGY

### Option A: Stay with Product Colors (Safe)
- **Primary:** Sky Blue `#0EA5E9` → Violet `#8B5CF6` gradient
- **Pros:** Perfect consistency with existing product UI
- **Cons:** Blue-purple is increasingly crowded in SaaS

### Option B: Bold Differentiation (Agent 3's Recommendation)
- **Primary:** Teal `#0D9488`
- **Accent:** Warm Amber `#F59E0B`
- **Pros:** No automation competitor uses teal. It's THE trending color for 2026. Communicates tech (blue) + growth (green).
- **Cons:** Requires updating product color palette for consistency

### Option C: Hybrid (Recommended)
- **Logo primary:** Deep Indigo `#4F46E5` → Teal `#0D9488` gradient
- **This bridges** the existing purple DNA with a fresh, distinctive teal
- **The logo feels new** while still belonging to the Nexus product family

---

## THE $0 LOGO CREATION TOOLKIT

### Best Tools (Ranked)

| Rank | Tool | Quality | SVG? | Commercial? | How to Use |
|------|------|---------|------|-------------|-----------|
| **1** | **Recraft V3/V4** | 9/10 | Native SVG | No on free* | Best quality, 30-50 daily credits |
| **2** | **ChatGPT (GPT-4o)** | 7-8/10 | Via vectorization | **Yes** | 2-3 images/day, iterative refinement |
| **3** | **Design.com** | 7/10 | Native SVG | **Yes** | 5-minute complete logo |
| **4** | **Ideogram** | 8/10 text | Via vectorization | Partial | Best text rendering for wordmarks |
| **5** | **Bing Image Creator** | 7/10 | Via vectorization | **Yes** | 15+ images/day, high volume |

*Recraft free tier: images are public. Pay $25 for 1 month to get commercial rights, or use as design reference and recreate in Inkscape/Figma.

### Vectorization Pipeline (Raster → SVG at $0)

```
AI-generated PNG logo
    ↓
Vectorizer.AI (vectorizer.ai) — best quality, free during beta
    ↓
Inkscape (free) — clean up paths, optimize SVG, adjust colors
    ↓
Final SVG (multiple variants: full color, monochrome, dark mode)
```

### Alternative vectorizers:
- **Recraft Vectorizer** (recraft.ai/ai-image-vectorizer) — AI-powered, 8/10 quality
- **SVGcode** (svgco.de) — browser-based, 7/10 quality
- **Adobe Express** — Illustrator engine, 7/10 quality
- **Inkscape Trace Bitmap** — full control, 7/10 quality

---

## EXACT AI PROMPTS (Ready to Paste)

### For Concept 1: "The Convergence"

**Recraft V3 prompt:**
```
Minimal abstract logo mark for a technology company called "Nexus". Three clean geometric lines converging from different angles into a single central point, forming a subtle letter "N" at the intersection. The lines are smooth, slightly tapered, with rounded endpoints. Deep indigo (#4F46E5) to teal (#0D9488) gradient on the lines. Pure white background. Flat vector style, no shadows, no 3D effects. Logo should work at 16x16 pixels.
```

**ChatGPT GPT-4o prompt:**
```
Design a minimal, geometric logo icon for "Nexus" — an AI-powered workflow automation platform. The concept: three lines converging from three different directions into a single central point, subtly forming the letter "N" through the negative space at their intersection. Style: clean vector, flat design, no gradients initially (just solid deep indigo #4F46E5). The mark should be simple enough to work as a 16x16 favicon. White background. No text, icon only.
```

**Ideogram prompt (for wordmark):**
```
Clean modern wordmark logo text "NEXUS" in Satoshi Bold font, geometric sans-serif, deep indigo blue color #4F46E5, minimal, professional SaaS branding, white background, vector style, no icon, no decoration, clean letterforms with tight tracking
```

**Bing Image Creator prompt:**
```
Minimalist geometric logo for "Nexus" technology company. Three converging lines meeting at a single point forming a subtle N shape. Deep blue-indigo color, white background, flat vector design, clean simple lines, scalable, professional modern SaaS logo
```

### For Concept 2: "The Keystone"

**Recraft V3 prompt:**
```
Minimal hexagonal logo mark for a technology company. A regular hexagon with the letter "N" formed through negative space cut into the shape. Clean geometric construction, deep indigo (#4F46E5) solid fill, white negative space forming the N. Flat vector, no gradients, no shadows. Should work at very small sizes. White background.
```

**ChatGPT GPT-4o prompt:**
```
Design a hexagonal logo icon for "Nexus". A solid hexagon shape with the letter "N" carved out as negative space (white space cutting through the hexagon). The hexagon is deep indigo blue (#4F46E5). The negative-space N should be geometric and angular, formed by clean diagonal cuts through the hexagon. Flat vector style, no 3D, no shadows. White background. Icon only, no text.
```

### For Concept 3: "The Weave"

**Recraft V3 prompt:**
```
Abstract woven knot logo for a technology company called "Nexus". Three flowing lines that interweave and cross over each other, forming a compact, symmetrical knot shape. Deep teal (#0D9488) color. The weave pattern suggests connection and flow. Celtic knot inspired but modern and geometric, not ornamental. Flat vector, clean lines of uniform width. White background.
```

**ChatGPT GPT-4o prompt:**
```
Design an abstract logo icon representing "weaving" or "interweaving" for a tech company called Nexus. Three smooth curved lines that weave over and under each other to form a compact knot or braid shape. The lines should be uniform width, clean, and geometric — inspired by Celtic knots but modernized to feel like a tech brand. Solid teal color (#0D9488). Flat vector, no shadows, no gradients. White background. The overall shape should fit in a square and work at 16px.
```

---

## RECOMMENDED WORKFLOW

### Day 1: Explore (2-3 hours)
1. Open **Recraft** (recraft.ai) — generate 20-30 variations using the Convergence prompts above
2. Open **ChatGPT** — generate 2-3 variations with iterative refinement ("make it more angular", "try with rounded corners", "what about a gradient version?")
3. Open **Bing Image Creator** — generate 15+ batch variations for volume
4. Collect all favorites in a folder

### Day 2: Refine (1-2 hours)
1. Pick top 3-5 concepts from Day 1
2. Go back to **Recraft** with more specific prompts based on what worked
3. Use **ChatGPT** to iterate: "I like this direction but [change X]"
4. Narrow to top 1-2 concepts

### Day 3: Vectorize & Polish (2-3 hours)
1. Take the winning concept
2. Run through **Vectorizer.AI** for clean SVG conversion
3. Open in **Inkscape** (free):
   - Clean up unnecessary anchor points
   - Ensure perfect symmetry
   - Apply exact brand colors
   - Create variants: full color, monochrome white, monochrome dark
4. Create the wordmark: type "Nexus" in Satoshi Bold, adjust kerning
5. Create the lockup: icon + wordmark side by side

### Day 4: Test & Finalize (1 hour)
1. Test at all sizes: 16px (favicon), 32px, 64px, 128px, 512px
2. Test on dark background (`#0F172A`)
3. Test on white background
4. Test as rounded-square app icon
5. Export: SVG, PNG (all sizes), ICO (favicon)

---

## DELIVERABLES NEEDED

| File | Format | Sizes | Usage |
|------|--------|-------|-------|
| Logo icon (full color) | SVG + PNG | 16, 32, 64, 128, 192, 256, 512 | Primary mark |
| Logo icon (white) | SVG + PNG | Same | Dark backgrounds |
| Logo icon (dark) | SVG + PNG | Same | Light backgrounds |
| Wordmark "Nexus" | SVG + PNG | Various | Marketing |
| Full lockup (icon + wordmark) | SVG + PNG | Various | Website, docs |
| Favicon | ICO + SVG | 16, 32 | Browser tab |
| App icon (maskable) | PNG | 192, 512 | PWA manifest |
| Social avatar | PNG | 400x400 | GitHub, social |
| OG image | PNG | 1200x630 | Social sharing |

---

## INTEGRATION INTO NEXUS CODEBASE

Once the logo is created, these files need updating:

| File | Current | Replace With |
|------|---------|-------------|
| `nexus/public/vite.svg` | Vite logo (favicon) | Nexus icon SVG |
| `nexus/index.html` favicon link | `/vite.svg` | `/nexus-icon.svg` |
| `nexus/src/pages/LandingPage.tsx` NexusAILogo | Hexagon with nodes | New logo SVG component |
| `nexus/src/pages/LandingPage.tsx` nav icon | Zap (Lucide) | New logo icon |
| `nexus/src/pages/LandingPage.tsx` footer icon | Zap (Lucide) | New logo icon |
| PWA manifest icons | Default | Nexus icon PNGs |
| OG meta image | None | Nexus OG image |

---

## QUICK START (Right Now, 5 Minutes)

If you want a working logo TODAY:

1. Go to **design.com/logo-maker**
2. Enter "Nexus" + "AI workflow automation"
3. Select a design you like
4. Customize: change colors to `#4F46E5` (indigo) or `#0EA5E9` (sky blue)
5. Download SVG + PNG (free, commercial use, no watermark)
6. Replace `vite.svg` in Nexus

For a PREMIUM result, follow the Day 1-4 workflow above with Recraft + ChatGPT + Inkscape.

---

*Full competitor analysis: `Ideation/NEXUS-LOGO-DESIGN-RESEARCH.md`*
*Full brand identity brief: extracted from Nexus codebase by Agent 1*
*Full tool research: AI Logo Tools agent report*
