# Ideation: Opportunity Analysis
## Mohammed's Competitive Intelligence & Review Mining Tool

---

## THE CORE INSIGHT

**Nobody builds tools to FIND opportunities. They all build tools to TRACK competitors.**

The market is saturated with:
- "Monitor your competitors"
- "Track competitor changes"
- "Get alerted when competitors do X"

But nobody answers the founder's real question:
> "What product should I build that people will actually pay for?"

---

## THE $37B PROBLEM

**B2B software market is $630B+ and growing.**

Every day:
- 10,000+ reviews posted on G2/Capterra
- 500,000+ app store reviews
- Millions of Reddit/Twitter complaints

**Hidden in this data:**
- Unmet needs
- Feature gaps
- Pricing frustrations
- Support failures
- Integration wishes

**Currently:** This data sits unused. Tools aggregate it but don't extract opportunities.

---

## IDEATION'S POSITIONING

### NOT Another CI Tool
We don't compete with Klue, Crayon, or Brandwatch.

### Opportunity Mining Platform
We help founders discover:
- What products to build
- What features to add
- What markets to enter
- What problems to solve

### Target User: Founders/PMs
- Solo founders looking for ideas
- Product managers prioritizing roadmap
- Startup teams validating hypotheses
- Indie hackers finding niches

---

## UNIQUE VALUE PROPOSITIONS

### 1. "Ask Your Competitors' Users"
> "What do Notion users wish Notion had?"
> "What are Asana users most frustrated about?"
> "What do Figma users love that other design tools lack?"

**No tool does this conversationally today.**

### 2. Opportunity Scoring
For each extracted insight:
- **Frequency:** How often is this mentioned?
- **Intensity:** How frustrated are users?
- **Unaddressed:** Is the vendor responding?
- **Market Size:** How big is the TAM?
- **Competition:** Who else serves this need?

**Output:** Ranked list of opportunities with confidence scores.

### 3. Multi-Source Truth
Don't trust one source:
- G2 has B2B software
- Capterra has SMB focus
- Trustpilot has consumer angle
- App stores have mobile users
- Reddit has authentic complaints
- Twitter has real-time frustration

**Triangulate for truth.**

### 4. Founder-Friendly Pricing
| Tier | Price | Competitors | Insights |
|------|-------|-------------|----------|
| Free | $0 | 1 | Basic |
| Starter | $29 | 5 | Full |
| Pro | $79 | 20 | Full + API |
| Team | $199 | Unlimited | Collaboration |

**10-50x cheaper than enterprise CI tools.**

---

## FEATURE ROADMAP

### Phase 1: MVP (4-6 weeks)
- G2 review scraping
- Basic opportunity extraction
- GPT-powered insights
- Simple web interface

**Goal:** Validate with 10 paying users at $29/month

### Phase 2: Expansion (2-3 months)
- Add Capterra, Trustpilot
- Add App Stores
- Competitor comparison
- Opportunity scoring
- Email alerts

**Goal:** 100 users, $3K MRR

### Phase 3: Scale (3-6 months)
- Reddit integration
- Twitter/X integration
- API for developers
- Team features
- Historical trends

**Goal:** 500 users, $20K MRR

### Phase 4: Moat (6-12 months)
- Fine-tuned AI models
- Predictive opportunity detection
- Market reports
- Industry benchmarks
- Enterprise tier

**Goal:** 2,000 users, $100K MRR

---

## TECHNICAL ARCHITECTURE

### Data Layer
```
Sources → Scrapers → Raw Storage → Processor → Clean Storage → AI → Insights
```

| Component | Tech |
|-----------|------|
| Scraping | Apify, Brightdata, or custom |
| Raw Storage | S3/Supabase Storage |
| Processor | Node.js workers |
| Clean Storage | PostgreSQL (Supabase) |
| AI Layer | OpenAI GPT-4o |
| Search | Elasticsearch or Typesense |
| API | Node.js + Express |
| Frontend | React + Vite + Tailwind |

### AI Pipeline
```
Review Text →
  Entity Extraction (product, feature, sentiment) →
  Classification (complaint, wish, praise, question) →
  Opportunity Extraction (unmet need, gap, frustration) →
  Scoring (frequency, intensity, market) →
  Presentation (ranked opportunities)
```

### Data Sources Integration

| Source | Method | Difficulty | Priority |
|--------|--------|------------|----------|
| G2 | API + Scrape | Medium | HIGH |
| Capterra | Scrape | Hard | HIGH |
| Trustpilot | API | Medium | HIGH |
| App Store | API | Easy | HIGH |
| Play Store | Scrape | Medium | HIGH |
| Reddit | API | Easy | MEDIUM |
| Twitter/X | API | Medium | MEDIUM |
| Product Hunt | API | Easy | LOW |

---

## GO-TO-MARKET

### Launch Strategy

**Week 1-2: Build in Public**
- Tweet progress daily
- Post on Indie Hackers
- Share on Reddit r/SaaS, r/startups

**Week 3-4: Beta Users**
- Reach out to 50 founders
- Offer free access for feedback
- Iterate based on usage

**Week 5-6: Soft Launch**
- Product Hunt launch
- Hacker News Show HN
- Email list announcement

**Week 7+: Growth**
- Content marketing (opportunity reports)
- SEO (competitor analysis keywords)
- Partnerships (VC scouts, accelerators)

### Pricing Psychology

| Why $29 Starter |
|-----------------|
| Below impulse buy threshold |
| 10x cheaper than alternatives |
| Signals accessibility |
| Still qualifies users |
| Good unit economics at scale |

| Why $79 Pro |
|-------------|
| Still very affordable |
| Adds API = sticky |
| Power users self-select |
| $1K/year is budget-able |

---

## RISKS & MITIGATIONS

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scraping blocked | High | Multiple providers, API fallbacks |
| GPT costs too high | Medium | Caching, batching, fine-tuning |
| Low conversion | Medium | Focus on value, social proof |
| Competitor copies | High | Speed, brand, community moat |
| Data accuracy | Medium | Multi-source validation |

---

## SUCCESS METRICS

### North Star
**Weekly Active Queries** - How many opportunity searches per week

### Leading Indicators
- Sign-ups per week
- Queries per user
- Time in app
- Return rate

### Lagging Indicators
- MRR
- Churn rate
- NPS score
- Referral rate

---

## COMPETITIVE RESPONSE

### If Klue/Crayon Enter
- They're enterprise-focused, won't go down-market
- Our UX will be founder-native
- Price moat (they can't be $29/month)

### If New Startup Copies
- First-mover advantage in positioning
- Community/content moat
- Iterate faster with user feedback

### If AI Tools Generalize
- Specialization wins for workflows
- Integrated data sources are our moat
- Not just AI, but AI + data + UX

---

## VALIDATION QUESTIONS

Before building, validate:

1. **Problem:** Do founders actively search for product opportunities?
2. **Solution:** Would they use a tool vs. manual research?
3. **Price:** Will they pay $29-79/month?
4. **Source:** Do they trust aggregated review data?
5. **Competition:** Why not just use ChatGPT + manual reading?

### Validation Methods

| Method | Timeline | Cost |
|--------|----------|------|
| Founder interviews (10) | 1 week | $0 |
| Landing page test | 1 week | $100 (ads) |
| Manual service (done-for-you) | 2 weeks | $0 |
| Waitlist with pricing | 1 week | $50 (domain) |

---

## NEXT ACTIONS

1. **Today:** Outline landing page messaging
2. **This Week:** Interview 5 founders about CI pain
3. **Next Week:** Build scraper prototype for G2
4. **In 2 Weeks:** Test with 3 beta users
5. **In 4 Weeks:** Launch MVP or pivot

---

## THE VISION

**6-Month Vision:**
> "Ideation is the go-to tool for founders who want to discover what to build. We've analyzed 10M+ reviews and helped 1,000+ founders find their next opportunity."

**2-Year Vision:**
> "Ideation is the Crunchbase for opportunities. VCs use us to find market gaps. Founders use us to validate ideas. Product teams use us to prioritize roadmaps. We're the source of truth for 'what should exist but doesn't.'"

---

*Analysis compiled January 2025*
