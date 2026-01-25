# Design Inspiration Platforms with API Access - Comprehensive Research

**Research Date:** January 2025
**Purpose:** Identify design inspiration platforms similar to Mobbin that offer API access for programmatic use by AI agents

---

## Executive Summary

This research identifies platforms offering programmatic access to UI/UX design patterns, screenshots, components, and design tokens. The findings are categorized by:

1. **Design Inspiration Platforms** (Mobbin alternatives)
2. **Design Tool APIs** (Figma, Penpot)
3. **Component Libraries with APIs** (Radix, MUI, Chakra, shadcn)
4. **Design Token Platforms** (Tokens Studio, Style Dictionary)
5. **Screenshot APIs** (for capturing design references)
6. **Animation & Asset Libraries** (LottieFiles, IconScout)
7. **AI-Powered Design Tools** (GPT-4 Vision, Google Stitch)
8. **Design System Documentation** (Supernova, Storybook, Zeroheight)

---

## 1. Design Inspiration Platforms

### Mobbin
**URL:** https://mobbin.com/
**What it offers:** 50,000+ fully searchable mobile and web app screenshots, user flows, UI patterns
**API Status:** **NO OFFICIAL PUBLIC API**
- Unofficial Swift API exists: [MobbinAPI on GitHub](https://github.com/underthestars-zhy/MobbinAPI)
- Tokens expire daily, limited to 24 apps per page
- Built on Supabase (PostgreSQL)
**Pricing:** Free plan (limited), $10-15/month premium
**Limitations:** No official API, strict token policies

### Refero
**URL:** https://refero.design/
**What it offers:** 100,000+ curated screens for web and iOS, user flows, UX patterns, UI elements
**API Status:** **NO PUBLIC API FOUND**
- Figma/Sketch export via annotated PNGs
- Taxonomy aligned with developer workflows
**Pricing:** $14/month or $8/month (annual)

### Page Flows
**URL:** https://pageflows.com/
**What it offers:** Dynamic user flows (videos), application screenshots, emails
**API Status:** **NO PUBLIC API**
**Features:** Step-by-step annotations, screen recordings

### UI Sources
**URL:** https://uisources.com/
**What it offers:** Mobile design patterns, screenshots grouped by flows
**API Status:** **NO PUBLIC API**
**Users:** 100k+ designers, developers, PMs

### Collect UI
**URL:** https://collectui.com/
**What it offers:** Daily inspiration from Dribbble, hand-picked designs
**API Status:** **NO PUBLIC API**

### Banani
**URL:** https://www.banani.co/references
**What it offers:** 1000+ screens of mobile apps, flows for onboarding, booking, browsing
**API Status:** **NO PUBLIC API**
**Pricing:** Free

---

## 2. Design Tool APIs (HIGH VALUE)

### Figma API ⭐⭐⭐⭐⭐
**URL:** https://developers.figma.com/
**What it offers:** Full access to Figma file structure, components, styles, variables
**API Type:** REST API (primarily read-only) + Plugin API (full editing)
**Authentication:** OAuth2, Personal Access Tokens

**Capabilities:**
- View and extract objects/layers and properties from files
- Get usage data
- Listen for events with webhooks
- Access to community files (with file key)

**MCP Server (2025):**
- Official Figma Dev Mode MCP Server in public beta
- Provides design system context for AI-enabled code editors
- Code Connect for design system codebase integration

**Rate Limits:** Varies by plan
**Pricing:** Free tier available, Pro/Org/Enterprise for full API access

**Code Example:**
```javascript
// Figma REST API example
const response = await fetch(
  `https://api.figma.com/v1/files/${FILE_KEY}`,
  {
    headers: {
      'X-Figma-Token': FIGMA_ACCESS_TOKEN
    }
  }
);
const file = await response.json();
```

### Penpot API ⭐⭐⭐⭐
**URL:** https://penpot.app/
**GitHub:** https://github.com/penpot/penpot
**What it offers:** Open-source design tool with SVG, CSS, HTML, JSON support
**API Status:** **YES - REST API + MCP Server**

**Features:**
- Self-hosted or cloud
- Native design tokens (2.0 release)
- CSS Grid Layout support
- No vendor lock-in

**Penpot MCP Server:**
- Repository: https://github.com/montevive/penpot-mcp
- Direct integration with AI assistants (Claude)
- Real-time design access, export automation
- Python SDK included

**Authentication:** Username/password, API tokens
**Pricing:** Free (open-source)

**Configuration:**
```env
PENPOT_API_URL=https://design.penpot.app/api
PENPOT_USERNAME=your-email
PENPOT_PASSWORD=your-password
```

---

## 3. Component Libraries with APIs (HIGH VALUE)

### Radix UI ⭐⭐⭐⭐⭐
**URL:** https://www.radix-ui.com/primitives
**GitHub:** https://github.com/radix-ui/primitives
**What it offers:** 32+ unstyled, accessible React components

**API Features:**
- Fully-typed API with TypeScript
- Composable interface via `asChild` prop
- Data attributes for state management
- Controlled/uncontrolled components

**No REST API** - but excellent programmatic React API

**Code Example:**
```jsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Dialog Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### MUI (Material UI) ⭐⭐⭐⭐
**URL:** https://mui.com/material-ui/
**What it offers:** React components implementing Material Design
**API Type:** Component API with extensive props

**Features:**
- Extensive Component API documentation
- CSS-in-JS theming
- Tree-shaking support
- TypeScript definitions

**Installation:**
```bash
npm install @mui/material @emotion/react @emotion/styled
```

### Chakra UI ⭐⭐⭐⭐
**URL:** https://chakra-ui.com/
**GitHub:** https://github.com/chakra-ui/chakra-ui
**What it offers:** Modular, accessible React components

**API Features:**
- Composable component APIs
- baseStyle, sizes, variants pattern
- WAI-ARIA compliant
- Built-in theming system

**Documentation:** https://chakra-ui.com/docs/components

### shadcn/ui ⭐⭐⭐⭐⭐
**URL:** https://ui.shadcn.com/
**GitHub:** https://github.com/shadcn-ui/ui
**What it offers:** Copy-paste React components with Tailwind CSS

**Key Concept:** Not a dependency - you own the code

**CLI (Programmatic):**
```bash
npx shadcn add button
npx shadcn add dialog
```

**AI-Friendly:**
- Consistent, predictable API for LLMs
- Open code approach enables AI to read/understand/generate

### Ant Design ⭐⭐⭐⭐
**URL:** https://ant.design/
**GitHub:** https://github.com/ant-design/ant-design
**What it offers:** Enterprise-class React UI library

**Features:**
- 50+ high-quality components
- TypeScript built-in
- CSS-in-JS theming
- Tree-shaking support

**Documentation:** https://ant.design/components/overview/

### Headless UI Libraries (Unstyled)

| Library | URL | Framework | Components |
|---------|-----|-----------|------------|
| Ark UI | https://ark-ui.com/ | React, Solid, Vue, Svelte | 45+ |
| Zag JS | https://zagjs.com/ | Framework-agnostic | State machines |
| Headless UI | https://headlessui.com/ | React, Vue | 10+ |
| React Aria | https://react-spectrum.adobe.com/react-aria/ | React | Hooks-based |

---

## 4. Design Token Platforms (HIGH VALUE)

### Tokens Studio ⭐⭐⭐⭐⭐
**URL:** https://tokens.studio/
**GitHub:** https://github.com/tokens-studio
**What it offers:** Design tokens management with 23+ token types

**API Access:**
- Figma plugin + Studio platform
- GitHub integration
- Programmatic token sync
- Style Dictionary integration

**Export Formats:** CSS, JSON, CSS-in-JS, iOS, Android, 10+ formats

**SD-Transforms Package:**
```javascript
import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';

register(StyleDictionary);
```

### Style Dictionary ⭐⭐⭐⭐⭐
**URL:** https://styledictionary.com/
**GitHub:** https://github.com/amzn/style-dictionary
**What it offers:** Build system for design tokens

**API Type:** Node.js/JavaScript programmatic API

**Features:**
- Platform-agnostic token definitions
- Multiple output formats (CSS, SCSS, JS, iOS, Android)
- Custom transforms and formatters
- CLI and programmatic usage

**Code Example:**
```javascript
import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

register(StyleDictionary);

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables'
      }]
    }
  }
});

await sd.buildAllPlatforms();
```

---

## 5. Screenshot APIs (for Design Reference Capture)

### ScreenshotOne ⭐⭐⭐⭐
**URL:** https://screenshotone.com/
**What it offers:** Website screenshots via API

**Features:**
- Lazy loading support
- Native SDKs
- Full-page captures
- Customizable viewport

### Urlbox ⭐⭐⭐⭐⭐
**URL:** https://urlbox.com/
**What it offers:** Full-page screenshot API with AI analysis

**Features:**
- 100+ rendering options
- PNG, PDF, video, HTML, Markdown outputs
- **AI analysis with custom prompts** (OpenAI/Anthropic integration)
- Competitive intelligence use cases

**AI Integration:**
```javascript
// Urlbox can analyze screenshots with AI
const response = await urlbox.render({
  url: 'https://example.com',
  ai_prompt: 'Analyze the layout and describe UI components',
  ai_schema: { /* JSON schema */ }
});
```

### ApiFlash
**URL:** https://apiflash.com/
**What it offers:** Chrome-based screenshot API on AWS Lambda

**Features:**
- Mobile/desktop screenshots
- Ad blocking, cookie-banner hiding
- S3 exports
- Automatic page load detection

### Thum.io
**URL:** https://www.thum.io/
**What it offers:** Real-time website screenshot API

**Features:**
- Full-page captures
- Image resizing
- PDF to image conversion

### Brand.dev (NEW - 2024)
**URL:** https://brand.dev/
**What it offers:** Brand asset and styleguide extraction

**APIs:**
- Screenshot API (Beta)
- Styleguide API (Beta) - extract colors, typography, spacing, shadows

---

## 6. Animation & Asset Libraries

### LottieFiles ⭐⭐⭐⭐⭐
**URL:** https://lottiefiles.com/
**Developer Portal:** https://developers.lottiefiles.com/
**What it offers:** JSON-based animation file format

**API Features:**
- dotLottie Web Player
- Framework-specific SDKs (React, Vue, iOS, Android)
- relottie AST tools for programmatic manipulation

**Documentation:** https://developers.lottiefiles.com/docs/

**Code Example:**
```javascript
import { DotLottie } from '@lottiefiles/dotlottie-web';

const dotlottie = new DotLottie({
  canvas: document.getElementById('canvas'),
  src: 'https://lottie.host/animation.lottie',
  autoplay: true,
  loop: true
});
```

### IconScout
**URL:** https://iconscout.com/
**What it offers:** 11.9M+ icons, illustrations, 3D assets, Lottie animations

**API:** REST API for asset integration
**Formats:** SVG, PNG, Lottie JSON, GIF, MP4
**Plugins:** Figma, Adobe XD, Sketch

---

## 7. AI-Powered Design Tools

### GPT-4 Vision / GPT-4o ⭐⭐⭐⭐⭐
**URL:** https://platform.openai.com/docs/guides/vision
**What it offers:** Image analysis, UI understanding, code generation

**Capabilities:**
- UI state analysis
- HTML/CSS/React code generation from screenshots
- OCR with layout reasoning
- Visual diffing between designs

**Use Cases:**
- RPA agent UI element detection (272% improvement with fine-tuning)
- Website code generation with consistent style (+26% improvement)

**Code Example:**
```python
from openai import OpenAI
client = OpenAI()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze this UI and describe the component structure"},
                {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
            ]
        }
    ]
)
```

### Google Stitch (formerly Galileo AI) ⭐⭐⭐⭐
**URL:** https://labs.google.com/stitch
**What it offers:** AI-powered UI generation from prompts

**Features:**
- Text-to-UI generation
- Image-to-UI conversion
- Figma export with editable layers
- HTML/CSS and React code generation

**Pricing:** Free (Google Labs, with monthly limits)
**API:** **NO PUBLIC API** - web interface only

### Uizard ⭐⭐⭐
**URL:** https://uizard.io/
**What it offers:** AI-powered prototyping

**Features:**
- Hand-drawn wireframe to prototype
- Screenshot to editable design
- AI heatmap predictions
- Theme generation from images

**API:** **NO PUBLIC API** - web interface only

---

## 8. Design System Documentation Platforms

### Supernova ⭐⭐⭐⭐⭐
**URL:** https://www.supernova.io/
**Developer Docs:** https://developers.supernova.io/
**What it offers:** Design system documentation and management

**API Access:**
- TypeScript SDK
- CLI utility
- REST API endpoints
- **MCP Server (Supernova Relay)** - September 2025

**MCP Functions:**
- `get_design_component_detail` - Component metadata
- `get_design_component_list` - All components list
- `get_token_list` - Design tokens with values/references
- `get_storybook_story_detail` - Storybook story details

**Authentication:** API key + design system ID

### Zeroheight ⭐⭐⭐⭐
**URL:** https://zeroheight.com/
**What it offers:** Design system documentation platform

**API Access:** Enterprise plan only
- Storybook addon integration
- GitHub integration
- Pages endpoint API

**Integration Code:**
```javascript
// Storybook addon
addons: ['@zeroheight/storybook-addon']

// .env
ZEROHEIGHT_AUTH_TOKEN=xxx
```

### Storybook ⭐⭐⭐⭐
**URL:** https://storybook.js.org/
**What it offers:** Component development and documentation

**Features:**
- Live code examples
- Auto-generated API docs (ArgsTable)
- Interactive controls
- Design integrations

**No REST API** - but excellent programmatic JavaScript API

---

## 9. Additional Resources

### Dribbble API ⭐⭐⭐
**URL:** https://developer.dribbble.com/
**What it offers:** Access to shots, collections, users

**API Type:** REST API (v2)
**Authentication:** OAuth, API key
**Rate Limits:** Varies by account type

**Note:** Primarily for portfolio content, not structured UI patterns

### Behance API ⭐⭐
**URL:** https://www.behance.net/dev
**What it offers:** Projects, users, collections

**API Type:** REST API
**Rate Limits:** 150 requests/hour
**Status:** Limited functionality

### Unsplash API ⭐⭐⭐⭐
**URL:** https://unsplash.com/developers
**What it offers:** High-quality stock photos

**API Type:** REST API
**Rate Limits:** 50 req/hour (demo), 5000 req/hour (production)
**Use Case:** Placeholder images for mockups

---

## 10. Recommended Stack for AI Agent Design Assistance

Based on this research, here's the recommended stack for an AI agent helping with design decisions:

### For UI Pattern Research:
1. **Figma API** - Access community files and design systems
2. **Urlbox** - Capture competitor screenshots with AI analysis
3. **GPT-4 Vision** - Analyze captured screenshots

### For Component Implementation:
1. **shadcn/ui** - AI-friendly, copy-paste components
2. **Radix UI** - Accessible primitives
3. **Tailwind CSS** - Utility-first styling

### For Design Tokens:
1. **Tokens Studio** - Figma to code pipeline
2. **Style Dictionary** - Token transformation

### For Design System Documentation:
1. **Supernova** - Full API + MCP server
2. **Storybook** - Component documentation

### For Responsive Design:
1. **Tailwind CSS breakpoints** - Programmatic responsive utilities
2. **Screenshot APIs** - Visual testing at different viewports
3. **Figma Variables** - Responsive design tokens

---

## Quick Reference: Platforms with Official APIs

| Platform | API Type | Auth | Best For |
|----------|----------|------|----------|
| Figma | REST | OAuth/Token | Design file access |
| Penpot | REST + MCP | Token | Open-source alternative |
| Dribbble | REST v2 | OAuth | Design inspiration |
| Behance | REST | API Key | Creative portfolios |
| Unsplash | REST | API Key | Stock photos |
| LottieFiles | SDK/CDN | None | Animations |
| Supernova | REST + MCP | API Key | Design system docs |
| Urlbox | REST | API Key | Screenshots + AI |
| Style Dictionary | Node.js | N/A | Token transformation |

---

## Conclusion

**Key Finding:** Most design inspiration platforms (Mobbin, Refero, Page Flows) do **NOT** have public APIs. The best approach for an AI agent is to:

1. Use **Figma API** to access community design files
2. Use **Screenshot APIs** (Urlbox) to capture and analyze competitor UIs
3. Use **GPT-4 Vision** to interpret design patterns from screenshots
4. Use **Component Libraries** (Radix, shadcn) with well-documented programmatic APIs
5. Use **Supernova MCP** for design system context

The landscape is shifting toward MCP (Model Context Protocol) servers for AI integration, with Figma and Supernova leading in 2025.

---

## Sources

- [Figma Developer Docs](https://developers.figma.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Supernova Developers](https://developers.supernova.io/)
- [LottieFiles Developer Portal](https://developers.lottiefiles.com/)
- [Tokens Studio Documentation](https://docs.tokens.studio/)
- [Style Dictionary](https://styledictionary.com/)
- [OpenAI Vision Guide](https://platform.openai.com/docs/guides/vision)
- [Penpot MCP Server](https://github.com/montevive/penpot-mcp)
- [Dribbble API](https://developer.dribbble.com/v2/)
- [Unsplash API](https://unsplash.com/developers)
- [Urlbox](https://urlbox.com/)
- [Product Hunt](https://www.producthunt.com/)
- [AlternativeTo - Mobbin Alternatives](https://alternativeto.net/software/mobbing-design/)
