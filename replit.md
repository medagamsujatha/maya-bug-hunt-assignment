# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite (artifacts/maya-bughunt)

## Artifacts

### Maya Bug Hunt Tracker (`artifacts/maya-bughunt`)
- **Purpose**: A personal bug tracking tool for the Maya "Bug Hunt" open application challenge. Helps testers document, organize, and track bug reports while testing a Next.js e-commerce app.
- **Preview path**: `/` (root)
- **Key pages**: Dashboard, Bug List, New Bug, Bug Detail, Edit Bug
- **Features**: Bug CRUD with categories, severity ratings, status tracking, reward progress tracker (10 qualifying bugs for free gift)
- **Google Form URL**: https://forms.gle/hKJvPS6cnwzhDL986

### API Server (`artifacts/api-server`)
- **Purpose**: Express 5 REST API serving bug data
- **Routes**: `/api/bugs`, `/api/bugs/:id`, `/api/bugs/stats/summary`, `/api/bugs/stats/recent`

## Database Schema

### `bugs` table
- `id` (serial PK), `title`, `category`, `severity`, `status`
- `environment`, `steps_to_reproduce`, `expected_behaviour`, `actual_behaviour`
- `root_cause`, `suggested_fix`, `submitted_to_form`, `form_submission_url`
- `created_at`, `updated_at`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
