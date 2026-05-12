# Google Login Setup

This app is wired for Supabase Google OAuth in code. The remaining dashboard setup must be done in Google Cloud and Supabase because it uses your OAuth Client ID and Client Secret.

## App URLs

Use these values for local development:

- App origin currently used by the running Vite app: `http://localhost:5175`
- App callback URL: `http://localhost:5175/auth/callback`
- Dev script origin if you run `npm run dev`: `http://localhost:3000`
- Dev script callback URL: `http://localhost:3000/auth/callback`
- Supabase project callback URL for Google OAuth: `https://bydicprzizmiywzykofr.supabase.co/auth/v1/callback`

## Google Cloud

Create an OAuth Client ID with type `Web application`.

Authorized JavaScript origins:

- `http://localhost:5175`
- `http://localhost:3000`
- Add the production origin when deployed.

Authorized redirect URIs:

- `https://bydicprzizmiywzykofr.supabase.co/auth/v1/callback`

Required scopes:

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

## Supabase Dashboard

Authentication > URL Configuration:

- Site URL: the active app origin, for example `http://localhost:5175`
- Redirect URLs:
  - `http://localhost:5175/auth/callback`
  - `http://localhost:3000/auth/callback`
  - Add the production callback URL when deployed.

Authentication > Providers > Google:

- Enable Google provider.
- Paste the Google OAuth Client ID.
- Paste the Google OAuth Client Secret.

## Code Wiring Already Done

- Google button calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- OAuth redirect target is `/auth/callback`.
- Supabase client uses PKCE, URL session detection, persistent sessions, and token refresh.
- `/auth/callback` handles provider errors and redirects successful users to `/profile`.
