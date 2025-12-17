# PhyCom Animated Drawings

A local proof-of-concept system that automates animation generation using Meta's Animated Drawings demo. The project consists of three interconnected services that work together to upload images, generate animations via browser automation, and display results in real-time.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERACTION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐                       ┌─────────────────────────┐  │
│  │  sketch-meta-service │                       │   phycom-playground     │  │
│  │    (Port 3000)       │                       │     (Port 5173)         │  │
│  │  ────────────────    │                       │   ─────────────────     │  │
│  │  • Upload UI         │                       │   • Live Gallery        │  │
│  │  • Playwright Runner │                       │   • Real-time Updates   │  │
│  │  • File Storage      │                       │   • SSE Connection      │  │
│  └──────────┬───────────┘                       └───────────┬─────────────┘  │
│             │                                               │                │
│             │  Writes docs                                  │  Fetches data  │
│             ▼                                               ▼                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Firestore Emulator (Port 8080)                     │   │
│  │                         Collection: phycom_draws                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│             ▲                                               ▲                │
│             │  Listens for changes                         │                │
│             │                                               │                │
│  ┌──────────┴───────────┐                                   │                │
│  │phycom-firestore-     │───────────────────────────────────┘                │
│  │listener (Port 4001)  │    Provides API + SSE events                      │
│  │  ────────────────    │                                                   │
│  │  • Firestore Watcher │                                                   │
│  │  • REST API          │                                                   │
│  │  • SSE Broadcasting  │                                                   │
│  └──────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Service | Port | Description |
|---------|------|-------------|
| **sketch-meta-service** | 3000 | Backend + frontend for uploading images and running Playwright automation against Meta's Animated Drawings |
| **phycom-firestore-listener** | 4001 | Watches Firestore for changes and broadcasts updates via SSE |
| **phycom-playground** | 5173 | React gallery that displays generated animations in real-time |
| **Firestore Emulator** | 8080 | Local database storing render metadata |
| **Emulator UI** | 4000 | Firebase Emulator Suite dashboard |

---

## 📋 Prerequisites

- **Node.js** v18+ (v20 recommended)
- **npm** v8+
- **Java** v11+ (required for Firebase Emulator)
- **Firebase CLI**: Will be installed as a project dependency

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd animated_drawing

# Install dependencies for all services
cd sketch-meta-service && npm run install:all && cd ..
cd phycom-firestore-listener && npm install && cd ..
cd phycom-playground && npm install && cd ..
```

### 2. Configure Environment Variables

```bash
# Firestore Listener
cd phycom-firestore-listener
cp .env.example .env

# Playground Frontend
cd ../phycom-playground
cp .env.example .env
```

### 3. Start All Services (4 terminals needed)

**Terminal 1 - Firestore Emulator:**
```bash
cd sketch-meta-service
npm run start:firestore
```

**Terminal 2 - Sketch Meta Service (Backend + Upload UI):**
```bash
cd sketch-meta-service
npm run dev
```

**Terminal 3 - Firestore Listener:**
```bash
cd phycom-firestore-listener
npm run dev
```

**Terminal 4 - Playground Frontend:**
```bash
cd phycom-playground
npm run dev
```

### 4. Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Upload UI - Submit images for animation |
| http://localhost:5173 | Playground - View generated animations |
| http://localhost:4000 | Firebase Emulator UI - Debug database |

---

## 📁 Project Structure

```
animated_drawing/
├── sketch-meta-service/     # Playwright automation service
│   ├── backend/
│   │   └── src/
│   │       ├── server.ts           # Express server + API endpoints
│   │       ├── playwrightRunner.ts # Browser automation logic
│   │       ├── renderService.ts    # Orchestrates rendering pipeline
│   │       ├── firestore.ts        # Database connection
│   │       └── types.ts            # TypeScript interfaces
│   ├── frontend/            # Simple upload UI (HTML/CSS/JS)
│   ├── storage/             # Generated files (inputs/outputs)
│   └── firebase.json        # Emulator configuration
│
├── phycom-firestore-listener/   # Real-time event service
│   └── src/
│       ├── server.ts        # Express + SSE server
│       ├── listener.ts      # Firestore change watcher
│       ├── usecase.ts       # Event handler logic
│       └── types.ts         # TypeScript interfaces
│
├── phycom-playground/       # React gallery frontend
│   └── src/
│       ├── App.tsx          # Main application component
│       └── components/      # UI components
│
└── sketch-meta-playground/  # Specification documents
    ├── spec_2.md            # Listener service spec
    └── spec_3.md            # Playground spec
```

---

## 🔧 Service Details

### Sketch Meta Service

The core automation service that:
- Receives image uploads via `POST /api/render`
- Uses Playwright to automate Meta's Animated Drawings website
- Captures animation output (screenshots/videos/GIFs)
- Stores files locally and metadata in Firestore

**Key Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/render` | Upload image and start render |
| GET | `/api/render/:id` | Get render status by ID |
| GET | `/files/outputs/:filename` | Serve generated files |

**Scripts:**
```bash
npm run dev           # Start service (headless Playwright)
npm run dev:debug     # Start with visible browser
npm run start:firestore  # Start Firestore emulator only
```

---

### Firestore Listener Service

Watches the `phycom_draws` collection and:
- Detects when `outputPath` changes
- Executes use case logic on changes
- Broadcasts updates via SSE to connected clients
- Provides REST API for initial data fetch

**Key Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/draws` | Fetch all completed draws |
| GET | `/api/stream` | SSE stream for real-time updates |
| POST | `/api/rebuild` | Reprocess all existing draws |

**Environment Variables:**
```env
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
GCLOUD_PROJECT=meta-automation-poc
IDEMPOTENT_MODE=true
PORT=4001
```

---

### PhyCom Playground

React frontend that:
- Loads existing drawings on startup
- Receives real-time updates via SSE
- Displays animations in a responsive gallery
- Supports video playback for animated outputs

**Environment Variables:**
```env
VITE_LISTENER_BASE_URL=http://localhost:4001
```

---

## 🗄️ Data Model

**Collection:** `phycom_draws`

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Document ID (UUID) |
| `status` | string | `"running"` \| `"done"` \| `"error"` |
| `createdAt` | string | ISO 8601 timestamp |
| `inputPath` | string | Path to uploaded image |
| `outputPath` | string \| null | Path to generated output |
| `outputUrl` | string \| null | HTTP URL to serve output |
| `videoUrl` | string \| null | URL for video output if available |
| `error` | string \| null | Error message if failed |
| `outputProcessedPath` | string \| null | Idempotency marker |
| `outputProcessedAt` | number \| null | Processing timestamp |

---

## 🔍 Troubleshooting

### Common Issues

**Firestore Emulator won't start:**
- Ensure Java 11+ is installed: `java -version`
- Check if port 8080 is already in use
- Try: `firebase emulators:start --only firestore --debug`

**Playwright fails to automate:**
- Install browser dependencies: `npx playwright install`
- Run with visible browser for debugging: `npm run dev:debug`
- Check for selector changes on Meta's website

**No real-time updates in Playground:**
- Verify Firestore Listener is running on port 4001
- Check browser console for SSE connection errors
- Ensure CORS is properly configured

**"Renderer busy" error:**
- Only one render runs at a time (mutex protection)
- Wait for current render to complete or restart service

### Port Conflicts

If defaults are in use, update these configurations:

| Service | Config File | Variable |
|---------|-------------|----------|
| Firestore | `sketch-meta-service/firebase.json` | `emulators.firestore.port` |
| Listener | `phycom-firestore-listener/.env` | `PORT` |
| Playground | `phycom-playground/.env` | `VITE_LISTENER_BASE_URL` |

---

## 📚 Specifications

For detailed technical specifications, see:
- [Sketch Meta Service Spec](./sketch-meta-service/SPEC.md)
- [Firestore Listener Spec](./sketch-meta-playground/spec_2.md)
- [Playground Spec](./sketch-meta-playground/spec_3.md)

---

## 🛡️ Limitations

- **Local only**: No cloud credentials or deployments
- **Single render at a time**: Mutex prevents parallel processing
- **Firestore Emulator**: Data is ephemeral (resets on restart)
- **Selector dependent**: Playwright automation may break if Meta's website changes

---

## 📄 License

This is a proof-of-concept project for demonstration purposes.
