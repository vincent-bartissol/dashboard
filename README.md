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

SQLite lives in `data/` (gitignored). `pnpm test` and `pnpm lint` before pushing.

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
