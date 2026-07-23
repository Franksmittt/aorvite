# Absolute Offroad Workshop App

Vite + React workshop app — jobs, photo checklists, orders, tool stocktakes. Data lives in `localStorage` on the device; with Firebase env vars, photos go to Storage and jobs/orders sync to Firestore.

## Deploy on Vercel

1. Import repo: [github.com/Franksmittt/aorvite](https://github.com/Franksmittt/aorvite)
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

`vercel.json` handles client-side routing for React Router.

## Local dev

```bash
npm install
npm run dev
```

## Logins

| Person | Role | PIN |
| --- | --- | --- |
| Jaco | Company Owner | 1111 |
| Marius | Staff | 2222 |
| Marius 2 | Staff (probation) | 7777 |
| Jovan | Staff | 3333 |
| Themba | Staff | 4444 |
| Thando | Staff | 5555 |
| Yogs | Parts / Orders | 6666 |

## Hubs

**Workshop** · **Order** · **Stocktake**

- Starts empty — book in a vehicle, take walkaround photos, request consumables, issue/print as Yogs
- Photo capture needs **HTTPS** (Vercel preview/production; use phone browser)
- Final inspection / client release: **Owner** (or Manager role if assigned)
- Orders: staff request → Yogs issues to supplier (Account / EFT / Cash) → print → receive → allocate to job
- Each job has an **audit log** (photo times, deletes, notes, submissions)

## Firebase

App reads Vite env vars. Without them it stays in **local mode** (this device only). With them: photos → Storage, jobs/orders/stocktakes → Firestore.

### Console setup (project `aor-vite`)

1. [Firebase Console](https://console.firebase.google.com/) → add/select project **aor-vite**
2. Build → **Firestore** → create database → location **`africa-south1` (Johannesburg)** → start in **test mode** for MVP
3. Build → **Storage** → get started → same region if asked → test mode for MVP
4. Project settings → Your apps → **Web** → register `aor-vite-web` → copy config
5. Paste into Vercel env vars (and `.env.local` locally):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=aor-vite
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

6. Redeploy Vercel. Hub should show **Firebase connected**.

### Security rules (IMPORTANT — console "test mode" rules expire!)

The console's default test-mode rules **expire after 30 days** and then silently
block every photo upload and job sync (the app falls back to on-device storage,
which fills the phone up). This repo now ships non-expiring MVP rules in
`firestore.rules` and `storage.rules`. Deploy them with:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

Or paste the contents of those two files into Firebase Console → Firestore →
Rules and Storage → Rules.

The rules are open (no Firebase Auth yet — app login is PIN-based on the
device). Lock them down once Firebase Auth is added.

### Photos stuck on a phone?

When the app starts with Firebase connected, it automatically uploads any
photos that were saved on-device while sync was down, so every login can see
them. Just open the app on that phone (with network) after fixing the rules.

### Pause sync (optional)

Set `VITE_LOCAL_FIRST_MODE=true` in Vercel env vars to force local-only mode
(photos/jobs stay on the device). Remove it and redeploy to resume cloud sync.
