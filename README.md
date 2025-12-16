# Meta Sketch Automation POC

A local POC to animate drawings using Meta's Sketch Demo + Playwright + Firestore Emulator.

## Prerequisites
- Node.js (v18+)
- Java (required for Firebase Emulators)

## Installation

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

2. Build backend:
   ```bash
   cd backend && npm run build
   ```

## Running

1. Start the entire stack (Emulators + Backend + Frontend):
   ```bash
   npm run dev
   ```

   This command will:
   - Start Firestore Emulator (port 8080)
   - Start Emulator UI (port 4000)
   - Start Backend Server (port 3000)

2. Open browser:
   - App: [http://localhost:3000](http://localhost:3000)
   - Emulator UI: [http://localhost:4000](http://localhost:4000)

## Usage

1. Open [http://localhost:3000](http://localhost:3000).
2. Upload a PNG/JPEG drawing.
3. Select an animation style.
4. Click "Animate!".
5. Wait ~30-60 seconds.
6. View and download result.

## Troubleshooting

- **Firestore Error**: Ensure Java is installed and `FIRESTORE_EMULATOR_HOST` is set (handled in code).
- **Playwright Error**: If browsers are missing, run `npx playwright install` inside `backend/`.
- **Ports**: If 8080 or 3000 are taken, kill the processes or edit `firebase.json` and `backend/src/server.ts`.
