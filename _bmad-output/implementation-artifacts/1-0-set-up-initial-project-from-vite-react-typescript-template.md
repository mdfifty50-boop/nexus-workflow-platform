# Story 1.0: Set Up Initial Project from Vite + React + TypeScript Template

## Story Information
- **Epic:** 1 - Foundation - User Authentication & Profiles
- **Story ID:** 1.0
- **Status:** in-progress
- **Created:** 2026-01-07

## User Story
As a developer,
I want to initialize the Nexus project from the Vite + React + TypeScript starter template,
So that we have a fast, modern frontend foundation with mobile-first optimization.

## Acceptance Criteria

### AC1: Vite Project Creation
- [x] Project created with `npm create vite@latest nexus -- --template react-ts`
- [x] React 18.x installed
- [x] TypeScript 5.x configured
- [x] Vite 5.x as build tool
- [x] ESLint configuration present
- [x] Default project structure (src/, public/, index.html)

### AC2: Tailwind CSS Configuration
- [x] Tailwind CSS 3.x installed
- [x] tailwind.config.js with mobile-first breakpoints (375px, 768px, 1024px)
- [x] PostCSS configuration
- [x] Tailwind directives in main CSS file

### AC3: shadcn/ui Setup
- [x] shadcn/ui CLI initialized
- [x] components.json configuration file
- [x] lib/utils.ts for cn() helper
- [x] Initial components directory structure

### AC4: Development Server
- [x] `npm run dev` starts successfully
- [x] App renders without errors on localhost:5173

### AC5: Git Repository
- [x] .gitignore configured (node_modules, dist, .env)
- [x] Initial commit with descriptive message

## Technical Notes
- Using Vite for fast HMR and optimized builds
- Tailwind for utility-first CSS with mobile-first design
- shadcn/ui for accessible, customizable React components
- TypeScript for type safety

## Dependencies
- None (this is the foundation story)

## Definition of Done
- [x] All acceptance criteria met
- [x] Development server runs without errors
- [x] Code committed to repository
