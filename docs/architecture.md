# KSAN Website Technical Baseline

## MVP Scope

- Open in September: Settlement Guide, Business Hub, Events, About.
- Visible but closed: Pass it On, Community.
- Settlement Guide uses Notion as the writing source and the website as the professional reading surface.
- Business Hub uses Supabase/admin-created posts. Initial applications can route to email or external links, with internal forms supported.
- Events can use internal forms, external links, or Google Forms. Internal submissions are stored in Supabase and optionally copied to Google Sheets.
- My Page starts with profile, saved guides, saved posts, and submitted applications. Community and secondhand records are future-facing.

## Data Ownership

- Supabase is the source of truth for users, profiles, business posts, events, about entries, saved items, and applications.
- Google Sheets is a synced operational copy for applications, not the source of truth.
- Notion is the authoring source for settlement guide articles only.

## Notion Database Contract

Create a Notion database for guides with these properties:

- `Title`: title
- `Slug`: rich text
- `Category`: select
- `Summary`: rich text
- `Author`: rich text
- `Updated`: date
- `Tags`: multi-select

The app reads page blocks and builds article headings into a table of contents.

## Supabase Auth

- Enable email/password auth.
- Enable email confirmation for production.
- Add allowed school domains in `allowed_email_domains`.
- Promote admins by setting `profiles.role = 'admin'` in Supabase.
- Configure production SMTP before public signup, because default Supabase email delivery is limited.

## Google Sheets Sync

The first implementation target is Apps Script webhook sync:

1. Create a Google Sheet.
2. Add an Apps Script web app with `doPost`.
3. Validate `X-KSAN-Webhook-Secret`.
4. Append the incoming payload as one row.
5. Save webhook URL and shared secret in environment variables.

Supabase stores each application first. If Sheets sync fails, the application still exists and `sheets_sync_status` is marked `failed`.
