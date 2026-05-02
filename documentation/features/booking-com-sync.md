# Booking.com iCal Sync

Mirrors Booking.com's calendar feed into the `availability` table so the on-site booking calendar shows dates blocked by Booking.com guests as unavailable.

---

## How it works

```
Booking.com iCal feed                Supabase
        │                            availability table
        │  fetch                          ▲
        ▼                                 │ upsert
 +------------------------+    parse +-----------+
 | POST /api/sync-booking-com  ───▶ | parseIcal | ───▶ blocked dates
 +------------------------+        +-----------+      synced_from='booking.com'
        ▲
        │  x-sync-secret header
        │
   external scheduler (cron, Netlify scheduled function, manual curl)
```

| File | Role |
|---|---|
| `src/routes/api/sync-booking-com/+server.ts` | HTTP endpoint, auth, fetch, persist |
| `src/lib/server/ical.ts` | `parseIcal()` + `getBlockedDates()` parser |
| `src/lib/server/ical.test.ts` | Vitest coverage for the parser |
| `src/routes/api/sync-booking-com/server.test.ts` | Endpoint tests |

---

## Endpoint: `POST /api/sync-booking-com`

**Auth:** must send `x-sync-secret: <SYNC_SECRET>` header. 401 otherwise.

**Required env:**

| Var | Purpose |
|---|---|
| `SYNC_SECRET` | Shared secret for the header check |
| `BOOKING_COM_ICAL_URL` | The Booking.com `.ics` feed URL (Booking.com → Property → Sync calendars) |

**Behaviour:**

1. Header check.
2. Env check — returns 503 if `BOOKING_COM_ICAL_URL` missing or still set to `REPLACE_ME`.
3. `fetch()` the feed → 502 on non-2xx.
4. Parse ICS → list of events → expand into per-date blocked entries.
5. Upsert into `availability` with `available=false`, `synced_from='booking.com'`, `synced_at=now()`, conflict on `date`.
6. Returns `{ synced: <number-of-blocked-dates> }`.

**Notes:**

- Upsert is one-way: dates currently blocked by Booking.com become unavailable on our calendar, but the sync **does not unblock** dates that were previously synced and have since dropped from the feed. If a Booking.com booking is cancelled, the block remains until manually cleared via admin or `setAvailability()`. Worth fixing before relying on this for high-turnover periods.
- Failure mode is non-destructive — a bad fetch returns an error, no rows changed.

---

## Triggering the sync

Currently no scheduler is wired up in the repo. Options:

| Option | Notes |
|---|---|
| Netlify Scheduled Functions | Cleanest — declare in `netlify.toml`, runs serverless on cron. |
| External cron (cron-job.org etc.) | Hits the public endpoint with the secret header. |
| Manual `curl` | Useful while testing. |

Example manual trigger:

```bash
curl -X POST https://mariannecottage.netlify.app/api/sync-booking-com \
     -H "x-sync-secret: $SYNC_SECRET"
```

---

## What's not implemented

- **Two-way sync.** The cottage's own bookings are not pushed back to Booking.com — guests booking direct could double-book a Booking.com listing window. Manual coordination required.
- **Removal of stale blocks** when an event disappears from the Booking.com feed (see note above).
- **Multiple OTAs.** Schema supports it (`synced_from` enum), but only `booking.com` is implemented.
