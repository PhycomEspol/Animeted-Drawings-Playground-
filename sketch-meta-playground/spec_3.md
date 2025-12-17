# PhyCom Playground Frontend + Listener Notifications (React + SSE)

## Goal
Create a React “playground” UI that displays a live gallery/feed of generated outputs (gif/webp/png) created by the existing writer backend. The UI must:
1) Load all existing items on startup.
2) Receive real-time notifications when the listener backend detects a Firestore change (specifically when `outputPath` changes).
3) Update the UI by adding/upserting the new item in the gallery without page refresh.

## Current state assumptions
- A **listener backend** already exists:
  - Connects to Firestore Emulator
  - Subscribes to collection: `phycom_draws`
  - Detects when `outputPath` changes
  - Executes an existing use case method when that happens
- A **writer backend** already exists:
  - Generates the output file (gif/webp/png) and stores it on disk
  - Writes Firestore docs to `phycom_draws`, including `outputPath`
  - Serves output files via HTTP (preferred), or at least provides a URL field in Firestore

## Required work
1) Add a real-time notification channel from listener backend to the React frontend.
2) Build a new React frontend project that consumes:
   - Initial list endpoint from listener backend
   - Real-time notification stream from listener backend

---

## Decision: Streaming approach
Use **Server-Sent Events (SSE)** for pushing updates from listener backend to the frontend.

Why SSE:
- One-way server → client notifications (exactly our need)
- Very simple implementation (HTTP streaming)
- Automatic reconnect behavior in browsers
- No extra client libraries needed

---

## Data contract (Firestore)
Collection: `phycom_draws`

Documents must contain at minimum:
- `outputPath: string | null`

Preferably also present (if not available, listener computes from outputPath):
- `outputUrl: string` (HTTP URL to display in frontend)
- `createdAt: number`
- `updatedAt: number`
- `status: "running" | "done" | "error"`

Listener must NOT require extra fields; it should handle missing ones gracefully.

---

## Listener backend: minimal additions
Keep the existing Firestore subscription logic and use case execution as-is.
Add only:
1) An HTTP API to fetch current items for initial frontend load
2) An SSE endpoint to push notifications to connected frontends
3) (Optional) An endpoint to force a “rebuild” (execute use case across existing docs)

### Listener backend endpoints
Base URL: `http://localhost:4001` (example; configurable)

#### 1) GET /api/draws
Returns the current set of draw documents that have `outputPath` set.
- Response: JSON array, newest-first
- Item shape (`DrawItem`):
  - `id: string`
  - `outputPath: string`
  - `outputUrl: string` (if not in Firestore, compute deterministically)
  - `createdAt?: number`
  - `updatedAt?: number`
  - `status?: string`

Sorting: descending by `updatedAt` or `createdAt` (fallback).

#### 2) GET /api/stream (SSE)
- Content-Type: `text/event-stream`
- Keeps connection open and emits events whenever listener detects `outputPath` changed and use case succeeded.
- Event name: `draw_updated`
- Event data JSON: `DrawItem` (same shape as above)

Must support multiple concurrent clients.
Must implement keepalive ping (e.g., every 20–30 seconds) to prevent idle disconnects:
- event: `ping`
- data: `{ t: <timestamp> }`

#### 3) POST /api/rebuild (Optional but recommended)
Triggers a one-time scan of existing docs with `outputPath` and runs the use case for any doc that is “not processed” (if idempotency exists), or just re-emits SSE events for all current docs.
- Response: `{ processedCount: number }`

---

## Listener backend: SSE implementation requirements
- Maintain an in-memory set/list of connected SSE clients (response objects).
- On a Firestore-triggered change:
  - Build `DrawItem`
  - Broadcast to all clients via SSE:
    - `event: draw_updated`
    - `data: <JSON string>`
- Handle disconnect:
  - remove client from list on `req.on("close")`

CORS:
- Allow frontend origin (http://localhost:5173 or http://localhost:3000) to call /api/draws and /api/rebuild.
- SSE should work cross-origin if CORS headers are set properly.

---

## Asset URL strategy (must be explicit)
The frontend needs a displayable URL (`outputUrl`).
Preferred approach:
- The writer backend already serves static outputs, e.g.:
  - `http://localhost:3000/files/outputs/<filename>`
- Listener returns the URL either from Firestore `outputUrl`, or constructs it from:
  - `WRITER_ASSETS_BASE_URL` env var + filename derived from outputPath
Example:
- `WRITER_ASSETS_BASE_URL=http://localhost:3000/files/outputs`
- If `outputPath` ends with `abc123.webp`, outputUrl becomes:
  - `${WRITER_ASSETS_BASE_URL}/abc123.webp`

Add env var:
- `WRITER_ASSETS_BASE_URL` (required for computed URLs)

---

## New React frontend project: phycom-playground
Create a React app that:
1) On mount:
   - fetches initial list from listener: `GET /api/draws`
   - dispatches `LOAD_INITIAL`
2) Opens SSE connection to `GET /api/stream`
   - on `draw_updated`, dispatch `UPSERT_DRAW`
   - on errors, show “Disconnected, retrying…” and allow browser auto-reconnect
3) Renders a responsive grid gallery of outputs, newest-first.

### Frontend state management
Use React `useReducer` (no Redux).
Actions:
- `LOAD_INITIAL(draws: DrawItem[])`
- `UPSERT_DRAW(draw: DrawItem)`
- `SET_CONNECTION_STATUS(status: "connected" | "disconnected")`

Deduplicate by `id`.
Keep array sorted by `updatedAt || createdAt || 0` descending.

### Frontend UI requirements
- File preview:
  - If outputUrl ends with `.webm` or `.mp4`, render `<video controls loop />`
  - Else render `<img />`
- Each card shows:
  - preview
  - `id`
  - timestamp
  - link “Open asset” (target=_blank)
- Top bar shows connection status.
- Button “Rebuild”:
  - calls `POST /api/rebuild`
  - then refetch `GET /api/draws` to rehydrate

### Config
Use `.env` (Vite style) for listener base URL:
- `VITE_LISTENER_BASE_URL=http://localhost:4001`
All calls use this base URL.

---

## Local development
Processes:
1) Firestore emulator (already used by writer/listener)
2) Writer backend (serves assets)
3) Listener backend (API + SSE)
4) React frontend

Provide README(s) with exact commands and ports.

---

## Acceptance criteria
- Start listener backend and React frontend.
- Frontend loads existing docs (with outputPath) and renders them.
- When a new output is generated (Firestore doc outputPath changes), frontend updates in real time via SSE and renders the new output.
- No page refresh required.
- Works entirely local with Firestore emulator and local asset serving.
