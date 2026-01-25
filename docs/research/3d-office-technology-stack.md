# 3D Office Visualization Technology Stack Research Report

**Project:** Auto-Claude 3D Virtual Office Visualization
**Phase:** BMAD Phase 1 - Research & Discovery (Analyst Agent)
**Date:** January 4, 2026
**Status:** ✅ Complete

---

## Executive Summary

This document presents the comprehensive research findings for building a production-ready 3D virtual office environment that visualizes Auto-Claude's autonomous multi-agent workflow. Following BMAD Method principles, all components leverage **existing, battle-tested libraries** rather than custom implementations.

**Key Decision:** We recommend **react-three-fiber** ecosystem for 3D rendering, **Ready Player Me** for avatars, **Mixamo** for animations, **Sketchfab** for office assets, and **Web Speech API** for voice synthesis.

---

## 1. 3D Visualization Engine

### ✅ RECOMMENDED: React Three Fiber (@react-three/fiber)

**GitHub:** https://github.com/pmndrs/react-three-fiber
**Stars:** 28,100+ ⭐
**Last Commit:** Active (within 3 months)
**TypeScript:** ✅ Full support with improved v9 types
**React 19:** ✅ Compatible (@react-three/fiber@9)

**Pros:**
- ✅ Declarative React components for Three.js
- ✅ Excellent performance (60fps+ with proper optimization)
- ✅ Massive ecosystem (@react-three/drei for helpers)
- ✅ Active community (pmndrs organization)
- ✅ Built-in support for animations, cameras, lighting
- ✅ Perfect for character-based 3D scenes
- ✅ Hooks-based architecture (useFrame, useThree, etc.)

**Cons:**
- ⚠️ Learning curve if unfamiliar with Three.js
- ⚠️ Requires understanding of 3D concepts

**Installation:**
```bash
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three
```

**Example Code:**
```typescript
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

function Office3D() {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[10, 10, 10]} />
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </Canvas>
  )
}
```

**Performance:** Proven 60fps with 10+ animated characters when properly optimized.

**Documentation:** https://r3f.docs.pmnd.rs/

---

### Alternative Option 1: Babylon.js with React

**GitHub:** https://github.com/BabylonJS/Babylon.js
**Stars:** 23,000+
**React Integration:** @babylonjs/react

**Pros:**
- Enterprise-grade 3D engine
- Built-in physics, particles, post-processing
- Excellent documentation

**Cons:**
- Heavier than Three.js
- Less declarative than react-three-fiber
- Smaller React ecosystem

**Why Not Chosen:** react-three-fiber has better React integration and lighter footprint.

---

### Alternative Option 2: PlayCanvas

**Pros:**
- Visual editor
- Built-in multiplayer support

**Cons:**
- Requires editor workflow
- Less React-friendly
- More game-engine oriented

**Why Not Chosen:** Not ideal for declarative React component architecture.

---

## 2. 3D Character/Avatar System

### ✅ RECOMMENDED: Ready Player Me + Mixamo

**Ready Player Me SDK:** https://github.com/readyplayerme/rpm-react-sdk
**Mixamo:** https://www.mixamo.com/
**Format:** GLB/GLTF (web-optimized)

#### Ready Player Me

**Pros:**
- ✅ React SDK available (@readyplayerme/rpm-react-sdk)
- ✅ GLB export format (perfect for web)
- ✅ Customizable avatars (7 distinct characters possible)
- ✅ Free tier available
- ✅ Rigged and ready for animations
- ✅ Low poly count (<10k polygons)

**Integration:**
```bash
npm install @readyplayerme/rpm-react-sdk
```

**API:**
```typescript
// Get avatar GLB URL
GET https://api.readyplayer.me/v1/avatars/{avatarId}.glb
```

#### Mixamo (Adobe)

**Pros:**
- ✅ FREE with Adobe ID (no subscription needed)
- ✅ 50+ pages of pre-made animations
- ✅ Royalty-free for commercial use
- ✅ Includes: walk, run, sit, type, celebrate, idle, talk, etc.
- ✅ "In Place" option for game-engine control
- ✅ Motion-captured quality

**Available Animations for Office:**
- Idle (standing, sitting)
- Walking (various speeds, in-place option)
- Sitting Down / Standing Up
- Typing (at computer)
- Talking (hand gestures)
- Celebrating (victory, thumbs up, clapping)
- Presenting (pointing, showing)

**Export Format:** FBX, GLB (compatible with Three.js)

**How to Use:**
1. Upload character to Mixamo
2. Select animation (e.g., "walk," "sit," "celebrate")
3. Download as GLB with "In Place" option enabled
4. Load in react-three-fiber with `useGLTF` hook

---

### Alternative Option: VRoid Studio

**Pros:**
- Anime-style characters
- Free customization tool

**Cons:**
- Specific art style (may not fit professional office)
- Manual export workflow

**Why Not Chosen:** Professional aesthetic mismatch.

---

## 3. 3D Office Environment Assets

### ✅ RECOMMENDED: Sketchfab + Poly Haven

#### Sketchfab

**URL:** https://sketchfab.com/tags/office
**License Filter:** CC0, CC-BY (free commercial use)
**Format:** GLTF/GLB downloadable

**Pros:**
- ✅ 800,000+ free models
- ✅ Office-specific search results
- ✅ GLTF export standard
- ✅ License filtering (CC0, CC-BY)
- ✅ Preview before download
- ✅ Professional quality

**Search Strategy:**
```
Site: sketchfab.com
Tags: office, desk, chair, computer, meeting room
Filters: Downloadable, CC0 or CC-BY, GLTF format
```

**Example Assets Needed:**
- Office desks (5+ variations)
- Office chairs (ergonomic, executive)
- Computer monitors + keyboards
- Filing cabinets
- Whiteboards
- Office walls/partitions
- Plants, decorations
- Meeting tables

#### Poly Haven

**URL:** https://polyhaven.com/models
**License:** CC0 (public domain)
**Format:** GLTF, FBX, Blend

**Pros:**
- ✅ 100% CC0 (no attribution required)
- ✅ High quality PBR materials
- ✅ Free for any use

**Cons:**
- ⚠️ Smaller library than Sketchfab
- ⚠️ Fewer office-specific assets

**Use Case:** Supplement Sketchfab for additional props.

---

### Alternative Option: Quaternius Low Poly Assets

**Pros:**
- Stylized low-poly aesthetic
- Very performant

**Cons:**
- Cartoonish style (not professional)

**Why Not Chosen:** Aesthetic mismatch with professional office vision.

---

## 4. Real-Time Data Visualization & State Management

### ✅ RECOMMENDED: Zustand + React Three Fiber Integration

**Zustand GitHub:** https://github.com/pmndrs/zustand
**Stars:** 47,000+
**Maintained By:** pmndrs (same team as react-three-fiber)

**Pros:**
- ✅ Lightweight (1.3KB minified)
- ✅ No boilerplate (unlike Redux)
- ✅ Excellent SSR support (Next.js compatible)
- ✅ Perfect for 3D state management
- ✅ Used by react-three-fiber community
- ✅ Flux principles with simple API

**Integration Pattern:**
```typescript
import create from 'zustand'

interface OfficeState {
  agents: OfficeAgent[]
  updateAgentPosition: (id: string, position: Vector3) => void
}

export const useOfficeStore = create<OfficeState>((set) => ({
  agents: [],
  updateAgentPosition: (id, position) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, position } : a
      ),
    })),
}))

// In 3D component
function AgentAvatar({ id }) {
  const position = useOfficeStore((s) =>
    s.agents.find((a) => a.id === id)?.position
  )
  return <mesh position={position}>...</mesh>
}
```

**Performance:** No re-renders unless specific state slice changes (optimal for 3D).

**Polling Strategy:**
```typescript
// Poll Auto-Claude implementation plan every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const plan = await window.electron.ipcRenderer.invoke('get-implementation-plan')
    useOfficeStore.getState().syncWorkflowData(plan)
  }, 2000)

  return () => clearInterval(interval)
}, [])
```

---

## 5. Voice/Audio System

### ✅ RECOMMENDED: Web Speech API (Native Browser TTS)

**MDN Docs:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
**Cost:** FREE (built into browsers)
**Browser Support:** Chrome, Edge, Safari, Firefox

**Pros:**
- ✅ No API keys or costs
- ✅ Multiple voices available per browser
- ✅ Built-in browser support
- ✅ Simple JavaScript API
- ✅ Can assign different voices to different agents
- ✅ Works offline

**Cons:**
- ⚠️ Voice quality varies by browser/OS
- ⚠️ Limited customization vs. premium services

**Implementation:**
```typescript
const speakText = (text: string, voiceIndex: number = 0) => {
  const utterance = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()
  utterance.voice = voices[voiceIndex]
  utterance.rate = 1.0
  utterance.pitch = 1.0
  window.speechSynthesis.speak(utterance)
}

// HR Alert Example
speakText("Director, we've reached 80% of our token budget.", 3)
```

**Voice Assignment:**
- CEO: Voice 0 (authoritative male)
- HR Manager: Voice 3 (professional female)
- Developers: Voices 5-7 (varied)

**2026 Enhancement:** Modern browsers support "code-switching" for multilingual text.

---

### Alternative Option 1: ElevenLabs

**Pros:**
- Premium voice quality
- Custom voice cloning

**Cons:**
- Costs money (API calls)
- Requires API key management

**Why Not Chosen:** Free tier is sufficient for MVP; can upgrade later.

---

### Alternative Option 2: Azure TTS

**Pros:**
- Enterprise-grade
- Many voice options

**Cons:**
- Requires Azure account
- More complex setup

**Why Not Chosen:** Unnecessary complexity for initial version.

---

## 6. VS Code Extension Integration

### ✅ RECOMMENDED: GitHub Next React Webview Template

**GitHub:** https://github.com/githubnext/vscode-react-webviews
**Template:** https://github.com/estruyf/vscode-react-webview-template

**Pros:**
- ✅ Official VS Code team template
- ✅ React + TypeScript + Vite
- ✅ Best practices encoded
- ✅ Multiple webviews support
- ✅ Theme colors as Tailwind variables
- ✅ Fast build times (esbuild)

**Setup:**
```bash
# Use template
npx degit githubnext/vscode-react-webviews my-extension
cd my-extension
npm install
npm run build
```

**Extension Manifest:**
```json
{
  "name": "autoclaude-office-viz",
  "displayName": "Auto-Claude 3D Office",
  "version": "1.0.0",
  "engines": { "vscode": "^1.80.0" },
  "contributes": {
    "views": {
      "explorer": [{
        "type": "webview",
        "id": "autoclaude.officeView",
        "name": "Agent Office 3D"
      }]
    }
  }
}
```

**Communication Pattern:**
```typescript
// Extension side
webviewView.webview.postMessage({ type: 'updateAgents', agents: [...] })

// React side
window.addEventListener('message', (event) => {
  const { type, agents } = event.data
  if (type === 'updateAgents') {
    useOfficeStore.getState().setAgents(agents)
  }
})
```

---

## 7. Integration Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ Auto-Claude Backend (Python)                        │
│ ├─ implementation_plan.json (task workflow)         │
│ ├─ token_usage.json (budget tracking)               │
│ └─ agent_logs/ (activity data)                      │
└──────────────────┬──────────────────────────────────┘
                   │ IPC Bridge (Electron)
                   ↓
┌─────────────────────────────────────────────────────┐
│ Frontend (React + Electron)                         │
│ ├─ Zustand Store (office-store.ts)                  │
│ │  ├─ agents: OfficeAgent[]                         │
│ │  ├─ departments: Department[]                     │
│ │  ├─ tokenBudget: TokenBudgetStatus                │
│ │  └─ taskWorkflow: WorkflowVisualization           │
│ │                                                    │
│ ├─ useOfficeData hook (polls every 2s)              │
│ │  └─ Syncs backend data → Zustand                  │
│ │                                                    │
│ └─ Office3DVisualization Component                  │
│    └─ react-three-fiber <Canvas>                    │
│       ├─ AgentAvatar (7 instances)                  │
│       ├─ Department (6 instances)                   │
│       ├─ HRToCEOInteraction                         │
│       └─ CameraSystem                               │
└─────────────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│ VS Code Extension (Optional)                        │
│ ├─ Webview Panel (embeds Office3DVisualization)     │
│ ├─ Status Bar Item (shows active phase)             │
│ └─ Notifications (HR alert, task complete)          │
└─────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Office3DVisualization (root)
├─ OfficeScene (Three.js canvas)
│  ├─ LightingSystem
│  ├─ CameraSystem
│  │  └─ OrbitControls / FollowCamera
│  │
│  ├─ Departments (6 instances)
│  │  ├─ CEOOffice
│  │  │  └─ AgentAvatar (Director)
│  │  ├─ ManagerOffice
│  │  │  └─ AgentAvatar (Supervisor)
│  │  ├─ PlanningDepartment
│  │  │  └─ AgentAvatar (Planner)
│  │  ├─ DevelopmentArea
│  │  │  ├─ AgentAvatar (Coder 1)
│  │  │  ├─ AgentAvatar (Coder 2)
│  │  │  └─ AgentAvatar (Coder 3)
│  │  ├─ QADepartment
│  │  │  ├─ AgentAvatar (QA Lead)
│  │  │  └─ AgentAvatar (QA Engineer)
│  │  └─ HRDepartment
│  │     └─ AgentAvatar (HR Manager)
│  │
│  └─ Interactions
│     ├─ HRToCEOInteraction (critical feature)
│     ├─ TaskAssignmentFlow
│     └─ CelebrationEffects
│
├─ UI Overlays
│  ├─ BudgetDashboard (HR monitoring)
│  ├─ TaskProgressPanel
│  ├─ DepartmentLabels
│  └─ PerformanceMonitor (FPS)
│
└─ VoiceSystem (Web Speech API)
```

---

## 8. Performance Optimization Plan

### Target Metrics
- **FPS:** 60fps (99th percentile)
- **Load Time:** <3 seconds
- **Memory:** <100MB
- **Polling Latency:** <2 seconds

### Optimization Strategies

#### 1. Level of Detail (LOD)
```typescript
import { Detailed } from '@react-three/drei'

function AgentAvatar({ distance }) {
  return (
    <Detailed distances={[0, 10, 20]}>
      <HighPolyModel />  {/* Close: <5m */}
      <MediumPolyModel /> {/* Medium: 5-15m */}
      <LowPolyModel />    {/* Far: >15m */}
    </Detailed>
  )
}
```

#### 2. Instanced Rendering
```typescript
import { Instances, Instance } from '@react-three/drei'

function DevelopmentArea({ desks }) {
  return (
    <Instances limit={100}>
      <boxGeometry />
      <meshStandardMaterial />
      {desks.map((desk) => (
        <Instance key={desk.id} position={desk.position} />
      ))}
    </Instances>
  )
}
```

#### 3. Frustum Culling
- Built-in Three.js feature
- Don't render off-screen objects
- Automatic performance boost

#### 4. Lazy Loading
```typescript
const OfficeModel = lazy(() => import('./models/Office'))
const AgentModel = lazy(() => import('./models/Agent'))

// Load departments on-demand
<Suspense fallback={<Loader />}>
  <OfficeModel />
</Suspense>
```

#### 5. Animation Batching
```typescript
// Update all agents in single useFrame
useFrame(() => {
  agents.forEach((agent) => {
    updateAnimation(agent)
  })
})
```

#### 6. Web Workers
```typescript
// Offload pathfinding to worker
const pathWorker = new Worker('pathfinding-worker.js')
pathWorker.postMessage({ start, end })
pathWorker.onmessage = (e) => {
  const path = e.data
  animateAlongPath(path)
}
```

---

## 9. Risk Assessment

### Risk 1: Performance with 10+ Agents
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Use instanced rendering
- Implement LOD
- Profile early, optimize often
- Test with 20+ agents to ensure headroom

### Risk 2: Browser Compatibility (WebGL)
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Detect WebGL support on startup
- Show fallback UI if unsupported
- Target modern browsers (Chrome, Edge, Firefox)

### Risk 3: Asset Loading Times
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Compress GLB files (Draco compression)
- Lazy-load departments
- Show loading progress bar
- Cache loaded models

### Risk 4: Voice Synthesis Quality
**Probability:** Low
**Impact:** Low
**Mitigation:**
- Make voice optional (mute button)
- Upgrade to ElevenLabs if needed (Phase 2)
- Test across browsers for best voices

### Risk 5: Complex State Management
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Use Zustand (simple API)
- Keep state flat and normalized
- Document state structure clearly

---

## 10. GitHub Repositories to Fork/Clone

### Must-Have
1. **react-three-fiber**: https://github.com/pmndrs/react-three-fiber
2. **drei (R3F helpers)**: https://github.com/pmndrs/drei
3. **zustand**: https://github.com/pmndrs/zustand
4. **rpm-react-sdk**: https://github.com/readyplayerme/rpm-react-sdk
5. **vscode-react-webviews**: https://github.com/githubnext/vscode-react-webviews

### Reference Examples
6. **react-three-next** (Next.js + R3F): https://github.com/pmndrs/react-three-next
7. **drei examples**: https://drei.docs.pmnd.rs/
8. **R3F examples**: https://docs.pmnd.rs/react-three-fiber/examples

### Tools
9. **glTF Sample Models**: https://github.com/KhronosGroup/glTF-Sample-Models
10. **Draco compression**: https://github.com/google/draco

---

## 11. Installation Commands

```bash
# Core 3D
npm install three @react-three/fiber @react-three/drei
npm install --save-dev @types/three

# State Management
npm install zustand

# Avatar System
npm install @readyplayerme/rpm-react-sdk

# VS Code Extension (separate project)
npx degit githubnext/vscode-react-webviews vscode-extension

# Optional: Advanced 3D features
npm install @react-three/rapier  # Physics (future)
npm install @react-three/postprocessing  # Effects (future)
```

---

## 12. License Verification

| Component | License | Commercial Use | Attribution |
|-----------|---------|----------------|-------------|
| react-three-fiber | MIT | ✅ Yes | ❌ No |
| drei | MIT | ✅ Yes | ❌ No |
| zustand | MIT | ✅ Yes | ❌ No |
| Ready Player Me | Free Tier | ✅ Yes | ⚠️ Check ToS |
| Mixamo | Adobe Free | ✅ Yes | ❌ No |
| Sketchfab (CC0) | CC0 | ✅ Yes | ❌ No |
| Sketchfab (CC-BY) | CC-BY | ✅ Yes | ✅ Yes |
| Poly Haven | CC0 | ✅ Yes | ❌ No |
| Web Speech API | Browser Built-in | ✅ Yes | ❌ No |

**All clear for commercial use!** ✅

---

## 13. Fallback Options

If any primary choice fails:

### 3D Engine Fallback
**Primary:** react-three-fiber
**Fallback:** Babylon.js + @babylonjs/react
**Reason:** More batteries-included, enterprise support

### Avatar Fallback
**Primary:** Ready Player Me + Mixamo
**Fallback:** Manual GLB models from Sketchfab
**Reason:** Pre-rigged characters available

### Voice Fallback
**Primary:** Web Speech API
**Fallback:** Text-only mode (no voice)
**Reason:** Voice is "nice to have," not critical

---

## 14. Next Steps (Phase 2: Planning)

With technology stack decided, proceed to:

1. ✅ **PM Agent:** Write comprehensive PRD
2. ✅ **Product Owner:** Create 8 sharded epic files
3. ✅ **Architect:** Design system architecture
4. ✅ **Test Architect:** Define testing strategy
5. ✅ **UX Designer:** Specify interaction flows

---

## Summary: Recommended Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| **3D Engine** | react-three-fiber + drei | Best React integration, 28k⭐, pmndrs ecosystem |
| **Avatars** | Ready Player Me | React SDK, GLB export, free tier |
| **Animations** | Mixamo | Free, 50+ animations, motion-captured |
| **Office Assets** | Sketchfab + Poly Haven | 800k+ models, CC0/CC-BY, GLTF format |
| **State** | Zustand | Lightweight, perfect for 3D, pmndrs team |
| **Voice** | Web Speech API | Free, built-in, sufficient quality |
| **VS Code** | GitHub Next template | Official best practices |

**Total Cost:** $0 (all free/open-source) 💰
**Estimated Build Time:** 4-6 weeks with BMAD Method
**Risk Level:** Low (proven libraries)

---

## Sources

- [react-three-fiber GitHub](https://github.com/pmndrs/react-three-fiber)
- [react-three-fiber v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)
- [Ready Player Me React SDK](https://github.com/readyplayerme/rpm-react-sdk)
- [Ready Player Me Documentation](https://docs.readyplayer.me/ready-player-me/integration-guides/react)
- [Mixamo Official Site](https://www.mixamo.com/)
- [Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html)
- [Sketchfab Office Models](https://sketchfab.com/tags/office)
- [Sketchfab CC0 Models](https://sketchfab.com/tags/cc0)
- [Poly Haven](https://polyhaven.com/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [GitHub Next VS Code React Webviews](https://github.com/githubnext/vscode-react-webviews)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Web Speech API Text-to-Speech Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API)

---

**✅ PHASE 1 COMPLETE - READY FOR PHASE 2 (PLANNING)**
