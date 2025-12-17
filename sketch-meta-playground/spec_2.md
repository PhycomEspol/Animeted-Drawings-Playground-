# Firestore Listener Service (Local POC)
A standalone Node.js service that subscribes to a Firestore Emulator collection and triggers a use case when `outputPath` changes.

---

## Goal
Create a separate Node.js project (independent from the Playwright backend) that:

1. Connects to **Firestore Emulator only** (no cloud credentials, no GCP service accounts).
2. Subscribes to the Firestore collection: **`phycom_draws`**.
3. Listens only to documents where **`outputPath` is set** (Pattern A).
4. Triggers a **use case method** when `outputPath` **changes** (not on initial boot snapshot).
5. Provides a robust option to avoid duplicate processing across restarts by writing an idempotency marker back to the document (recommended).
6. Runs continuously as a local “listener daemon” for a full-day demo.

---

## Non-goals
- Do not deploy to Cloud Functions or GCP.
- Do not require Firebase Auth or user login.
- Do not process binary files in Firestore (metadata only).
- Do not implement advanced job queues; keep it simple and stable.

---

## Tech Stack
- Node.js (TypeScript preferred).
- Firestore via `firebase-admin`.
- Environment management via `dotenv`.

---

## Project Structure
Create a repo folder like:

/phycom-firestore-listener
/src
index.ts
firestore.ts
listener.ts
usecase.ts
types.ts
package.json
tsconfig.json
.env.example
README.md
.gitignore


---

## Environment Variables
The service must support Firestore Emulator via env vars:

- `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
- `GCLOUD_PROJECT=phycom-local`

Provide `.env.example` with these values.

Notes:
- The code must not crash if `.env` is missing; it should still use defaults.
- `projectId` must match the writer app’s emulator project.

---

## Firestore Data Model
Collection: `phycom_draws`

Expected fields (minimum):
- `outputPath`: string | null
Optional:
- `outputProcessedPath`: string | null
- `outputProcessedAt`: number | null
- `updatedAt`: number | null

The listener should not assume extra fields exist.

---

## Listening Requirements
### Query (Pattern A)
Subscribe to documents where `outputPath` exists:
- Primary query: `where("outputPath", "!=", null)`
- If `outputPath` is a string, optionally allow: `where("outputPath", ">", "")`

### Trigger Logic
Trigger the use case only when `outputPath` changes:
- Do NOT trigger for initial snapshot documents on boot.
- Do trigger for modifications where `outputPath` differs from the last seen value.

### Reliability / Idempotency (Recommended)
Support an idempotent mode that prevents duplicate processing across restarts:

- If `outputPath === outputProcessedPath`: do nothing.
- Else:
  1) run use case
  2) update document:
     - `outputProcessedPath = outputPath`
     - `outputProcessedAt = Date.now()`

This ensures the use case runs at most once per new outputPath value.

Provide a flag to toggle idempotency:
- env var: `IDEMPOTENT_MODE=true|false` (default true)

---

## Use Case Contract
Create `usecase.ts` exporting a function/class:

- `execute(params)`
  - `docId: string`
  - `outputPath: string`
  - `data: Record<string, any>`

For the POC, the use case can:
- log to console
- optionally simulate an API call (stubbed function)
Do not require external services.

---

## Logging & Observability
- On startup, log:
  - projectId
  - emulator host
  - query description
  - idempotent mode state
- On each trigger:
  - docId
  - old outputPath (if available)
  - new outputPath
- On errors:
  - log error
  - keep process alive unless it is a fatal initialization error

---

## Runtime Behavior
- Must run indefinitely (like a daemon).
- Must handle Firestore listener errors:
  - log and exit with non-zero code on fatal errors (acceptable for POC)
- Concurrency:
  - process changes sequentially (await each use case call) to avoid race conditions.

---

## Implementation Details
### firestore.ts
- Initialize `firebase-admin` with local project id:
  - `admin.initializeApp({ projectId })`
- Export `db = admin.firestore()`

### listener.ts
- Build query for `phycom_draws` where `outputPath != null`.
- Maintain a `Map<string, string|null>` cache for last-seen outputPath:
  - Fill cache on first sight (do not trigger)
  - Trigger only on change for docs already seen
- If idempotent mode:
  - ignore cache and instead compare `outputProcessedPath` with `outputPath`
  - after successful use case, write processed markers back

### index.ts
- Load env with dotenv
- Start listener

---

## Package Scripts
In `package.json`, include:
- `dev`: run with ts-node or tsx (preferred)
- `build`: tsc compile
- `start`: node dist/index.js

Example:
- `"dev": "tsx watch src/index.ts"`
- `"build": "tsc -p tsconfig.json"`
- `"start": "node dist/index.js"`

---

## README.md requirements
Include:
1. Prerequisites (Node 18+ recommended, Firebase emulator running).
2. How to run Firestore emulator (remind that writer project must start it).
3. Install and run:
   - `npm install`
   - `cp .env.example .env`
   - `npm run dev`
4. How to test:
   - Create/update a document in `phycom_draws` with `outputPath`
   - Confirm listener logs and updates `outputProcessedPath` (if enabled)
5. Troubleshooting:
   - wrong `GCLOUD_PROJECT`
   - emulator not running
   - missing env vars

---

## Acceptance Criteria
- Running `npm run dev` starts a listener that connects to Firestore Emulator.
- When a doc in `phycom_draws` gains or changes `outputPath`, the use case runs exactly once per new outputPath value (in idempotent mode).
- On service restart, previously processed outputPaths are not re-processed.
- No cloud credentials required.

---

## Deliverables
Generate all files and code needed for a working project:
- TypeScript source files as described
- package.json + scripts
- tsconfig.json
- .env.example
- README.md
- .gitignore
