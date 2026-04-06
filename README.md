# AI Crossing

A browser-based pixel art village simulation with AI-powered villagers.

6–12 villagers live on a small map, following schedules, socializing, and responding to the player — with dialogue powered by a local LLM via LM Studio.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4
- **Rendering**: PixiJS v8 — procedural pixel-art-style tile map
- **State**: Zustand for client game state
- **AI**: LM Studio (local LLM) with provider abstraction for OpenAI-compatible endpoints
- **Database**: PostgreSQL via Drizzle ORM
- **Monorepo**: Turborepo + pnpm workspaces

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- [LM Studio](https://lmstudio.ai/) installed and running with the local server enabled
- PostgreSQL (optional — needed for persistence features)

### Setup

```bash
# Install dependencies
pnpm install

# Start LM Studio local server and load a chat model
# Example local server: http://127.0.0.1:1234

# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the village.

### Controls

- **Click** a villager to select and inspect them
- **Drag** to pan the map
- **Scroll** to zoom
- **Pause / 1x / 4x / 16x** speed controls in the header
- **Debug** button toggles the debug overlay
- **Chat** panel appears when a villager is selected (requires LM Studio local server running)
- Inspector page at [/inspector](http://localhost:3000/inspector) for debug tools

## Project Structure

```
apps/
  web/          Next.js frontend + game rendering
  worker/       Simulation worker (AI job processing)
packages/
  shared/       Types, schemas, constants
  ai/           LLM provider abstraction + prompts + memory
  simulation/   Pathfinding, utility scoring, schedule templates
  db/           Drizzle ORM schema
tools/
  seed/         Seed data for development
```

## Architecture

The simulation uses a tiered AI system:

1. **Deterministic** (every tick): needs decay, pathfinding, schedule following
2. **Lightweight decisions** (periodic): utility-scored action selection
3. **LLM calls** (on demand): dialogue, reactions, daily plans, memory summarization

## Environment Variables

Copy `.env.local` and configure:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_crossing
REDIS_URL=redis://localhost:6379
LMSTUDIO_URL=http://127.0.0.1:1234
AI_PROVIDER=lmstudio
LMSTUDIO_MODEL=default
```

## Villagers

| Name   | Job        | Personality                  |
|--------|------------|------------------------------|
| Maple  | Baker      | Cheerful, talkative          |
| Jasper | Farmer     | Quiet, hardworking           |
| Luna   | Shopkeeper | Witty, curious, gossip-prone |
| Rowan  | Carpenter  | Gruff, loyal, practical      |
| Sage   | Herbalist  | Gentle, mystical             |
| Felix  | Musician   | Playful, dramatic, night-owl |
