# Nexus Project - Claude Code Configuration

**This is the main Nexus application directory.**

## Autonomous Mode Active

This project operates under FULLY AUTONOMOUS MODE as defined in the parent CLAUDE.md.
All agents have full read/write/execute permissions on all files in this directory.

## Key Directories

- `src/` - Frontend React application
- `server/` - Backend Express server
- `config/` - Runtime configuration files
- `scripts/` - Zero-token PowerShell scripts

## Protected Files (Use Edit, Not Write)

See `FIX_REGISTRY.json` for the full list of 110+ protected fix markers.
Critical files: `WorkflowPreviewCard.tsx`, `ChatContainer.tsx`, `agents/index.ts`

## Build & Dev Commands

- `npm run dev` - Start Vite dev server (default port 5173)
- `npm run build` - TypeScript + Vite production build
- `npm run dev:all` - Start frontend + backend together

## Feature Management (When Available)

When feature management tools are loaded:
- `feature_create` - Add features to backlog
- `feature_get_stats` - Check completion progress
- `feature_get_next` - See next pending feature
