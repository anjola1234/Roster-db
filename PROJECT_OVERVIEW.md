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

**When someone submits something** (a review, a new company listing, a claim) — it's the reverse: the browser sends the form data to an API route, which validates it, rate-limits it, and writes it to the database **in a pending state**. Nothing a member of the public submits appears on the site until an admin approves it:

| Submitted | Lands as | Becomes public when |
|---|---|---|
| Company via `/list-your-product` | `status: "pending"` | an admin approves it in `/admin/submissions` |
| Review on a company page | `status: "pending"` | an admin publishes it in `/admin/reviews` |
| Ownership claim on a listing | `status: "pending"` | an admin approves it in `/admin/claims` |

Signups are the exception — an account is created immediately, but a plain account can do nothing except write reviews (which are themselves queued) and claim a listing. Admin rights are never granted through any HTTP endpoint; see section 5b.

---

## 4. The data model — what's actually stored

Everything lives in one Postgres database. The core entities:

- **Company** — the actual listings (OPay, Reddington Hospital, etc.). Has a big shared set of fields (name, description, website, status) plus industry-specific fields that only apply to one vertical (e.g. `bedCapacity` for hospitals, `totalFunding` for fintechs — these sit empty/null for the other type).
- **Industry** — the categories, as a two-level tree. Six verticals are live (Fintech, Healthcare, Engineering & Construction, Science & Research, Legal, Education) with 34 categories under them. `Industry.schemaExtension` names which set of extra fields a vertical uses, and categories inherit it from their parent — this is what the app reads, so the tree is data, not code.
- **Region** — a three-level tree: country > state/province > city. Six countries (Nigeria, Ghana, Kenya, South Africa, Egypt, Rwanda), 49 states/provinces and 37 cities. Filtering is hierarchical, so selecting a country matches every listing beneath it. Coverage is still heavily Nigeria-weighted (30 of 36 listings) and the directory should say so rather than imply even coverage.
- **Feature** — the tag taxonomy used for filtering (e.g. "Cross-Border," "Cardiology"). Tags are scoped to a vertical, so the tag list narrows once a category is chosen.
- **Investor** / **FundingRound** — who's funded which fintech companies, and the actual round history.
- **Person** — founders/leadership on record per company.
- **Review** — real written reviews (author, rating, title, body) tied to a company.
- **User** / **Session** — real accounts with hashed passwords and login sessions.
- **NewsletterSubscriber** — footer email signups.
- **ActivityCheck** *(new)* — a log of real website-reachability checks, explained in section 6.

**Important nuance for anyone touching this:** the vertical-specific columns (`bedCapacity`, `totalFunding`, …) really are physical columns on `Company` — we did **not** build a generic "any category can have any custom field" system. But which listings *use* those columns is now decided by data, not code. `src/lib/verticalSchemas.ts` maps a `schemaExtension` value to a set of fields, and everything that used to branch on a hardcoded slug — the admin form's extra sections, the public profile's section 04, the directory's columns and sort options — reads from it.

What that means in practice:

| You want to… | Effort |
|---|---|
| Add a vertical or category with no special fields | **Data only.** Add a row to `INDUSTRIES` in the seed (or via the admin/Prisma Studio). No code. |
| Add a category that reuses an existing field set | **Data only.** Set `schemaExtension: "fintech_schema"`. No code. |
| Add a country, state or city | **Data only.** Add a row to `REGIONS`. Filters, admin form and directory pick it up. |
| Add a vertical needing genuinely new fields | **Migration + one entry** in `verticalSchemas.ts`. Still not configurable through the app. |

The last row is the real remaining limit, and it's deliberate: a field has to exist as a column before anything can store it.

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

**`/list-your-product`** — anyone can submit a company. It goes in as `unverified`/`pending` and is **not publicly visible** until an admin approves it in the dashboard (see section 5b).

**Reviews** — a signed-in user can leave a review on a company page. It's held as `pending` and only appears once an admin publishes it.

**`/admin`** — the operations dashboard. See section 5b.

---

## 5b. The admin dashboard

Everything at `/admin` requires a logged-in account with `role = "admin"` on the `User` table. That column is never written by any HTTP endpoint — the only way to grant it is from the command line by whoever holds the database credentials.

**Quickest way in (local dev):**

```bash
npm run seed-admin
```

That creates `admin@indexone.test` / `indexone-admin-2026` and marks it admin. Log in at `/login` and the **Admin** link appears in the nav. Re-running it resets the password, so it doubles as a recovery hatch when someone forgets it.

**These demo credentials are public** — they're in this file and in the repo history. `seed-admin` therefore refuses to create them when `NODE_ENV=production`, because a known email and password with full moderation rights on a live public directory means anyone who reads the source can edit, publish or delete every listing.

**For a real deployment**, sign up through the app and grant the role explicitly:

```bash
npm run make-admin -- someone@example.com     # grant
npm run make-admin -- someone@example.com --revoke
```

(Or set your own `ADMIN_EMAIL` and `ADMIN_PASSWORD` and run `seed-admin` — with those set it works in production too, since the credential is no longer in the codebase.)

Non-admins are redirected away from `/admin` and get a 403 from every `/api/admin/*` endpoint. The check is a live database lookup on every page and request, not a cached claim in a cookie.

**What it does:**

| Screen | Purpose |
|---|---|
| `/admin` | Queue counts and the oldest items waiting on you |
| `/admin/companies` | Browse, search and filter every listing; verify / archive / delete inline |
| `/admin/companies/new` | Full company form — base fields plus fintech or hospital fields depending on the category picked |
| `/admin/companies/[id]` | The same form, prefilled, for editing |
| `/admin/companies/import` | CSV bulk import, with a dry-run check before anything is written |
| `/admin/submissions` | Public submissions awaiting approval, oldest first |
| `/admin/claims` | People claiming they represent a listed company |
| `/admin/reviews` | Review moderation, tabbed by status |

**Ownership claims.** `ListingClaim` existed in the schema but nothing wrote to it, so the queue would have been permanently empty. There's now a "Claim this listing" control on each company page (`POST /api/claims`) that feeds it. Approving a claim writes a `ListingVerification` badge recording who approved it and when, and marks the listing verified. The queue shows whether the claimant's email domain matches the listed website — that's a **hint, not proof**: it's spoofable, and a mismatch is perfectly normal for an agency or someone using a personal address. Confirm people independently.

**Two behaviours worth knowing:**

- **Ratings are recomputed from published reviews.** Publishing or unpublishing a review recalculates `ratingScore` / `ratingCount` / `ratingDist`. The 11 seeded companies carry hand-entered demo aggregates with no `Review` rows behind them, so the first moderation action on one of those replaces the demo figure with the real one — OPay went from 4.6 / 128 reviews to 4.67 / 3 in testing. That's intended (the number should describe data we actually hold) but it is a visible drop. The logic is isolated in `recomputeRating()` in `src/lib/companyWrite.ts` if you'd rather it worked differently.
- **Renaming a company does not change its slug.** The URL stays stable so existing links don't break. Edit the slug field directly if you actually want it to move.

---

## 5c. Sectors, geography and links (August 2026 pass)

**Six verticals, not two.** Fintech and Healthcare were joined by Engineering & Construction, Science & Research, Legal, and Education — 34 industries in total, all with listings. Adding another vertical means adding rows to `INDUSTRIES` in the seed; the directory tabs, the public submission form and the admin company form all read the taxonomy from the database and pick it up automatically. `VERTICAL_META` in `DirectoryApp.tsx` is optional display polish, not a registry you must keep in sync.

**Geography is a real country > state > city tree.** Six countries (Nigeria, Ghana, Kenya, South Africa, Egypt, Rwanda), 49 states/provinces, 37 cities. Two things were fixed to make it usable:

- `buildWhere` matched region slugs exactly, so filtering by a country returned nothing at all. `expandRegionScope()` now resolves a slug to itself plus all descendants — `region=ng` matches every Nigerian state and city.
- Listings only attached to states, so city filters returned zero. The seed now also links a listing to its city region when its free-text `city` matches one. Cities named on a listing but missing from `REGIONS` are reported at the end of the seed run rather than silently dropped.

**The directory is deep-linkable.** Previously only `?q=` was read from the URL and every other filter reset to "all" on load — which is why the footer's "Industries" and "Regions" links had nowhere meaningful to point. All filters now initialise from the URL and mirror back to it, so `/directory?vertical=legal&region=lagos` is a real, shareable view.

**Dead links are gone.** Fixed: three `href="#"` social stubs and a `#` Contact in the footer; five "Discover" links that all pointed at bare `/directory` regardless of their label; and placeholder `"#"` social handles on seeded companies, which rendered as icons that looked live and went nowhere. `socialIcons()` now only renders a handle that is an actual http(s) URL. A crawl of every page finds 33 internal link targets, all 200, no placeholders.

**Sort options are per-vertical.** "Most funded" and "Most beds" only appear where those columns exist — offering them on law firms or universities was a control that silently did nothing.

---

## 5d. Audit log

Every consequential admin action is recorded in an append-only `AuditLog` table: who did it, to what, what changed field-by-field, why, and on what evidence. This is spec sections 12 and 26, and it was built first among the remaining gaps for one reason — it's the only feature that **cannot be backfilled**. Every day without it is history permanently lost.

Logged actions: company create / update / delete / bulk import, all seven moderation actions (approve, reject, verify, unverify, flag, archive, restore), review publish / reject / remove / unpublish, claim approve / reject / revoke, and full website activity sweeps.

**Design decisions worth knowing:**

- **Logging never breaks the action.** If the audit write fails, the approval still happens and the admin still sees success; the failure goes to the server console. An admin unable to moderate because a logging table is unhappy is worse than a gap in the log.
- **Snapshots, not joins.** `actorEmail` and `targetLabel` are copied in at write time, so an entry still reads correctly after the company is deleted or the admin's account is removed. `actorId` is `ON DELETE SET NULL` for the same reason — deleting an admin must not erase what they did.
- **Deletes are logged before the delete**, since afterwards there's no row left to describe.
- **Dry-run imports are not logged.** They write nothing, so logging them would fill the trail with actions that never happened.
- **Per-listing activity checks are not logged**, only full sweeps — a single check is read-only diagnostics run constantly, and `WebsiteCheck` already holds that history.
- Passwords and session tokens are redacted from diffs unconditionally; long values are truncated.

Browse at `/admin/audit`, filter by area, action, or free text across target/admin/reason, and click "history" on any entry for that record's full trail. Nothing in the product edits or deletes entries — a correction is a new entry, not a rewrite.

**One immediate benefit.** The first real edit logged revealed that a partial `PATCH` to the company endpoint silently clears any field it doesn't send (the form always sends everything, so this is correct behaviour — but it was previously invisible). That's the kind of thing the log exists to surface.

---

## 5e. Evidence & verification

Spec sections 13, 14 and 29. The `FieldProvenance` and `DataSource` tables already existed with 18 seeded rows carrying real source URLs — nothing read or wrote them, so the evidence was invisible in the product.

**The distinction being enforced** (§29): holding a value is *data*, citing a source is *evidence*, and a person confirming it is *verification*. These are three separate states and the UI never blurs them. `FieldProvenance` gained `verifiedById`, `verifiedAt` and `note` so the third can be expressed at all — before, a row could cite a source but never say whether anyone had checked it.

**Admin** — `/admin/companies/[id]/evidence`: attach evidence to any field, pick a `DataSource`, record URL/confidence/note, mark one row authoritative per field, and verify or withdraw verification separately from recording the source. Evidence for the same field is grouped so conflicting sources sit side by side.

**Public** — the profile's existing "Source & verification" section now carries a per-field table: the value on record, where it came from, and whether it's verified or merely cited, with a note telling readers to treat unverified rows as leads rather than facts.

**Decisions worth knowing:**

- **Only authoritative rows publish.** The losing side of a source conflict is kept but stays internal — publishing both would present a contradiction as though it were balanced truth. Verified in testing: two conflicting registration numbers, only the CAC-sourced one renders.
- **Verification is opt-in, never implied.** Attaching evidence leaves a row unverified unless the admin ticks "I have personally confirmed this". All 18 seeded rows therefore show as cited-but-unverified, which is accurate — they came from research, not confirmation.
- **Legacy keys were remapped.** Seeded provenance used snake_case names (`total_funding_raised`) matching no real column, so evidence could never join back to the value it supported. `LEGACY_KEY_ALIASES` in `src/lib/evidence.ts` normalises them; `funding_round:*` keys are deliberately left alone since they describe a round, not a column.
- Every evidence action is audited, and deletions are logged before the delete.

Freshness bands from §19 (`fresh` / `aging` / `stale` / `very stale`) are implemented in `src/lib/evidence.ts` and shown on verified rows in the admin view.

---

## 5f. Company comparison

Spec section 7, at `/compare`. Pick up to four listings; selection lives entirely in the URL (`/compare?c=opay,flutterwave`) so a comparison is a link you can send.

**The rows adapt to the category**, which the spec asks for explicitly. Rather than a third hand-maintained list of what each vertical cares about, comparison reuses the same extension schemas that drive the admin form and the public profile. The rule: shared rows always render; a vertical's extra rows render only when *every* selected listing uses that schema.

Verified in testing:

| Comparison | Sector rows shown |
|---|---|
| Two fintechs | Funding, valuation, licences, investors, funding rounds |
| Two hospitals | Bed capacity, emergency department, accreditations, ownership |
| Fintech vs law firm | None — with an on-screen explanation of why |
| Two law firms | None — both use base fields only, also explained |

That last behaviour is deliberate. Rendering "Bed capacity: 120 vs —" across a hospital and a law firm invites a comparison that isn't meaningful, so the block is hidden and the page says so rather than leaving a reader wondering whether it's a bug.

**Other decisions:**

- **"Show differences only"** filters to rows where the listings actually diverge, with a count of what's hidden.
- **Never-measured is not zero.** A listing with no activity check shows "Not checked", not "0/100" — those mean very different things and the comparison is exactly where that confusion would matter.
- The evidence row surfaces "*n* of *m* fields verified", so a reader can see which listing's data is better attested, not just what it claims.

---

## 6. The Activity Intelligence system

**Now runnable from the UI.** The checker was always real code — genuine outbound HTTP GETs, parked-domain sniffing, content hashing, scores derived only from recorded history. What was missing was any way to run it or see it. `/admin/activity` now lists every listing with its last result, check count and last-checked time, with a "Check now" per listing and a "Run all" button, backed by `POST /api/admin/activity`. The nightly Vercel cron at 06:00 UTC still calls the same function and needs `CRON_SECRET` set.

**Run it after seeding.** Seeded and imported listings arrive `unverified` with no activity score on purpose. `npm run check-activity` (or the admin button) is what confirms their websites resolve. A listing that has never been checked shows no score at all rather than a fabricated one.

**Two honest caveats.** Some sites return 403 to non-browser user agents, so a real company can be recorded "unreachable" — verify before acting on a low score. And the score measures whether a website responds; it is not a measure of business health.

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

- ~~No moderation/admin screen.~~ **Done** — see section 5b.
- **Fixed along the way: non-active listings were public.** The public queries in `queries.ts` filtered on `verification` but never on `status`, so every pending public submission was live on the directory the moment it was submitted — the opposite of what this document used to claim. Public reads are now restricted to `status = "active"`. If you have a listing that has quietly gone missing from the directory, check its status in the admin dashboard.
- **Seeded sector data is researched, not verified.** The engineering, science, legal, education and non-Nigerian listings are real organisations at their real public domains, but the descriptions were written from general knowledge rather than scraped from a primary source. Every one is seeded `unverified`, with no rating, and with funding/valuation/headcount left blank rather than guessed. Run the activity checker and spot-check before treating any of it as authoritative — there's a provenance block in `seed.ts` saying the same thing.
- **`hello@indexone.example` on the /about page is a placeholder.** It's the only fake destination left in the app; swap it for a real inbox before launch.
- ~~No audit log.~~ **Done** — see section 5d.
- **The audit log starts empty and cannot be backfilled.** Actions taken before it was added were never recorded.
- **Still unbuilt from the product spec:** activity signals beyond website reachability with admin-configurable weights (§4 — `ScoreWeight` likewise exists unused), entity-aware and natural-language search (§2), and the whole API ingestion / connector / change-detection subsystem (§15–18).
- **11 schema models still have no application code reading them:** `Product`, `JobPosting`, `NewsItem`, `SocialMetric`, `TrafficEstimate`, `CrawlRun`, `ScoreWeight`, `ListingCorrection`, `ListingCurrentSignal`, `CompanyCategory`, `Award`. (`FieldProvenance`, `DataSource` and `FieldDefinition` are now wired up — see sections 5e and 4.) Some carry seeded sample rows, which makes features look half-built in the database while being entirely absent from the product. They're being wired up as the features that need them get built.
- **No email notifications.** Approving or rejecting a submission or claim doesn't tell the submitter anything — you have to contact them yourself.
- **`ListingCorrection` still has no UI.** The table exists and the schema supports "report this listing as closed / wrong / duplicate", but nothing reads or writes it yet.
- **No sourcing pipeline.** The 11 companies currently in the database were hand-researched and typed into a seed script once. There's no ongoing process to find, verify, or refresh company data at scale.
- **Rate limiting is in-memory**, meaning it only works correctly on a single running instance — fine for now, would need a real store (like Redis) if traffic grows.
- **No password reset or email verification** — signup/login work, but that's the minimal version.
- **Adding a new top-level category** requires an engineer for anything beyond the generic fields (see section 4).

---

## 8. Practical how-tos

**Run it locally:** requires Node 20.19+ or 22.12+ (Prisma 7's floor — see `.nvmrc`).
```bash
npm install
# create .env with a real DATABASE_URL and a SESSION_SECRET
npx prisma generate
npx prisma migrate deploy   # use the DIRECT Neon URL, not the -pooler one
npx prisma db seed          # migrations do NOT seed; this is a separate step
npm run dev
```

*Two things that bite people here.* `prisma migrate deploy` fails with a P1002 advisory-lock timeout against Neon's pooled endpoint — run it against the direct (non-`-pooler`) host. And `migrate deploy` only changes schema; if the directory looks empty or stale, you haven't run `db seed`.

**Add a category, vertical, country, state or city — no code:**
1. Add the row to `INDUSTRIES` or `REGIONS` in `prisma/seed.ts` and re-run `npx prisma db seed` (upserts, so it's safe to re-run and won't touch user data), or add it directly via `npx prisma studio`.
2. For an industry, set `schemaExtension` to inherit an existing field set (`"fintech_schema"`, `"hospitals_schema"`) or leave it null / `"base only"` for name-description-region listings.
3. Nothing else. The directory tabs, filters, region picker, public submission form and admin company form all read the taxonomy from the database.

Adding a vertical that needs *genuinely new* fields is the one case that still needs an engineer — see the table in section 4.

**Manually run the website activity check:** `npm run check-activity`

**Get into the admin dashboard locally:** `npm run seed-admin`, then log in as `admin@indexone.test` / `indexone-admin-2026`

**Grant an existing account admin access:** `npm run make-admin -- you@example.com` — use this one for anything deployed

---

## 9. One team process note

We've had two incidents now where uncoordinated pushes to `main` caused real breakage — including one merge that got committed with literal unresolved conflict markers still in the code (meaning that file wouldn't have compiled). **Please pull before pushing**, and if a merge conflict shows up, make sure the `<<<<<<<` / `=======` / `>>>>>>>` markers are actually gone before committing — a lot of tools will let you commit a broken merge without complaint.

---

*Last updated to reflect the state of the project as of the activity-intelligence system being added. If something here goes stale, fix the doc, not just the code.*
