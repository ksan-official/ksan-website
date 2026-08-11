# KSAN Website

Technical baseline for KSAN, Korean Students Association in the Netherlands.

## Stack

- Next.js App Router
- Supabase Auth and database
- Notion API for settlement guide content
- Google Apps Script webhook for Google Sheets copies
- Netlify-ready build config

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in credentials.

3. Run the Supabase schema in `supabase/schema.sql`.

4. Start development:

```bash
npm run dev
```

5. Check integration readiness:

```bash
curl http://127.0.0.1:3000/api/health
```

## Current Product Boundary

- Settlement Guide: Notion authored, custom website rendered.
- Business Hub: admin-managed posts.
- Events: admin-managed events, internal forms optional.
- About: static-looking, data-ready organization info.
- Pass it On and Community: coming soon.
