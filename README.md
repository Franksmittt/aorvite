# Absolute Offroad Workshop App

Vite + React PWA-style workshop app — jobs, photo checklists, orders, tool stocktakes. Mock data in `localStorage` for now; Firebase wiring comes next via Firebase Console.

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

## Test logins

| Person | Role | PIN |
| --- | --- | --- |
| Jaco | Company Owner | 1111 |
| Marius | Workshop Manager | 2222 |
| Jovan | Staff | 3333 |
| Themba | Staff | 4444 |
| Thando | Staff | 5555 |
| Yogs | Parts / Orders | 6666 |

## Hubs

**Workshop** · **Order** · **Stocktake**

- Photo capture needs **HTTPS** (works on Vercel preview/production; use phone browser, not desktop file picker only).
- Final inspection: **Marius only**
- Orders: staff request → Yogs issues to supplier (Account / EFT / Cash) → print → partial receive → allocate to job

## Firebase (next)

Configure in Firebase Console when ready. Planned: Firestore jobs/orders, Storage for compressed photos, `africa-south1` region.
