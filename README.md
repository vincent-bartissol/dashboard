# Paris Ouverte

French-first civic dashboard on [opendata.paris.fr](https://opendata.paris.fr). Next.js 16, Better Auth, SQLite. Node 22 (what CI and the Docker image use).

Live: [dashboard.vvbb.fr](https://dashboard.vvbb.fr)

## Local

```bash
pnpm install
docker compose up -d mailpit
cp .env.example .env.local
```

Set `BETTER_AUTH_SECRET` in `.env.local` (`openssl rand -base64 32`). Keep `MAILER_PROVIDER=mailpit`. Then:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Mailpit UI: [http://localhost:8025](http://localhost:8025).

SQLite lives in `data/` (gitignored). **Runtime** (`pnpm dev`, `pnpm start`, the Docker `CMD`) applies Drizzle migrations from `lib/db/migrations` (existing files are baselined, then any new SQL runs once). `pnpm build` / `next build` does **not** migrate — parallel build workers would race on the same file. After changing [`lib/db/schema.ts`](lib/db/schema.ts), run `pnpm db:generate` and commit the new files.

### First admin

Sign up through the normal flow (email verification + OTP), then promote in SQLite:

```bash
sqlite3 data/dashboard.sqlite "UPDATE user SET role = 'admin' WHERE email = 'you@example.com';"
```

The admin UI is at `/fr/dashboard/admin` (user list, stats, activity). Open a user for ban / unban, role changes, and session revoke. Optional break-glass: set `ADMIN_USER_IDS` to a comma-separated list of user ids in `.env.local` (and Railway). Prefer the `role` column over the env list for day-to-day admins.

To fill the admin UI with demo users, sessions, favorites, and activity (local SQLite only):

```bash
DATA_DIR=./data BETTER_AUTH_URL=http://localhost:3000 pnpm db:seed-demo
```

Use `pnpm db:seed-demo -- --reset` to remove `@seed.local` users and any `seed-*` demo rows, then reseed. Seed accounts are for admin viewing only (no login password).

`pnpm test` and `pnpm lint` before pushing. `pnpm test` is Vitest: helper unit tests, i18n key parity, the Open Data records API, favorite/profile actions against a temp SQLite file, and a few Testing Library checks. After `pnpm build`, `pnpm test:e2e` runs Playwright smokes (landing, locale switch, login error, seeded dashboard, Nature tabs, Vélib’ filter/favorites, profile save) plus axe on landing, login, and dashboard. First time locally: `pnpm exec playwright install --with-deps chromium`.

Dependabot opens weekly PRs for npm and GitHub Actions. CI runs `pnpm audit` as a warning (it does not fail the job). [`.github/workflows/uptime.yml`](.github/workflows/uptime.yml) curls [dashboard.vvbb.fr/fr](https://dashboard.vvbb.fr/fr) every hour; a failed run is the alert.

## Lighthouse

GitHub Actions runs Lighthouse without failing the job on scores. Category scores (median of the runs) appear on the Actions **job summary**. Full HTML reports are artifacts on the workflow run.

- **PRs** — [`.github/workflows/lighthouse-pr.yml`](.github/workflows/lighthouse-pr.yml) audits `/fr`, `/fr/login`, `/fr/signup`, then `/fr/dashboard` and `/fr/dashboard/velib` against a local build (seeded session cookie, no production login).
- **Production** — [`.github/workflows/lighthouse-production.yml`](.github/workflows/lighthouse-production.yml) audits [dashboard.vvbb.fr](https://dashboard.vvbb.fr) public pages every Monday at 08:00 UTC. Run it by hand from the Actions tab (`workflow_dispatch`).

## Production (Railway)

This is a Node app with a SQLite file. It cannot run on OVH mutualisé (`vvbb.fr` FTP). Railway builds [`Dockerfile`](Dockerfile) and runs the container; DNS points **dashboard.vvbb.fr** at it.

The image entrypoint `chown`s `$DATA_DIR` (Railway volumes are often root-owned), then drops to the `node` user. Do not add a Docker `VOLUME` instruction — it breaks Railway’s build.

1. Deploy this GitHub repo on [Railway](https://railway.app) (one replica).
2. Attach a volume mounted at `/app/data`.
3. Set variables (use a **new** `BETTER_AUTH_SECRET`, not the local one):

   | Variable | Value |
   | --- | --- |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | `https://dashboard.vvbb.fr` |
   | `DATA_DIR` | `/app/data` |
   | `MAILER_PROVIDER` | `resend` |
   | `RESEND_API_KEY` | from Resend |
   | `EMAIL_FROM` | a sender Resend accepts, e.g. `Paris Ouverte <noreply@vvbb.fr>` |
   | `ADMIN_USER_IDS` | optional comma-separated break-glass admin user ids |

4. Generate a Railway domain, then add custom domain `dashboard.vvbb.fr`.
5. At OVH (DNS zone `vvbb.fr`): `CNAME` name `dashboard` → the hostname Railway shows. Wait for SSL.

Signup and 2FA emails need a verified Resend domain.
