# Zendapp

A social payment app for the Arc network. Pay anyone by username, in USDC.
Non-custodial. No wallet addresses, no gas, no ETH — just people and dollars.

This build replaces every "next step" from the first draft except the one
you asked to leave out (gas-station/relayer sponsorship). Everything below
was written **and tested end-to-end against a real local Postgres database**
before packaging — see "What was actually tested" at the bottom for the exact
commands and output.

## Stack

- **Next.js 14 (App Router) + TypeScript**
- **Tailwind + a custom design system**, built entirely from `#31028f` / `#000000` / `#FFFFFF`
- **Framer Motion**, **React Query**, **Zustand**
- **viem** for all Arc chain reads/writes
- **Drizzle ORM + node-postgres (`pg`)** for the database (see "Why Drizzle, not Prisma" below)
- **Resend** for transactional email, with a console-log dev fallback
- **web-push** (VAPID) for browser push notifications
- **WebAuthn (PRF extension)** for optional Face ID / Touch ID payment confirmation
- **jsQR** for camera-based QR scanning (Send flow)
- **@vercel/blob** for profile photo storage, with a real dev fallback when unconfigured

## Public landing page

`/` is a real marketing page (nav, hero, features, how-it-works, security,
final CTA, footer) — not a redirect. `components/landing/` holds every
section; `components/landing/auth-redirect-gate.tsx` preserves the original
behavior of sending already-logged-in or mid-onboarding visitors straight
to `/home` or wherever they left off, so only genuinely new visitors see
the marketing content. `/terms` and `/privacy` are honest placeholder pages
(no fabricated legal text) linked from the footer.

## Sign in on any device

The single email-entry screen (`/signup`) serves both new signups and
returning sign-ins. After email verification, if the account already
exists, the server activates a real session immediately; the client then
checks whether *this device* already holds the matching encrypted wallet
locally. If not (a new phone, a cleared browser), `/restore-wallet` walks
through entering the recovery phrase — verified against the account's
actual on-file wallet address before anything is stored — and setting a
passcode for that device.

## QR scanning

Receive/Profile already generated a QR code encoding
`https://zendapp.app/<username>`; the Send flow can now scan one back.
`components/qr-scanner.tsx` is a full-screen camera view (no third-party
scanning-UI library — just `getUserMedia` + a canvas frame grab loop)
decoded with **jsQR**, chosen because it's a small (~9 KB), dependency-free,
long-established pure-JS QR decoder — enough to own the camera plumbing
directly rather than inherit a heavier library's UI. `lib/qr/parse.ts`
turns the decoded text into a username (accepting the full URL, a bare
`zendapp.app/<username>`, or a raw username), rejecting anything that
isn't actually a Zendapp code — including a lookalike domain — rather than
guessing. `GET /api/users/[username]` resolves the exact account
afterward (distinct from the substring-matching `/api/users/search` used
for type-ahead).

Requires HTTPS or localhost, same as WebAuthn — browsers refuse camera
access otherwise.

## Profile photo upload

The onboarding "add a photo" button and the Profile page's camera badge
were both previously decorative. Both are wired up now:

- `lib/image/compress.ts` resizes/center-crops/compresses the chosen photo
  to a small square entirely client-side (plain Canvas API — no extra
  dependency needed for something this size) before it's ever uploaded.
- `lib/server/avatar-storage.ts` stores it via **Vercel Blob** when
  `BLOB_READ_WRITE_TOKEN` is set (enabling the Blob store for a Vercel
  project sets this automatically — nothing to copy-paste), or falls back
  to storing the compressed image directly as a `data:` URI on the user
  record otherwise, following the same "real code path either way, no
  mock to swap out later" pattern already used for email and push.
- During onboarding, the photo is included directly in the
  `POST /api/users/complete` submission (the account doesn't exist yet to
  attach a photo to beforehand); from the Profile page afterward, it's a
  standalone `POST /api/users/avatar` call. Both funnel through the same
  storage helper.

## Why Drizzle, not Prisma

Prisma's CLI (`generate`/`migrate`) downloads a native query/schema engine
binary from `binaries.prisma.sh` on first run. That's a non-issue on a normal
laptop or CI runner, but it's exactly the kind of external dependency that
breaks in locked-down networks, some Docker multi-stage builds, and this
sandbox itself. Drizzle compiles straight to SQL over the plain `pg` driver —
no binary, no postinstall network call, works anywhere Node does. Functionally
it's a wash for this app's needs; operationally it's strictly more portable,
so it's the one shipped here.

## Arc integration — where to look

Unchanged from the original build; still the source of truth. Everything Arc-specific lives in `lib/arc/`, each file citing the relevant Arc Builders Docs section:

| File | What it encodes |
|---|---|
| `lib/arc/chain.ts` | Arc Testnet chain definition, chain ID `5042002`, system contract addresses |
| `lib/arc/usdc.ts` | The 18-decimal native to 6-decimal ERC-20 conversion — the only place it happens |
| `lib/arc/fees.ts` | USDC-denominated fee estimation — never Gwei/ETH |
| `lib/arc/tx.ts` | Two-state (`pending`/`final`) lifecycle, blocklist checks, history from the native USDC system emitter |
| `lib/arc/client.ts` | Shared read-only Arc RPC client |

## Database — real, tested, not a placeholder

`lib/server/schema.ts` defines four tables (`users`, `verification_codes`,
`transactions`, `push_subscriptions`) with proper unique indexes and foreign
keys. `lib/server/db.ts` is now 100% Postgres-backed — the in-memory Maps are
gone. `lib/server/db-client.ts` is the connection-pool singleton.

```bash
npm run db:push       # dev: push the schema straight to your database
npm run db:generate   # prod: write a versioned SQL migration to ./drizzle
npm run db:migrate    # prod: apply generated migrations
npm run db:studio     # visual browser for your data (Drizzle Studio)
```

A generated baseline migration already ships at
`drizzle/0000_flimsy_colonel_america.sql` — proven (see below) to apply
cleanly to a brand-new database via `npm run db:migrate`.

## Email — real Resend integration, with a dev fallback

`lib/server/email.ts` calls the real Resend HTTP API
(`sendVerificationEmail`, `sendPaymentReceivedEmail`) when `RESEND_API_KEY`
is set. Without it (e.g. running locally without an account yet), it logs
the content to the server console instead of throwing, so `npm run dev`
still works. There is no mock client to swap out later — this is the
production code path already; it just needs your API key.

## Push notifications — real, with service worker + VAPID

- `public/sw.js` — service worker handling `push` and `notificationclick`
- `hooks/use-push-notifications.ts` — registers the SW, requests permission,
  subscribes with your VAPID public key, and persists the subscription
- `app/api/push/subscribe` / `unsubscribe` — store/remove subscriptions
- `lib/server/push.ts` — sends via `web-push` when `VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` are set (again, console-logs in dev without them)
- Wired into Settings to Notifications, and fired automatically from
  `POST /api/tx/record` whenever a payment completes

## Non-custodial wallet — now IndexedDB, with optional biometric unlock

`lib/wallet/storage.ts` moved wallet storage from `localStorage` to
IndexedDB (async, not size-capped, and includes a one-time, automatic
migration for anyone who had the old localStorage version). The mnemonic is
still AES-GCM encrypted with a PBKDF2-derived key from the user's passcode —
that's the required baseline and is never removed.

On top of that, `lib/wallet/webauthn.ts` adds **real WebAuthn PRF-based
biometric unlock** (Settings, Wallet & recovery, "Face ID / Touch ID
unlock"): it registers a platform credential, verifies the authenticator
actually supports the PRF extension, and uses the derived secret to encrypt
a *second* copy of the mnemonic. If PRF isn't supported (older Safari,
some Android authenticators), the toggle simply doesn't appear — there's no
fake "success" state. Losing the device/credential never locks you out,
because the passcode-encrypted copy is always still there.

The Send flow's confirm step now offers "Use Face ID / Touch ID" first (when
enabled) and always falls back to the passcode field.

## What's still genuinely outside what I can do for you

Everything above is real, working code. Two things are structurally
impossible for me to finish on your behalf, because they require **your own
accounts and credentials**, not more code:

1. **A live production database** — I ran this against a real local
   Postgres instance to prove the code works, but I can't provision a
   Postgres instance that lives on the internet for you.
2. **A verified Resend sending domain and API key** (for real emails to
   real inboxes) and **your own VAPID keypair** (for push, so it's not
   shared with every other Zendapp dev's install). Copy-paste credentials
   aren't something I can generate on your behalf and have work.

Step-by-step guide for those two, below.

---

## Step-by-step: taking this to production

### 1. Get a production Postgres database

Pick one (all have a free tier that's plenty for launch):

- **Neon** (neon.tech) — recommended: serverless Postgres, scales to zero, generous free tier
- **Supabase** (supabase.com) — Postgres plus extras you're not using yet, but fine as plain Postgres
- **Railway / Render / AWS RDS** — any managed Postgres works identically

Steps (Neon as the example):
1. Sign up, create a project.
2. Copy the connection string it gives you (looks like
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).
3. Put it in your deployment's environment variables as `DATABASE_URL`.
4. From your machine (with that `DATABASE_URL` in `.env`), run:
   ```bash
   npm run db:migrate
   ```
   This applies the same migration file that's already in `./drizzle` and
   that was verified to apply cleanly. You only do this once per environment
   (and again for each future schema change via `db:generate` + `db:migrate`).

### 2. Set up real email (Resend)

1. Sign up at resend.com.
2. Add and verify a sending domain (Resend walks you through the DNS
   records — a few TXT/CNAME entries at your domain registrar, usually
   live within minutes to a few hours).
3. Create an API key in the Resend dashboard.
4. Set in your environment:
   ```
   RESEND_API_KEY=re_xxx...
   EMAIL_FROM="Zendapp <notifications@yourdomain.com>"
   ```
   That's it — `lib/server/email.ts` already does the rest.

### 3. Set up push notifications (your own VAPID keys)

Don't reuse any keypair you might see mentioned elsewhere — generate your own:
```bash
npx web-push generate-vapid-keys
```
Set the three values it prints:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...   # same as VAPID_PUBLIC_KEY, exposed to the client
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

### 4. Set the session secret

```bash
openssl rand -base64 32
```
Set that as `SESSION_SECRET` in your environment. This is what signs the
httpOnly login cookie — treat it like a password.

### 5. Deploy

Any platform that runs Next.js works (Vercel is the path of least
resistance). Steps are the same everywhere in spirit:
1. Push this repo to GitHub.
2. Connect it to your host (e.g. Vercel, New Project, import the repo).
3. Add all the environment variables from steps 1 to 4 above in the host's
   dashboard.
4. Deploy.
5. WebAuthn (biometric unlock) requires HTTPS — any real deployment
   already has this; only `localhost` is exempt for local dev.

### 6. Get testnet USDC

Once deployed, create an account in the app, then get testnet USDC for the
generated wallet from the Circle Faucet (faucet.circle.com) — the wallet
address is on the Settings, Wallet & recovery screen.

### 7. (Optional) Move to Arc mainnet

Everything here targets Arc **Testnet** per the Arc Builders Docs used to
build it. When Arc's mainnet RPC/chain ID/contract addresses are available
to you, the only file that needs updating is `lib/arc/chain.ts` (chain ID,
RPC/WS URLs, explorer URL, and the system contract addresses) — nothing
else in the app assumes testnet.

---

## What was actually tested

Before this was packaged:

1. Installed Postgres 16 locally and ran `npm run db:push`, confirming all
   four tables, their unique indexes, and foreign keys were created exactly
   as `lib/server/schema.ts` specifies.
2. Ran `npm run db:generate` to produce the migration in `./drizzle`, then
   applied it with `npm run db:migrate` against a **second, brand-new**
   database to prove the versioned-migration path (not just `db:push`)
   works cleanly.
3. Ran a full production build (`next build`) with zero type or lint errors.
4. Started the production server and, against the real database, exercised
   the entire backend with real HTTP requests:
   - Signup, dev-console verification code, verify, complete onboarding
   - A second user signing up, colliding on a taken username (rejected with
     `409 USERNAME_TAKEN`), then completing with a unique one
   - Cross-user search returning the correct match
   - Recording a completed payment and confirming it appears correctly on
     **both** sides — sender sees "sent", recipient sees "received", with
     the right counterparty resolved from the database
   - The payment-received notification firing exactly once, through both
     the email and push dev-console fallbacks
   - The signup rate limiter correctly allowing 5 requests and rejecting
     the 6th with `429`
   - Reserved and malformed usernames (`admin`, too short, too long, has a
     space, starts with a digit) all rejected with the right message

Not tested from here (structurally impossible without external accounts and
a real browser/authenticator): live Resend email delivery, live push
delivery to a real browser, and a real WebAuthn biometric prompt. All three
are complete, real implementations; they need your credentials and a real
browser session to see fire, per the guide above.

**Added and tested in the same way for the landing page / QR / photo
upload round:** the QR payload parser (`lib/qr/parse.ts`) against 12 cases
including a lookalike-domain rejection; onboarding with a photo attached,
end-to-end against real Postgres, confirming the `data:` URI dev-fallback
path actually stores and round-trips through `/api/users/me`; the
standalone `POST /api/users/avatar` change-photo flow the same way; the new
exact-username lookup route (`/api/users/[username]`) for a real match, a
404, and a malformed username; a regression pass on search (including
confirming its self-exclusion behavior is by design, not a bug); a
regression pass on `tx/record` + `tx/history` after touching the Send page;
and every route (`/`, `/terms`, `/privacy`, `/signup`, `/send`, `/profile`)
resolving correctly. Not testable from here: an actual camera scan (needs
real hardware/browser) — the parsing and resolution logic it depends on is
tested as above, and the camera-facing code itself is a small, standard
`getUserMedia` + canvas loop with no novel logic in it.

## Error handling

Centralized in `lib/api-client.ts` (`ApiRequestError`) and the Arc helpers:
duplicate/invalid/reserved usernames, insufficient balance vs. balance + fee,
Arc blocklist rejection, RPC unavailability, offline detection, email
verification failure, dropped/failed transactions, wrong passcode, failed
biometric prompts (falls back to passcode, never a dead end), and search
failures — each with a plain-language message.

## Running locally

```bash
npm install
cp .env.example .env
# set DATABASE_URL to a local or hosted Postgres instance
# set SESSION_SECRET (openssl rand -base64 32)
npm run db:push
npm run dev
```
