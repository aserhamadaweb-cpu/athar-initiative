<img src="public/brand/athar-logo.jpg" alt="ATHAR" width="168" />

# ATHAR

The website for the ATHAR youth volunteer initiative. People come here to read the story, find a way to take part, follow updates, and play a short game about the mark a small good step can leave.

English is the language of the site. Arabic is one tap away, at `/ar`, and it reads right to left.

**Live site:** [atharinitiative.vercel.app](https://atharinitiative.vercel.app)

## What visitors can do

| Page | Address | Who it is for |
| --- | --- | --- |
| Home | `/` | Everyone. The story, the paths, and a note to the team. |
| Volunteer | `/volunteer` | People choosing a path, plus the honored members. |
| Updates | `/updates` | Anyone following the news. |
| Game | `/game` | A short pause: plant a seed and watch it grow. |
| Teams | `/teams` | Members, after the members password. |
| Admin | `/admin` | The desk for news, links, forms, honored members, and messages. |
| Teams desk | `/admin/teams` | The desk for departments, members, and tasks. |

The same pages exist in Arabic under `/ar`, for example `/ar/volunteer`.

A visitor can leave a message. Only the admin desk can read the messages that come in.

## Install it like an app

The header and footer include **Get the app**. On Chrome and Edge for Windows or Android, that opens the install prompt and adds ATHAR to the home screen or Start menu. On iPhone, Safari uses Share, then Add to Home Screen. The button explains that step.

## Run it on your computer

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run lint
```

## Environment

Copy `.env.example` to `.env.local`. Keep the real values on your machine and in the host. They never belong in git.

| Name | What it is |
| --- | --- |
| `SUPABASE_URL` | The ATHAR Supabase project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | The publishable key. The browser and the server use it for public reads. |
| `ADMIN_PASSWORD` | The password for `/admin`. |
| `ADMIN_SESSION_SECRET` | A long random string that signs the admin and member sessions. |
| `ADMIN_GATE` | The private token stored in Supabase. Admin writes send it, and the database checks it. |
| `MEMBER_PASSWORD` | The password for `/teams`. |

## Database

The live site already has its database. For a new Supabase project, run these files in the SQL editor, in this order:

1. `supabase/schema.sql` creates updates, messages, honored members, links, and people.
2. `supabase/admin_controls.sql` creates the private admin gate and the write rules.
3. `supabase/org.sql` creates departments, members, and tasks.

Public visitors can read published news and honored members, and they can leave a message. Writing teams, members, tasks, news, and links stays behind the admin gate.

## How the code is arranged

```
src/app            pages, the install manifest, and server actions
src/components     the interface, grouped by home, teams, admin, and chrome
src/i18n           English and Arabic routing
src/lib            Supabase, sessions, and shared data
messages           the English and Arabic strings
public/brand       the ATHAR logo
public/icons       the icons for the installable app
supabase           the database scripts, in the order above
```
