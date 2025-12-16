# POC: Meta Sketch Automation Service (Node.js + Playwright + Firestore Emulator + Simple Frontend)

## Goal
Build a local-only POC that:
1) Provides a simple web UI with a button to upload an image (PNG recommended).
2) Sends the image to a Node.js backend.
3) Backend runs Playwright (headless) to automate:
   - open https://sketch.metademolab.com/canvas
   - upload the image
   - select one of the 4 demos (configurable)
   - capture a rendered result (start with a screenshot of the animation area)
4) Store:
   - the input image file
   - the output image file
   - metadata (status, timestamps, file paths/URLs)
   in a LOCAL Firestore emulator (no cloud).
5) Return the output to the UI (or show a link to download).

This is an all-day demo POC; it must run on-demand and never keep Playwright running idle.

---

## Tech constraints
- Backend: Node.js (TypeScript preferred).
- Automation: Playwright.
- Database: Firestore Emulator (Firebase Emulator Suite) ONLY.
- Storage: local filesystem for binary files; Firestore stores metadata + file paths.
- Frontend: minimal (plain HTML + JS) is acceptable; keep it simple.

---

## Architecture
### Request flow (synchronous)
1) User uploads image from UI → `POST /api/render` (multipart/form-data).
2) API:
   - writes input file to `/storage/inputs/<id>.png`
   - creates Firestore doc `renders/<id>` = `{ status: "running", ... }`
   - runs Playwright job (headless, single-run)
   - saves output to `/storage/outputs/<id>.png`
   - updates Firestore doc to `{ status: "done", outputPath, outputUrl }`
   - returns JSON `{ id, outputUrl }`
3) UI displays the output image and a “download” link.

### No parallelism
- Ensure only one render runs at a time via an in-memory mutex (single process POC).

---

## Project structure
Create a repo like:

/meta-automation-poc
/backend
/src
server.ts
firestore.ts
renderService.ts
playwrightRunner.ts
types.ts
package.json
tsconfig.json
/frontend
index.html
app.js
styles.css
/storage
/inputs
/outputs
firebase.json
.gitignore
README.md


---

## Backend requirements
### Endpoints
- `POST /api/render`
  - multipart field: `image`
  - body optional:
    - `demoIndex` (0..3) default 0
  - response:
    - `{ id: string, outputUrl: string, status: "done" }`
- `GET /api/render/:id`
  - response Firestore doc data including status + urls

### Static files
- Serve outputs at: `GET /files/outputs/<id>.png`
- Optionally serve inputs similarly (not required)

### Firestore emulator connection
- Use Firestore SDK pointing to emulator:
  - `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`
  - use any local projectId, e.g. `meta-automation-poc`

### Data model (Firestore)
Collection: `renders`
Document id: `<id>` (UUID)
Fields:
- `status`: `"running" | "done" | "error"`
- `createdAt`: number (Date.now())
- `updatedAt`: number
- `demoIndex`: number
- `inputPath`: string
- `outputPath`: string | null
- `outputUrl`: string | null
- `error`: string | null
- `durationMs`: number | null

### Mutex
- If busy, return HTTP 429 `{ error: "Renderer busy" }`.

### Timeouts and cleanup
- Implement a max runtime (e.g. 120 seconds). If exceeded:
  - close browser/context
  - mark job error in Firestore
  - return 500

---

## Playwright automation scope (MVP)
Important: The Meta canvas flow can be multi-step (mask/joints). For the POC:
- Implement best-effort automation:
  1) Open page
  2) Upload input file via `<input type="file">`
  3) Attempt to click through “Next” buttons if present
  4) Select a demo option (demoIndex)
  5) Wait a few seconds for animation to appear
  6) Screenshot a target element (prefer the canvas container) to output file

Implementation details:
- Use robust waits:
  - `page.waitForLoadState("domcontentloaded")`
  - `locator.waitFor({ state: "visible" })`
- Do not hardcode sleeps except a short final stabilization (1–3 seconds).

Selectors will likely require inspection and adjustment. Implement with a small helper that tries multiple selectors for:
- file input
- next button
- demo buttons
- animation canvas/container

If selectors fail, throw an error and store it.

---

## Frontend requirements (minimal)
- A page with:
  - file input
  - dropdown for demoIndex (0..3) with labels “Demo 1..4”
  - “Render” button
  - status area (text)
  - output `<img>` once done

### Frontend behavior
- On click “Render”:
  - POST to `/api/render` with FormData
  - display “Running…”
  - on success: set `<img src=outputUrl>` and show it.

---

## Local run requirements
### Firebase emulator
- Create `firebase.json` at repo root:
  - Firestore emulator on port 8080
  - Emulator UI on 4000 (optional)

### Scripts
- Root: `npm run dev` starts:
  - Firestore emulator
  - backend dev server
  - frontend static server OR backend serves frontend

Preferred approach for simplicity:
- backend serves `/frontend` static and acts as single server.
- Access at http://localhost:3000

---

## Implementation tasks (do these in order)
1) Initialize backend TypeScript project:
   - express, multer, playwright, firebase-admin (or @google-cloud/firestore), cors (optional)
2) Add Firestore emulator config in `backend/src/firestore.ts`
3) Implement storage folders creation at startup
4) Implement `POST /api/render`:
   - reject if mutex busy
   - generate uuid
   - save upload to `/storage/inputs/<id>.png`
   - create Firestore doc status running
   - run Playwright runner
   - save output to `/storage/outputs/<id>.png`
   - update Firestore doc to done
   - return outputUrl
5) Implement `GET /api/render/:id`
6) Serve static outputs
7) Implement frontend HTML/JS
8) Provide README with commands

---

## Acceptance criteria
- Running `npm run dev` starts emulators + server.
- UI at `http://localhost:3000` lets user upload PNG and click Render.
- Within the same request, the server returns `outputUrl`.
- Output is stored on disk and metadata stored in Firestore emulator.
- Playwright process is created and fully closed per request (no lingering browsers).

---

## Notes / guardrails
- Keep everything local. Do not require Google Cloud credentials.
- Do not store binary blobs in Firestore; store paths + metadata.
- Keep the POC simple and reliable; do not optimize prematurely.
- Provide clear error messages if automation fails (selectors / flow changes).

---

## Deliverables
- Working repository with backend + frontend + emulator config
- README.md with:
  - prerequisites
  - install steps
  - run steps
  - troubleshooting (common Playwright deps / emulator ports)
