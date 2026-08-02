# IndexOne — Project Overview

*A plain-language walkthrough of what this project is, how it's built, and what still needs work. Written for the whole team, not just engineers.*

---

## 1. What this actually is

**IndexOne** is a directory website for discovering companies and institutions — right now scoped to two industries in Nigeria: **Fintech** (OPay, Flutterwave, Paystack, etc.) and **Healthcare** (hospitals like Reddington, Lagoon, Duchess International). Think of it as a cross between a business directory, a review site, and a data dashboard: you can browse companies, filter by industry/region/status, read and leave reviews, and (soon) see how "alive" a company actually is based on real signals like whether its website still works.

The pitch on the homepage: **"Discover the products building the next wave."**

The user journey it's built around: **Discover → Explore → Understand → Compare → Review → Participate.**

---

## 2. The tech stack, in plain terms

| Layer | What we use | What it does |
|---|---|---|
| Framework | **Next.js** (React) | Builds both the pages people see and the backend API in one project |
| Database | **Postgres** (hosted on Neon) | Stores all the real data — companies, reviews, users, etc. |
| ORM | **Prisma** | The translator between our code and the database — lets us write JavaScript instead of raw SQL |
| Styling | Hand-written CSS with design tokens | A light, editorial look — indigo/violet accents, Space Grotesk + Inter fonts |
| Hosting | **Vercel** | Where the live site actually runs |

**Why Postgres and not something simpler like SQLite?** We actually shipped with SQLite first (a database that's just a file on disk) because it's dead simple for local development. It broke the moment we deployed to Vercel — Vercel runs the site in a temporary, read-only environment, so a database that lives as a file has nowhere permanent to exist. Postgres is a *real, networked* database that works identically whether it's your laptop or a live server. This was the #1 cause of the "site crashes on every page" bug early on.

---

## 3. How a page actually loads (the practical flow)

1. Someone visits, say, `/directory`.
2. The server runs a database query (via Prisma) that pulls a company **and everything related to it in one shot** — its industry, region, tags, investors, funding rounds, founders, and reviews all come back together.
3. That data gets handed to React, which renders the table/page.
4. The page is sent to the browser already built — no separate "loading..." spinner-then-fetch step for the main content.

**When someone submits something** (a review, a new company listing, a signup) — it's the reverse: the browser sends the form data to an API route, which validates it, checks it's not spam (rate limiting), and writes it to the database.

---

## 4. The data model — what's actually stored

Everything lives in one Postgres database. The core entities:

- **Company** — the actual listings (OPay, Reddington Hospital, etc.). Has a big shared set of fields (name, description, website, status) plus industry-specific fields that only apply to one vertical (e.g. `bedCapacity` for hospitals, `totalFunding` for fintechs — these sit empty/null for the other type).
- **Industry** — the categories. "Fintech" and "Healthcare" are top-level; "Payments," "Lending," "Specialist," "Teaching" etc. are sub-categories underneath them.
- **Region** — the 5 Nigerian states currently covered (Lagos, Abuja, Rivers, Oyo, Kano). This is a **Nigeria-only pilot** — we deliberately don't claim broader coverage we don't have.
- **Feature** — the tag taxonomy used for filtering (e.g. "Cross-Border," "Cardiology"). 17 tags currently.
- **Investor** / **FundingRound** — who's funded which fintech companies, and the actual round history.
- **Person** — founders/leadership on record per company.
- **Review** — real written reviews (author, rating, title, body) tied to a company.
- **User** / **Session** — real accounts with hashed passwords and login sessions.
- **NewsletterSubscriber** — footer email signups.
- **ActivityCheck** *(new)* — a log of real website-reachability checks, explained in section 6.

**Important nuance for anyone touching this:** we did **not** build a fully generic "any category can have any custom field" system. Fintech-specific and hospital-specific fields are hardcoded columns on the `Company` table. That's simpler and faster today, but it means **adding a brand-new category (e.g. "Restaurants") requires an engineer** to add new columns and a bit of code — it's not something anyone can configure through the app itself yet. (Adding a category with *no* special fields — just name/description/region — can actually be done today without code, via Prisma Studio; see section 8.)

---

## 5. What's actually built — feature by feature

**Homepage** (`/`)
- Hero section with the pitch, and a background collage built from real company data (names/logos), not stock images.
- "Ecosystem stats" — flip cards showing real counts pulled live from the database (companies, reviews, investors, states, industries, people, features) — nothing hardcoded.
- A 10-company preview table with filters, linking to the full directory.
- A sign-up pitch, a "what you can do here" section, and an interactive review card-deck (click through real reviews).

**`/directory`** — the full browsable table. Filters by industry, region, status, and tags. Columns adapt depending on category (fintech shows funding/investors; hospitals show bed count/accreditation).

**`/company/[slug]`** — a single company's full profile: overview, key stats, funding history or clinical details (depending on category), reviews, related companies, and (new) activity status.

**Accounts** — `/signup` and `/login` are real: passwords are hashed (never stored in plain text), sessions use secure cookies.

**`/list-your-product`** — anyone can submit a company. It goes in as `unverified`/`pending` — there's currently **no review screen** for a human to approve these; they just sit in the database (see section 7, this is a known gap).

**Reviews** — anyone can leave a review on a company page. It publishes **immediately**, no moderation step yet.

---

## 6. The Activity Intelligence system (newest addition)

The idea: every company should show a clear, honest signal of how active/alive it is, instead of a directory listing quietly going stale forever.

This splits into two genuinely different things:

**A. Lifecycle status** (a human fact, not computed) — `Operating`, `Closed`, `Acquired`, `Merged`, or `Unverified`. A website ping can't tell you a company got acquired (the site often keeps running under new owners), so this has to be set by a person, not inferred.

**B. Activity score** (0–100, computed) — this part is real and automated:
- A scheduled job (once a day) actually visits every company's website and checks: does it load? Is it a "domain for sale" parking page? Has the content changed recently?
- That gets scored into a percentage and a label: 🟢 Growing / Active, 🟡 Low Activity, 🟠 At Risk, ⚪ Dormant — always shown with the label and percentage together, never color alone.
- **This score is a heuristic, not a verified fact.** It's based purely on "is the website up," which is a reasonable proxy but not proof a company is thriving (or dead).

**What's explicitly *not* real yet:** social media monitoring (LinkedIn/X/Instagram/YouTube activity). We don't have API access to any of those platforms, so it honestly shows "Not yet monitored" everywhere rather than faking data. If anyone on the team has developer API access to any of these platforms, that's the next real piece to wire up.

---

## 7. Known gaps — be honest about these with anyone asking

- **No moderation/admin screen.** Pending company submissions and reviews have no review queue — they either sit invisible or go live unmoderated.
- **No sourcing pipeline.** The 11 companies currently in the database were hand-researched and typed into a seed script once. There's no ongoing process to find, verify, or refresh company data at scale.
- **Rate limiting is in-memory**, meaning it only works correctly on a single running instance — fine for now, would need a real store (like Redis) if traffic grows.
- **No password reset or email verification** — signup/login work, but that's the minimal version.
- **Adding a new top-level category** requires an engineer for anything beyond the generic fields (see section 4).

---

## 8. Practical how-tos

**Run it locally:**
```bash
cd roster-db
npm install
# create a .env file with a real DATABASE_URL (ask whoever set up Neon) and a SESSION_SECRET
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**Add a new category without code** (basic fields only): run `npx prisma studio`, open the `Industry` table, add a row (set `parentId` empty for a top-level vertical, or point it at an existing one to nest it as a sub-category).

**Manually run the website activity check:** `npm run check-activity`

---

## 9. One team process note

We've had two incidents now where uncoordinated pushes to `main` caused real breakage — including one merge that got committed with literal unresolved conflict markers still in the code (meaning that file wouldn't have compiled). **Please pull before pushing**, and if a merge conflict shows up, make sure the `<<<<<<<` / `=======` / `>>>>>>>` markers are actually gone before committing — a lot of tools will let you commit a broken merge without complaint.

---

*Last updated to reflect the state of the project as of the activity-intelligence system being added. If something here goes stale, fix the doc, not just the code.*
