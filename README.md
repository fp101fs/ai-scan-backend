# AI Scan Backend

A minimal Next.js backend with Google OAuth authentication, serving as the backend for the AI Detector Chrome Extension.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and fill in your credentials
cp .env.local.example .env.local

# Generate a secret
npx auth secret

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Deployment on Vercel

1. Push this repo to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/new) → Import the repo
3. Set environment variables in Vercel Settings → Environment Variables:
   - `AUTH_GOOGLE_ID` — Google OAuth client ID
   - `AUTH_GOOGLE_SECRET` — Google OAuth client secret
   - `AUTH_SECRET` — random string (run `npx auth secret`)
4. Add authorized redirect URI in Google Cloud Console:
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```
5. Deploy

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout (required by App Router)
│   ├── page.tsx            # Home page with sign-in/sign-out
│   ├── next-env.d.ts       # Next.js type declarations
│   └── dashboard/
│       └── page.tsx        # Protected dashboard page
├── app/api/auth/[...nextauth]/route.ts  # Auth API route
├── auth.ts                 # NextAuth config (Google OAuth, JWT sessions)
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── middleware.ts           # Removed — auth handled in dashboard page
├── package.json
├── .env.local.example      # Template for environment variables
└── public/
    └── favicon.ico         # Extension favicon
```

## Tech Stack

- **Next.js 14** (App Router)
- **NextAuth v4** (stable) — Google OAuth with JWT sessions
- **TypeScript**
- **Vercel** — deployment target

## Authentication

Uses NextAuth v4 with Google OAuth provider. Sessions use JWT strategy (no database required). The dashboard page (`/dashboard`) is protected — unauthenticated users are redirected to the home page.

## License

MIT
