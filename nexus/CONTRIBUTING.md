# Contributing to Nexus

Thank you for your interest in contributing to Nexus! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style Guide](#code-style-guide)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Git

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/nexus.git
   cd nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

---

## Development Setup

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:server` | Start backend server |
| `npm run dev:all` | Start both frontend and backend |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |

### IDE Setup

**VS Code (Recommended)**

Install these extensions:
- ESLint
- Prettier
- TypeScript and JavaScript
- Tailwind CSS IntelliSense

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Code Style Guide

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface UserProfile {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<UserProfile> {
  // ...
}

// Avoid
type UserProfile = {
  id: any
  name: any
}
```

### React Components

- Use functional components with hooks
- Use named exports (not default exports)
- Keep components focused and small
- Extract complex logic into custom hooks

```typescript
// Good
export function WorkflowCard({ workflow, onClick }: WorkflowCardProps) {
  const { isLoading, execute } = useWorkflowExecution(workflow.id)

  return (
    <div className="..." onClick={onClick}>
      {/* ... */}
    </div>
  )
}

// Avoid
export default function(props) {
  // ...
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `WorkflowCanvas.tsx` |
| Hooks | camelCase with `use` prefix | `useWorkflow.ts` |
| Utilities | camelCase | `api-client.ts` |
| Types | PascalCase | `WorkflowTypes.ts` |
| Tests | `.test.ts` suffix | `api-client.test.ts` |

### CSS / Tailwind

- Use Tailwind utility classes
- Extract repeated patterns to components
- Use CSS variables for theme values
- Follow mobile-first responsive design

```tsx
// Good - using Tailwind utilities
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg">
  Click Me
</button>

// Good - extracting to component for reuse
<Button variant="primary" size="md">
  Click Me
</Button>
```

### Import Order

1. React/external packages
2. Internal aliases (@/...)
3. Relative imports
4. Type imports

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'

import { WorkflowCard } from './WorkflowCard'

import type { Workflow } from '@/types'
```

---

## Project Structure

```
nexus/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Base UI components (button, input, etc.)
│   │   ├── error-boundaries/ # Error boundary components
│   │   ├── mobile/           # Mobile-specific components
│   │   └── icons/            # Icon components
│   ├── contexts/             # React context providers
│   ├── lib/                  # Utilities and services
│   ├── pages/                # Route-level page components
│   ├── services/             # Business logic services
│   ├── types/                # TypeScript type definitions
│   ├── App.tsx               # Main app component
│   └── main.tsx              # Entry point
├── tests/
│   └── e2e/                  # Playwright E2E tests
├── api/                      # Vercel serverless functions
├── public/                   # Static assets
├── docs/                     # Documentation
└── package.json
```

### Key Directories

- **components/**: Reusable UI components, organized by feature
- **contexts/**: React context providers for global state
- **lib/**: Utility functions, API clients, helpers
- **pages/**: Top-level route components
- **services/**: Business logic, API integrations

---

## Making Changes

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions/changes

Examples:
```
feature/workflow-templates
fix/infinite-loop-achievement
refactor/api-client-error-handling
docs/api-documentation
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Examples:
```
feat(workflow): add template marketplace

fix(chat): prevent infinite loop in useAISuggestions hook

docs(api): update API documentation with new endpoints

refactor(auth): simplify authentication flow
```

---

## Testing

### Unit Tests

Write unit tests for utilities and hooks:

```typescript
// src/lib/validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateEmail } from './validation'

describe('validateEmail', () => {
  it('should return true for valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true)
  })

  it('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false)
  })
})
```

Run tests:
```bash
npm test
npm run test:watch
npm run test:coverage
```

### E2E Tests

Write E2E tests for critical user flows:

```typescript
// tests/e2e/workflow.spec.ts
import { test, expect } from '@playwright/test'

test('user can create a workflow', async ({ page }) => {
  await page.goto('/workflows')
  await page.click('button:has-text("Create Workflow")')
  await page.fill('input[name="name"]', 'Test Workflow')
  await page.click('button:has-text("Save")')
  await expect(page.locator('text=Test Workflow')).toBeVisible()
})
```

Run E2E tests:
```bash
npm run test:e2e
npm run test:e2e:ui      # With visual UI
npm run test:e2e:headed  # With browser window
```

### Testing Guidelines

1. Test behavior, not implementation
2. Write tests for critical paths
3. Mock external dependencies
4. Use meaningful test descriptions
5. Keep tests independent

---

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

3. **Test manually**
   - Start dev server
   - Test the feature/fix
   - Check for console errors
   - Verify on mobile viewport

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed code
- [ ] Documentation updated
- [ ] No console errors
```

### Review Process

1. Create PR against `main` branch
2. Fill out PR template
3. Request review from team members
4. Address feedback
5. Squash and merge once approved

---

## Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Add TypeScript types
3. Add to component index if applicable
4. Add documentation to COMPONENTS.md

```typescript
// src/components/NewComponent.tsx
export interface NewComponentProps {
  title: string
  onAction?: () => void
}

export function NewComponent({ title, onAction }: NewComponentProps) {
  return (
    <div className="...">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  )
}
```

### Adding a New API Endpoint

1. Create handler in `api/` directory
2. Add types to `src/lib/api-client.ts`
3. Add method to API client
4. Update API.md documentation

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Add navigation links if needed
4. Update any relevant docs

### Fixing a Bug

1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify test passes
4. Document the fix in commit message

---

## Getting Help

- Check existing documentation in `/docs`
- Search existing issues and PRs
- Ask in team chat/discussions
- Create an issue for bugs or feature requests

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow project guidelines

Thank you for contributing to Nexus!
