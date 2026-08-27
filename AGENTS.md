# Base44 development notes

- Run the app with `docker compose -f docker-compose.base44.yml up -d`.
- The frontend is a Vite development server on port 3000 with source bind-mounted for live reload.
- Firebase client configuration is committed in `firebase-applet-config.json`; the UI falls back to browser-local data when Firestore is unavailable or access is denied.
- `GEMINI_API_KEY` appears only as an optional template entry and is not required by the current source or at boot.
- Verify locally with `curl -f http://localhost:3000/` and externally with a non-localhost Host header.
- Type-check with `docker compose -f docker-compose.base44.yml exec -T web npm run lint`.
