# CíZhī — Chinese–Thai Vocabulary App with Supabase Sync

This version supports two storage modes:

- **Guest mode:** decks are saved in browser Local Storage.
- **Signed-in mode:** decks and learning progress are stored in Supabase and synchronize across devices.

## 1. Create a Supabase project

1. Create a project in the Supabase Dashboard.
2. Open **SQL Editor**.
3. Copy and run everything in `supabase/schema.sql`.
4. Open **Project Settings → API**.
5. Copy the Project URL and Publishable key. Older projects may label this key as the anon/public key.

Never put the service-role key or database password in this app.

## 2. Configure the app

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## 4. Authentication setup

Email/password authentication is enabled by default in most Supabase projects.

For easier local testing, either:

- Keep email confirmation enabled and confirm the email after registration, or
- Temporarily disable **Confirm email** under Authentication settings while developing.

For deployed apps, add the deployment URL under **Authentication → URL Configuration**.

## 5. How synchronization works

- Users can continue using the app without an account; guest decks stay in Local Storage.
- On the first successful login, if the cloud account has no decks, existing local decks are uploaded automatically.
- Later edits are saved locally immediately and synchronized to Supabase after a short delay.
- Each database row contains `user_id`.
- Row Level Security policies ensure authenticated users can only read and change their own rows.
- If the network is temporarily unavailable, local edits remain in the browser and the user can retry synchronization.

## 6. Build

```bash
npm run build
npm run preview
```

## Security notes

The frontend publishable/anon key is designed to be public. Data security depends on the Row Level Security policies in `supabase/schema.sql`. Never disable RLS in production and never expose a service-role key in frontend code.
