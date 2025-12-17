# Phycom Firestore Listener

A standalone Node.js service that subscribes to a Firestore Emulator collection (`phycom_draws`) and triggers a use case when `outputPath` changes.

## Prerequisites

- Node.js 18 or higher
- Firebase Emulator running (from `sketch-meta-service`)

## Installation

```bash
npm install
cp .env.example .env
```

## Running

Make sure the Firestore emulator is running first:
```bash
# In sketch-meta-service directory
npm run start:firestore
```

Then start the listener:
```bash
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run start` | Run compiled JS (production) |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FIRESTORE_EMULATOR_HOST` | `127.0.0.1:8080` | Emulator address |
| `GCLOUD_PROJECT` | `meta-automation-poc` | Project ID |
| `IDEMPOTENT_MODE` | `true` | Prevent duplicate processing |

## Testing

1. Start the listener with `npm run dev`
2. Open Firestore Emulator UI: http://127.0.0.1:4000
3. Create a document in `phycom_draws` with `outputPath: "/some/path"`
4. Check the listener logs for trigger confirmation
5. Verify `outputProcessedPath` is updated in the document

## Troubleshooting

- **"Could not reach Cloud Firestore"**: Emulator not running. Start it with `npm run start:firestore` in sketch-meta-service.
- **Documents not triggering**: Check `GCLOUD_PROJECT` matches the emulator's project ID.
- **Duplicate triggers**: Ensure `IDEMPOTENT_MODE=true` in .env.
