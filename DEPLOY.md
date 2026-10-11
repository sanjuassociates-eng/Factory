# Deployment Guide — Vercel + Neon (Free, No Cold Starts)

## Overview

| Part     | Service        | Cost        |
|----------|----------------|-------------|
| Frontend | Vercel         | Free        |
| API      | Vercel Serverless | Free     |
| Database | Neon.tech      | Free (512MB)|

---

## Step 1 — Push your code to GitHub

If you haven't already:

```bash
cd /Users/anurag/Desktop/Factory
git init
git add .
git commit -m "Initial commit"
```

Then create a new repo on github.com and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/steel-factory.git
git push -u origin main
```

---

## Step 2 — Set up the database on Neon

1. Go to **https://neon.tech** → Sign up (free)
2. Create a new project → name it `steel-factory`
3. Choose region closest to India: **AWS ap-south-1 (Mumbai)**
4. Once created, go to **Dashboard → Connection Details**
5. Copy two connection strings:
   - **Pooled connection** (for the app runtime): shown as default
   - **Direct connection** (for migrations): click "Direct connection" tab

They look like:
```
# Pooled (DATABASE_URL)
postgresql://user:pass@ep-xxx-pooler.ap-south-1.aws.neon.tech/neondb?sslmode=require

# Direct (DIRECT_URL)
postgresql://user:pass@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
```

---

## Step 3 — Deploy the API on Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your `steel-factory` repo
3. Configure these settings:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `apps/api` |
   | **Framework Preset** | Other |
   | **Build Command** | `cd ../.. && npm install && npm run build -w @steel-factory/shared && npm run vercel-build -w @steel-factory/api` |
   | **Output Directory** | `.` (leave as dot) |
   | **Install Command** | (leave blank) |

4. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your **pooled** Neon connection string |
   | `DIRECT_URL` | your **direct** Neon connection string |
   | `JWT_ACCESS_SECRET` | any long random string (e.g. `openssl rand -hex 32`) |
   | `JWT_REFRESH_SECRET` | another long random string |
   | `JWT_ACCESS_EXPIRES` | `15m` |
   | `JWT_REFRESH_EXPIRES` | `7d` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | leave blank for now (fill in after Step 4) |

5. Click **Deploy**
6. Once deployed, copy your API URL — it will look like:
   `https://steel-factory-api.vercel.app`

---

## Step 4 — Run migrations and seed the database

After the API deploys, run migrations from your local machine:

```bash
cd /Users/anurag/Desktop/Factory/apps/api

# Set your Neon DIRECT_URL temporarily
export DIRECT_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
export DATABASE_URL="$DIRECT_URL"

# Run migrations
npx prisma migrate deploy

# Seed initial data (admin user, sample products, buyers)
npx ts-node prisma/seed.ts
```

---

## Step 5 — Deploy the Frontend on Vercel

1. In Vercel → **Add New Project** → Import the **same repo** again
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `apps/web` |
   | **Framework Preset** | Vite |
   | **Build Command** | `cd ../.. && npm install && npm run build -w @steel-factory/shared && npm run build -w @steel-factory/web` |
   | **Output Directory** | `dist` |

3. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://steel-factory-api.vercel.app` (your API URL from Step 3) |

4. Click **Deploy**
5. Copy your frontend URL: `https://steel-factory.vercel.app`

---

## Step 6 — Update API CORS

Go back to your **API project** on Vercel:
1. Settings → Environment Variables
2. Set `CORS_ORIGIN` = `https://steel-factory.vercel.app` (your frontend URL)
3. **Redeploy** the API (Deployments → click the latest → Redeploy)

---

## Done! 🎉

Your app is now live at `https://steel-factory.vercel.app`

### Login credentials (seeded):
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@factory.com | admin123 |
| Production Staff | production@factory.com | prod123 |
| Dispatcher | dispatcher@factory.com | dispatch123 |

> **Important:** Change these passwords after first login via the Users page.

---

## Updating the app later

Just push to GitHub:
```bash
git add .
git commit -m "your changes"
git push
```
Vercel auto-deploys both API and frontend within ~1 minute.
