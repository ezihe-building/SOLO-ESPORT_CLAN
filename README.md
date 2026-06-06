# SOLOS+ ESPORTZ — Clan Platform

> One Squad. One Goal. One Legacy.

A mobile-first competitive Call of Duty Mobile clan management platform with tier system, scrims, leaderboards, feed, and announcements.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (dark esports theme)
- **Backend**: Node.js + Express 5 (TypeScript)
- **Database**: PostgreSQL (Drizzle ORM)
- **Session auth**: express-session (cookie-based)
- **Package manager**: pnpm workspaces (monorepo)

---

## Local Development

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (or Supabase)

### Environment Variables

Create a `.env` file in the **root** of the project (or set these in your environment):

```env
# Required
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/postgres
SESSION_SECRET=your-random-secret-here

# Optional
NODE_ENV=development
```

#### Using Supabase

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Project Settings → Database**, copy the **Connection string** (URI mode)
3. Set `DATABASE_URL` to that connection string
4. Project URL: `https://dzpmxcjfjxjxjvpsokcf.supabase.co`
5. Connection string format:
   ```
   postgresql://postgres:[YOUR-DB-PASSWORD]@db.dzpmxcjfjxjxjvpsokcf.supabase.co:5432/postgres
   ```

### Setup & Run

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (in another terminal)
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/solos-esportz run dev
```

---

## Deploy to Render

### Step-by-step

1. **Fork or push** this repository to GitHub
2. Go to [render.com](https://render.com) and click **New → Web Service**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` — or set manually:
   - **Environment**: Node
   - **Build Command**:
     ```
     corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile && pnpm run typecheck:libs && BASE_PATH=/ PORT=3000 pnpm --filter @workspace/solos-esportz run build && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command**: `node artifacts/api-server/dist/index.mjs`

5. **Set Environment Variables** in Render dashboard:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your PostgreSQL URL (Supabase or other) |
   | `SESSION_SECRET` | Any random 32+ char string |
   | `NODE_ENV` | `production` |
   | `SERVE_STATIC` | `true` |

6. Click **Deploy**

> The API server automatically serves the built Vite frontend in production when `SERVE_STATIC=true`.

### Database Migration on Render

After first deploy, run the schema push by temporarily setting this as start command:
```
node -e "require('child_process').execSync('pnpm --filter @workspace/db run push', {stdio:'inherit'})"
```
Then revert to the normal start command.

Or use Supabase's built-in SQL editor to inspect tables.

---

## Hidden Admin Panel

The landing page contains a hidden admin panel accessible without logging in:

1. Scroll to the very bottom of the landing page
2. **Tap the copyright text 7 times** in quick succession
3. Enter the panel password when prompted
4. From the panel you can:
   - Edit any member's stats (kills, deaths, wins, K/D, clan points, MVPs)
   - Change member roles (Clan Master, Co-Leader, Tier 1/2/3, etc.)
   - Change member status (Active, Pending, Suspended, Rejected)
   - Delete members

> **Change the panel password** in `artifacts/api-server/src/routes/panel.ts` (line: `const PANEL_PASSWORD = ...`)

---

## First-Time Setup

1. Register the **first account** — it automatically becomes **Clan Master** with full access
2. All subsequent registrations start as **Pending** and need Clan Master approval
3. Clan Master can access the Management Panel from the Profile tab

---

## Clan Tag Format

All members are displayed as `S²十[username]`

---

## Project Structure

```
artifacts/
  api-server/       — Express API (port 8080 dev / $PORT prod)
  solos-esportz/    — React Vite frontend
lib/
  api-client-react/ — Generated React Query hooks
  api-spec/         — OpenAPI spec
  api-zod/          — Generated Zod schemas
  db/               — Drizzle ORM schema & config
```
