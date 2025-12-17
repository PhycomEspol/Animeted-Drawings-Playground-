# PhyCom Playground

A React board UI that displays generated outputs (gif/webp/png) at random positions with real-time updates via Server-Sent Events (SSE).

## Setup

1. **Copy environment config:**
   ```bash
   cp .env.example .env
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:5173`

## Requirements

Before running, make sure these services are running:

1. **Firestore Emulator** (port 8080)
2. **Writer Backend** (port 3000) - serves the output assets
3. **Listener Backend** (port 4001) - provides API + SSE

## Features

- **Real-time updates** - New draws appear instantly via SSE
- **Random board layout** - Images render at random positions
- **Video/image support** - Automatically detects and plays video files
- **Connection status** - Shows live connection state
- **Rebuild button** - Re-fetches all draws from the backend

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_LISTENER_BASE_URL` | Listener backend URL | `http://localhost:4001` |
