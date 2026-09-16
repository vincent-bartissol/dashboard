# Paris Ouverte

French-first civic dashboard on [opendata.paris.fr](https://opendata.paris.fr). Next.js 16, Better Auth, SQLite.

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

SQLite lives in `data/` (gitignored). On boot the app applies Drizzle migrations from `lib/db/migrations` (existing files are baselined, then any new SQL runs once). After changing [`lib/db/schema.ts`](lib/db/schema.ts), run `pnpm db:generate` and commit the new files.

`pnpm test` and `pnpm lint` before pushing. After `pnpm build`, `pnpm test:e2e` runs Playwright smokes (landing, login error, seeded dashboard) plus axe on those pages.

Dependabot opens weekly PRs for npm and GitHub Actions. CI runs `pnpm audit` as a warning (it does not fail the job). [`.github/workflows/uptime.yml`](.github/workflows/uptime.yml) curls [dashboard.vvbb.fr/fr](https://dashboard.vvbb.fr/fr) every hour; a failed run is the alert.

## Lighthouse

GitHub Actions runs Lighthouse without failing the job on scores. Category scores (median of the runs) appear on the Actions **job summary**. Full HTML reports are artifacts on the workflow run.

- **PRs** — [`.github/workflows/lighthouse-pr.yml`](.github/workflows/lighthouse-pr.yml) audits `/fr`, `/fr/login`, `/fr/signup`, then `/fr/dashboard` and `/fr/dashboard/velib` against a local build (seeded session cookie, no production login).
- **Production** — [`.github/workflows/lighthouse-production.yml`](.github/workflows/lighthouse-production.yml) audits [dashboard.vvbb.fr](https://dashboard.vvbb.fr) public pages every Monday at 08:00 UTC. Run it by hand from the Actions tab (`workflow_dispatch`).

## Production (Railway)

This is a Node app with a SQLite file. It cannot run on OVH mutualisé (`vvbb.fr` FTP). Railway runs the container; DNS points **dashboard.vvbb.fr** at it.

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

4. Generate a Railway domain, then add custom domain `dashboard.vvbb.fr`.
5. At OVH (DNS zone `vvbb.fr`): `CNAME` name `dashboard` → the hostname Railway shows. Wait for SSL.

Signup and 2FA emails need a verified Resend domain.
