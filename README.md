# Paris Ouverte

French-first civic dashboard on [opendata.paris.fr](https://opendata.paris.fr). Next.js 16, Better Auth, SQLite. Node 22 (what CI and the Docker image use).

**Live (app):** [dashboard.vvbb.fr](https://dashboard.vvbb.fr) — Node + SQLite on Railway (`main`).

**Static demo:** [vvbb.fr/dashboard](https://vvbb.fr/dashboard/fr/) — export FTP on OVH (`demo` branch). Auth, admin, and e-mails are simulated in the browser; do not merge `demo` into `main`.

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

## Static demo (OVH FTP)

When Railway is down or you want a free showcase on the mutualisé host, branch **`demo`** exports a static site under `/dashboard` and deploys only that folder by FTP. It is **not** meant to be merged into `main`.

| | `main` | `demo` |
| --- | --- | --- |
| URL | [dashboard.vvbb.fr](https://dashboard.vvbb.fr) | [vvbb.fr/dashboard](https://vvbb.fr/dashboard/fr/) |
| Host | Railway (Node + SQLite) | OVH mutualisé (`www/dashboard/` via FTP) |
| Auth / admin / mail | Better Auth + DB | `localStorage` simulation |
| Open Data | Server proxy `/api/opendata/*` | Snapshot at build + browser fetch to opendata.paris.fr |
| Deploy | Railway on `main` | [`.github/workflows/deploy-demo.yml`](.github/workflows/deploy-demo.yml) on push to `demo` |

Deploy syncs `out/` → **`www/dashboard/`** only (same pattern as the portfolio’s `www/portfolio/`). It never cleans `www/`, the site root, or sibling folders.

GitHub Actions secrets (same values as the portfolio / under-construction FTP account):

| Secret | Role |
| --- | --- |
| `FTP_HOST` | OVH FTP host |
| `FTP_USERNAME` | FTP login |
| `FTP_PASSWORD` | FTP password |

Push to `demo` to rebuild and upload. Uptime and alert crons stay pointed at **dashboard.vvbb.fr**.

## Production (Railway)

The full app is a Node process with a SQLite file. That stack does not run on OVH mutualisé; use the **`demo`** branch above for a static mirror there. Railway builds [`Dockerfile`](Dockerfile) and runs the container; DNS points **dashboard.vvbb.fr** at it.

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
   | `CONTACT_TO` | inbox for public contact form notifications |
   | `ADMIN_USER_IDS` | optional comma-separated break-glass admin user ids |
   | `CRON_SECRET` | shared secret for `/api/cron/alerts` (also set as GitHub Actions secret) |
   | `SENTRY_DSN` | optional; enables Sentry on the server when set (empty = off) |
   | `NEXT_PUBLIC_SENTRY_DSN` | optional; same DSN for the browser SDK (required for client errors) |
   | `SENTRY_AUTH_TOKEN` | optional build variable; uploads source maps when set with `SENTRY_ORG` / `SENTRY_PROJECT` |
   | `SENTRY_ORG` | optional; defaults to `self-bnv` for source maps |
   | `SENTRY_PROJECT` | optional; defaults to `paris-ouverte` for source maps |
   | `NEW_RELIC_LICENSE_KEY` | optional; enables New Relic APM when set (empty = off) |
   | `HEALTHCHECKS_PING_URL` | optional; healthchecks.io ping URL for the alerts cron |

   Empty observability variables leave each tool disabled. The app builds and runs without them.

4. Generate a Railway domain, then add custom domain `dashboard.vvbb.fr`.
5. At OVH (DNS zone `vvbb.fr`): `CNAME` name `dashboard` → the hostname Railway shows. Wait for SSL.
6. Add the same `CRON_SECRET` as a GitHub Actions repository secret so `.github/workflows/alerts-cron.yml` can POST every 10 minutes.
7. Optional monitoring:
   - **UptimeRobot:** HTTP(s) monitor on `https://dashboard.vvbb.fr/api/health` every 5 minutes (email on failure). No app secret.
   - **healthchecks.io:** create a check (period 10 minutes), set `HEALTHCHECKS_PING_URL` on Railway to the check’s ping URL.
   - **SonarQube Cloud:** set GitHub secrets `SONAR_TOKEN` and `SONAR_ORGANIZATION`; the Sonar workflow skips until both exist.

Signup and 2FA emails need a verified Resend domain. Vélib’ alert e-mails use the same mailer.
