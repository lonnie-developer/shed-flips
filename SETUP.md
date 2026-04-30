# Shed Flips Blog — Setup & Operations

This document captures how the blog is built, deployed, and maintained. It's the "if you (or anyone) walked away for six months and came back, here's how to pick it up" reference.

## Stack at a glance

- **Framework:** [Astro](https://astro.build/) (static site generator)
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/) (free tier)
- **Source:** [github.com/lonnie-developer/shed-flips](https://github.com/lonnie-developer/shed-flips) (public)
- **Live site:** [shed-flips.pages.dev](https://shed-flips.pages.dev/)
- **Custom domain:** none yet — running on the `.pages.dev` subdomain

The whole pipeline is: post markdown lands in `src/content/blog/` → push to `main` on GitHub → Cloudflare auto-builds and deploys → live in ~60 seconds. No manual deploy step.

## Accounts and services

| What | Identifier | Notes |
| --- | --- | --- |
| GitHub | `lonnie-developer` | Personal account, owns the repo |
| Cloudflare | `Lonnie.developer@gmail.com` | Free tier; account ID `3e41076dc2d939f4e1827e57d8429172` |
| GitHub App | "Cloudflare Workers and Pages" | Installed with read/write access to *only* `shed-flips` (and `garage-geek-guy` for the sister blog) |
| Cost | $0/month | All free-tier; only future cost is a custom domain (~$10/yr) |

## Repository structure

```
shed-flips/
├── astro.config.mjs           # Astro build config; site URL set to shed-flips.pages.dev
├── package.json               # Project metadata; name "shed-flips"
├── package-lock.json
├── tsconfig.json
├── README.md                  # Lightweight overview (also useful for first-time GitHub viewers)
├── SETUP.md                   # This file
├── CLAUDE.md                  # Notes for AI assistants working in this repo
├── public/                    # Static assets served as-is (favicon, etc.)
└── src/
    ├── consts.ts              # Site-wide constants: title, channel URL, author byline
    ├── content.config.ts      # Frontmatter schema for blog posts
    ├── styles/global.css      # Theme: dark + kelly-green Shed Flips accent
    ├── assets/
    │   ├── fonts/             # Atkinson Hyperlegible (preloaded)
    │   ├── blog-placeholder-* # Default OG fallback images
    │   └── posts/{slug}/      # Per-post assets (YouTube thumbnails, etc.)
    ├── components/
    │   ├── BaseHead.astro     # <head> meta, OG cards, canonical, RSS link
    │   ├── Header.astro       # Sticky nav with site mark + YouTube CTA
    │   ├── Footer.astro       # Channel link, RSS link, copyright
    │   ├── HeaderLink.astro   # Internal nav link with active-state underline
    │   └── FormattedDate.astro
    ├── layouts/
    │   └── BlogPost.astro     # Post template: YouTube embed → title → byline → tags → body → CTA
    ├── pages/
    │   ├── index.astro        # Homepage with hero + 6 most-recent post cards
    │   ├── about.astro
    │   ├── rss.xml.js         # RSS feed generator
    │   └── blog/
    │       ├── index.astro    # All posts list
    │       └── [...slug].astro
    └── content/
        └── blog/              # Posts live here as `.md` files; filename = URL slug
            └── *.md
```

## How to add a new post

The steady-state workflow for a transcript-derived post:

1. **Pick a video.** From the post-candidate manifest, select one to write up. Run `python3 scripts/queue-status.py` to see how many candidates are unpublished.
2. **Pull metadata + transcript** with `yt-dlp`. The exact invocation requires the `--js-runtimes "node:..."` flag (without it, subtitles fail silently) — see `CLAUDE.md` § "Workflow for a new transcript-derived post."
3. **Pull the YouTube thumbnail** the same way (see `CLAUDE.md`). The thumbnail downloads as `.webp` because ffmpeg isn't always available; `CLAUDE.md` shows the PIL one-liner that converts it.
4. **Research backstory.** Web-search for comparable sales (eBay sold listings, Terapeak), market context, the item's history if relevant, and any platform-specific quirks worth calling out.
5. **Draft the post** at `src/content/blog/{slug}.md` with the frontmatter described below. Match the voice notes in `CLAUDE.md`.
6. **Verify with a build.** Build inside a fresh `/tmp` clone, not the workspace — sandbox-bash environments can't replace cached files in the workspace's `node_modules`. See `CLAUDE.md` § "Sandbox filesystem limitation."
7. **Commit and push** from the same `/tmp` clone (see "Auth & push workflow" below).
8. **Cloudflare auto-deploys** in ~60 seconds. Verify at the live URL.

## Post frontmatter schema

Defined in `src/content.config.ts`. Each `.md` file in `src/content/blog/` must have:

```yaml
---
title: 'String'                  # Required. Used for <h1>, <title>, OG card, post listings
description: 'String'            # Required. Used for OG description and post-card excerpt
pubDate: 'April 29 2026'         # Required. Backdate to the original YouTube upload.
                                 # Canonical format: 'Month DD YYYY' in single quotes,
                                 # space-separated, no leading zero on the day.
                                 # The schema uses z.coerce.date() so other formats parse,
                                 # but stick to this one for consistency.
youtubeId: 'IzdWlySS3kQ'         # Optional. 11-char video ID — embeds video at top of post
heroImage: '../../assets/posts/{slug}/thumbnail.jpg'  # Optional. Used for OG/social card image
tags: ['haul', 'ebay']           # Optional. Renders as #tag pills under the byline
updatedDate: '...'               # Optional. Shown as "Last updated on X" if present
---
```

**Behavior of optional fields:**

- If `youtubeId` is present, the post page shows the YouTube embed at the top *instead of* `heroImage` (they're mutually exclusive in the post layout).
- If `heroImage` is present, it's used as the OG/social-card image when someone shares the URL — even when the post page itself shows the video embed.
- Best practice for transcript-derived posts: set both `youtubeId` (for the in-page embed) AND `heroImage` to the YouTube thumbnail (for the OG card).

## Build settings (Cloudflare Pages)

These are configured once in the Cloudflare dashboard at *Workers & Pages → shed-flips → Settings*:

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |
| Root directory | (project root, default) |
| Environment variables | `NODE_VERSION=22` |

Auto-deploys are enabled. Every push to `main` triggers a fresh build.

## Branding & voice

**Visual:**
- Dark backgrounds (`#0F0F10` page, `#18181A` surfaces)
- Kelly-green accent `#22A040` matching the Shed Flips house-and-family logo
- Atkinson Hyperlegible font (high-readability, accessibility-friendly)

**Author:** byline shows as `Shed Flips` (set in `src/consts.ts`).

**Voice for transcript-derived posts:** see `CLAUDE.md`. Short version: friendly, conversational, specific. Like the friend who's been doing this for years and is happy to walk you through it.

## Auth & push workflow

For batch work, an AI agent (or anyone working from the CLI) pushes directly using a fine-grained Personal Access Token. The token is:

- Scoped to **only** the `shed-flips` repository
- Permissions: **Contents: Read and write** + **Metadata: Read** (auto)
- 90-day expiration; rotate before it lapses
- Persistent backup at `~/.claude/projects/<this-project>/memory/github_pat_shed_flips.md` on Lonnie's Mac (not in the project repo, not committed anywhere)
- Revocable from [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) at any time

If a new session starts with no credentials configured, an AI agent reads the memory-stored token and re-bootstraps git auth automatically — no need to re-paste the PAT.

The project `.gitignore` defensively excludes `.git-credentials`, `*.pat`, `*.token`, `.netrc`, and `secrets/` as a safety net so credential files can never be accidentally committed.

To rotate the token:
1. Generate a new fine-grained PAT at the URL above with the same scope (only `shed-flips`, Contents:read+write).
2. Paste it into chat with the agent.
3. The agent updates the persistent backup memory file.
4. Revoke the old token from GitHub Settings.

For working manually from a GUI: GitHub Desktop or any git client signed in as `lonnie-developer` works without needing the PAT.

## Local development (rare, but documented)

If you ever want to preview locally without pushing:

```
git clone https://github.com/lonnie-developer/shed-flips.git
cd shed-flips
npm install     # first time only
npm run dev     # serves at http://localhost:4321 with hot reload
npm run build   # produces dist/ — same output Cloudflare builds
npm run preview # serves the built site at http://localhost:4321
```

These commands run in Terminal. The point of the rest of the setup is that you don't have to.

## Troubleshooting

**Build fails on Cloudflare but passes locally** — usually a Node version mismatch. The repo's `package.json` declares `engines.node >= 22.12.0`. If Cloudflare's default has drifted, set `NODE_VERSION=22` as a build environment variable in Cloudflare project settings.

**A post's pubDate doesn't sort correctly** — use the canonical format `'Month DD YYYY'` (e.g. `'April 29 2026'`). The schema uses `z.coerce.date()` and accepts other shapes, but mixed formats across posts have caused sort surprises in the past. Stick to one format.

**`npm run build` fails with `EPERM ... unlink ...`** — you're running it inside a sandbox-mounted workspace folder. The agent sandbox can't delete files there, and Vite needs to refresh its cache. Build inside a fresh `/tmp` clone instead. See `CLAUDE.md` § "Sandbox filesystem limitation."

**Pagefind reports "Indexed 0 pages" or unexpectedly few pages** — the `<article data-pagefind-body>` wrapper in `src/layouts/BlogPost.astro` was moved or removed. Pagefind only indexes content inside that wrapper.

**A YouTube embed fails to load on the live site** — confirm the `youtubeId` is the 11-char ID from the URL (the `v=` parameter), not the full URL or the channel handle.

**`yt-dlp` rate-limit errors** — YouTube throttles bursts. If you hit it, wait 15-30 minutes and retry, or add `--sleep-interval 5` between requests when batching.

## Project history (decisions and why)

| Date | Decision | Why |
| --- | --- | --- |
| 2026-04-29 | Forked from the Garage Geek Guy template | Battle-tested Astro+Cloudflare pipeline already exists; cloning is faster and more reliable than building fresh |
| 2026-04-29 | Astro + Cloudflare Pages + GitHub | Free was a hard requirement; static site over Hashnode/Blogger/WordPress for best automation hooks, full ownership, no platform risk |
| 2026-04-29 | No custom domain initially | Defer the $10/yr cost; pages.dev subdomain works fine to start |
| 2026-04-29 | YouTube auto-captions for transcripts | Sufficient for our writing process; no need to build a manual transcript pipeline |
| 2026-04-29 | YouTube thumbnail as `heroImage` | Cleaner OG/social cards than a generic placeholder; matches the channel visually |
| 2026-04-29 | Voice TBD until pilot post lands | Voice will be calibrated against the first 2-3 published posts (see CLAUDE.md "Calibration sample") |

## Future improvements (parked)

- Custom domain (resolves OG/canonical URL, looks more "real")
- Replace the default Astro favicon with a Shed-Flips-branded one
- Replace `blog-placeholder-1.jpg` (the generic OG fallback) with a Shed-Flips-branded fallback graphic
- Add tag pages (`/tags/haul` etc.) listing all posts with that tag
- Newsletter signup integration (Buttondown? Listmonk? — TBD)
