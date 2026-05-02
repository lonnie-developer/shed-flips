# Notes for Claude — Shed Flips blog

This file is for Claude (and any AI assistant) working in this repo. It captures the conventions and judgments that aren't obvious from reading the code. For the broader project setup, see [SETUP.md](./SETUP.md).

## Session bootstrap (first interaction in a fresh sandbox session)

Do these once at the start of a new session, before doing real work. They're cheap and one-shot. (If you're working on Lonnie's local Mac instead of a sandboxed agent environment, skip to step 2 — paths like `/sessions/...` don't apply.)

**0. Get your session ID and set up paths.** Every bash call below uses absolute paths to `/sessions/<your-session-id>/...`. Each bash call is independent (no env carryover), so put `SESSION_ID` and `BUILD_DIR` definitions at the top of every multi-step bash block, like this:

```bash
SESSION_ID=$(pwd | awk -F/ '{print $3}')   # current session is the third path component of pwd
echo "SESSION_ID=$SESSION_ID"
# Use $SESSION_ID anywhere you'd otherwise hard-code "kind-cool-hamilton" or similar
```

If you find yourself typing the literal string `<session-id>` into a path, you forgot this step.

**1. Install yt-dlp and Pillow** (used for pulling video metadata, transcripts, and thumbnails — needed for any new post). Idempotent; safe to re-run if you're not sure of state.

```bash
pip install --quiet --break-system-packages --no-warn-script-location yt-dlp Pillow
# yt-dlp lands at /sessions/$SESSION_ID/.local/bin/yt-dlp — invoke with the full path
```

**yt-dlp JS runtime fix (required for subtitle download).** Some sandboxes have no Deno; yt-dlp ≥ 2025 requires a JS runtime to extract YouTube data. Without it, `--write-auto-subs` silently produces no VTT files. Pass the `node` runtime explicitly on every yt-dlp call:

```bash
SESSION_ID=$(pwd | awk -F/ '{print $3}')
NODE=$(which node)                                       # /usr/bin/node
YTDLP="/sessions/$SESSION_ID/.local/bin/yt-dlp"

$YTDLP --js-runtimes "node:$NODE" --skip-download --write-auto-subs \
  --sub-lang en --sub-format vtt \
  --output "/tmp/{slug}" \
  "https://www.youtube.com/watch?v={VIDEO_ID}"
```

The `NODE`, `YTDLP`, and `SESSION_ID` definitions and the call must run **in a single bash invocation** — variables don't carry across calls.

**If yt-dlp fails to produce VTT files, stop and check with Lonnie — do not proceed to write posts without transcripts.** The warning `No supported JavaScript runtime could be found` means the `--js-runtimes` flag was omitted or formatted wrong.

**2. Configure git auth using the persisted PAT.** The token is stored at the path linked from `MEMORY.md` under the entry titled "GitHub PAT — shed-flips". `MEMORY.md` is loaded into your context automatically, so use the Read tool on the linked file (a markdown file in the same memory directory) to get the token. Then in bash:

```bash
TOKEN="<paste-token-from-memory-file>"
git config --global user.name "Lonnie Honeycutt"
git config --global user.email "lonnie.honeycutt@gmail.com"
git config --global credential.helper store
python3 -c "
import os
path = os.path.expanduser('~/.git-credentials')
with open(path, 'w') as f:
    f.write('https://lonnie-developer:$TOKEN@github.com\n')
os.chmod(path, 0o600)
"
# Verify by trying a fetch from a fresh clone (see step 3)
```

If the bootstrap fails (PAT expired, memory file moved, fetch returns 401), tell Lonnie what's wrong and ask for a fresh PAT — don't silently degrade.

**3. Get a fresh checkout in `/tmp` and verify the project state.**

The workspace's local `.git` is **stale** — it lags origin/main because pushes happen from `/tmp` clones, and the sandbox can't keep the workspace's git state in sync. So `git status` in the workspace will show "your branch is behind by N commits" and report phantom modifications on files that were already committed and pushed. That's an artifact of the workspace `.git` being stale, not a real diff. **Don't trust the workspace's `git status` to decide what needs committing.**

Get an authoritative view by cloning fresh from origin into `/tmp`. Use a timestamped path because `/tmp` accumulates leftover dirs across sandbox sessions, and old dirs owned by `nobody:nogroup` can't be removed:

```bash
BUILD_DIR=/tmp/shed-flips-build-$(date +%s)
git clone --quiet https://github.com/lonnie-developer/shed-flips.git "$BUILD_DIR"
cd "$BUILD_DIR"
git log --oneline -5                # what's actually live
python3 scripts/queue-status.py     # published vs. remaining
echo "$BUILD_DIR" > /tmp/builddir.txt   # remember the path for later bash calls
```

Anything in `$BUILD_DIR` after the clone is already live; don't re-commit it. To check whether an unstaged-looking workspace file is actually a new change, compare against `$BUILD_DIR/<same-path>`.

**4. Sandbox filesystem limitation — what works where.**

The bash sandbox can **read** and **write** files anywhere in the workspace. What it cannot do is **`unlink`** (delete) any file it sees there, even files it just created. Two consequences:

- `npm run build` in the workspace fails. Vite tries to delete `node_modules/.vite/deps/_metadata.json` to refresh its dependency cache — `EPERM: operation not permitted, unlink`. Pagefind also wants to clear out and rewrite `dist/pagefind/`. Build only in `$BUILD_DIR` (a `/tmp` clone), where the sandbox owns the filesystem.
- `cp -r "<workspace>" /tmp/...` is unreliable. The `.git/objects/*` files hit "Resource deadlock avoided" on the macOS-bridged filesystem and the copy aborts mid-tree. **Use `git clone` from origin (step 3), not `cp -r`.**

`git` *commands* run fine in the workspace (`git status`, `git fetch`, `git pull`). They just operate on the stale local `.git` (see step 3). Use them for read-only inspection only; never push or commit from the workspace.

The Write/Edit file tools take a different path — they go through the macOS host, not the bash sandbox — so they CAN edit and create files in the workspace, including overwriting existing ones. Use them for editing posts and components. They cannot delete files either.

After bootstrap, the steady-state for any change is: edit files in the workspace via Write/Edit → `cd $BUILD_DIR && cp -r workspace-changed-files . && npm run build && git add ... && git commit && git push`. (Or, in practice, edit in `$BUILD_DIR` directly and let the workspace catch up on its own next session — only the GitHub remote is the source of truth.)

## What this project is

The blog is the written companion to **four** YouTube properties Lonnie and Candice are part of (as of 2026-05-01):

- **[Shed Flips](https://www.youtube.com/@shedflips)** — flagship reselling channel, long-form, alternates release days with I'm Gonna Pack It.
- **[I'm Gonna Pack It](https://www.youtube.com/@imgonnapackit)** — packing-day companion channel; same Lonnie-and-Candice voice, focused on order fulfillment.
- **[Garage Flips](https://www.youtube.com/@garage-flips)** — newer channel, currently shorts-only (~5/week) with a planned weekly long-form compilation. **Garage Flips shorts get blog posts** as cross-promo for the new channel; shorts on the *other* three properties do not.
- **[The Lonnie & Ryan Podcast](https://www.youtube.com/@LonnieandRyan)** — weekly podcast Lonnie co-hosts with his friend Ryan; episodes run 80–120+ minutes.

The site is the umbrella ("Shed Flips" stays the brand name); each post belongs to exactly one of the four properties via a `property` frontmatter field, and the property drives the landing page it appears on, the accent color of the page, and the chip on its preview card. Each post is still the written form of a video: video embedded at the top, then a writeup that adds whatever the video doesn't already convey — concrete numbers, story context, and timestamps for the moments worth jumping back to. See § **Multi-property structure** below for the per-property differences (writeup style, length targets, voice notes, accent colors).

## Multi-property structure

Each property has:

- **Landing page** at `/<slug>` — generated by the dynamic route at `src/pages/[property].astro`. Hero shows the channel avatar, name, tagline, description, and a Subscribe button; below that is a filtered feed of that property's posts. Slugs: `shed-flips`, `im-gonna-pack-it`, `garage-flips`, `podcast`.
- **Accent color** that drives `--accent` and `--accent-dark` site-wide when you're on that property's landing page or one of its posts (set via inline style on `<html>`). Cards on the homepage and `/blog` mixed feed pick up the property's accent on the chip + thumbnail-area gradient even when the surrounding page is on a different accent.
- **Property chip** rendered on every PostCard (top-left of the thumbnail).

Single source of truth for per-property metadata is `PROPERTIES` in `src/consts.ts` — chipLabel, tagline, description, channel URL, accent, accentDark, chipText. Add a property here, set `property: '<slug>'` on the relevant posts, drop the channel avatar into `src/assets/brand/<property>-logo.jpg` (and import it in `src/pages/[property].astro` `LOGOS` map), and the landing page picks it up automatically. Top-nav links live in `src/components/Header.astro`.

**Accent color mapping:**

| Property | Accent | Accent-dark | Chip text |
|---|---|---|---|
| shed-flips | `#1B8038` (kelly green) | `#145E27` | white |
| im-gonna-pack-it | `#3D55B0` (royal blue) | `#2B3F87` | white |
| garage-flips | `#E59A0A` (warm orange) | `#B27600` | `#0F3445` (deep navy) |
| podcast | `#9C2C32` (brick maroon) | `#741F25` | white |

Garage Flips uses navy chip text on an orange chip (the orange wouldn't have legible white text at chip size). Other properties use white text on their accent.

### Per-property writeup style

| Property | Length | Format | Notes |
|---|---|---|---|
| shed-flips | 800-1500 words | Haul / sourcing / strategy / sold-stats with 3-6 timestamped highlights | The original Shed Flips style. See § Post structure template. |
| im-gonna-pack-it | 800-1300 words | Packing-day with timestamped pack moments | Lean into pack-decision moments (box choices, mailer tricks, what could've broken). Frame is "we earned this" or "we dreaded this," not "haul recap." |
| garage-flips | 100-300 words | One scene from a short — what stopped you cold at a table | Auto-subs from shorts are rough; if there's not much to mine, keep it tight (1-3 paragraphs). **Shorts only on this property** (no shorts posts on other channels). |
| podcast | 800-1200 words | Episode-notes: 5-10 timestamped highlights of the conversation | Episodes are 80-120+ min. Tease the moments worth clicking; don't summarize the whole conversation. Personal/sensitive moments — name them, don't paraphrase the testimony. |

### Voice across the network

Lonnie and Candice's voice is consistent across all four properties — they don't switch personas. The voice.md calibration applies to every property. **Write in Lonnie's first-person voice** ("I" / "we"), not third-person narration about him; he's the user, his voice on the page is the whole point. Reference Candice / Ryan / guests by name when *they're* the actor, just like a video frames Lonnie's POV with Candice in shot.

**Ryan** (podcast co-host) is the only new voice; his patterns are still being learned. As podcast posts ship, add Ryan-specific catchphrases or quirks to `voice.md` § Who and § Things we say.

**I'm Gonna Pack It opener** mirrors the Shed Flips one almost exactly: *"Hello everyone. Welcome back to I'm Gonna Pack It. I'm Lonnie."* / *"Hey, I'm Candice. Welcome back."* Soft nod at the top of a post is fine; don't paste it verbatim.

## Voice — the most important thing to get right

**Read [`voice.md`](./voice.md) first.** It's the canonical reference for catchphrases, banned words, how we talk about platforms, money, and sourcing, and the calibration sample (once locked). The voice principles below are the *summary*; voice.md is the *authority*. When voice.md and CLAUDE.md disagree, voice.md wins.

The voice is **friends in the shed who've been doing this a while**. First-person plural ("we") fits naturally because it's a husband-and-wife channel — when one of them did a thing solo, switch to first-person singular for that aside.

**Lean toward** — first-person plural for shared decisions and discoveries ("we picked up a box of beer-tap handles for $150"), occasional first-person singular for asides ("the first thing I do at a garage sale is scan the boxes nobody else is digging through"), short declarative sentences mixed with longer explanatory ones, dry humor, specific over abstract ("$30 lot from a Saturday yard sale on the south side" not "an inexpensive lot of items"), naming gotchas before they bite the reader (shipping cost surprises, condition-grading mistakes, platform-specific pitfalls), and ending sections with the actual outcome — what sold, for how much, on which platform.

**Avoid** — corporate marketing voice ("In today's fast-paced reseller landscape..."), textbook formality ("eBay, founded in 1995..."), bullet-list overload (use prose for stories and reasoning; bullets for actual lists of items, finds, or numbers), hedging ("you might want to consider possibly..."), generic eBay advice the reader has already read 50 times, AI-tells like "delve," "robust," "leverage," "navigate the landscape," "tapestry," "myriad." See `voice.md` § "Words / phrases we DO NOT use" for the full ban list — and add to it whenever Lonnie flags something.

**Calibration sample.** TBD: when the first 2-3 posts are written, lock one as the calibration sample and update both this section AND `voice.md` § "Calibration sample" with a path to it. Until then, default to "match the rhythm of the channel itself" — watch the most recently approved video and write the way Lonnie and Candice talk on camera.

## Post structure template

Roughly the shape that fits a reselling post — adapt as the topic demands; don't impose this on a post that doesn't need it. (A pure strategy/tips post will look very different from a sourcing-haul post.)

1. **Hook (1-2 paragraphs).** A framing that earns attention. The find that surprised us, the question the haul answered, the lesson that didn't go the way we expected.
2. **What this post will cover (1 short paragraph).** Explicit promise: "this post walks through the haul, what we paid, where we listed it, and what sold." Helps SEO and reader orientation.
3. **The setup / the source.** Where we sourced from (garage sale, estate sale, thrift store, auction, online), what kind of day it was, why we stopped here.
4. **The highlights.** A few concrete items worth pulling out — the headline find, anything with a backstory, anything that taught us something. **Don't try to inventory every item or every order.** Use timestamps so readers can jump to the moment in the video. **Every timestamp must be a clickable deep-link to YouTube that opens in a new tab** — readers who tap it land in the video at that exact second. The point is to convert blog readers into vlog watchers; a plain-text `9:18` does the opposite. Photos help here when Lonnie supplies them.

   **Timestamp link format.** Markdown's `[text](url)` doesn't carry `target="_blank"`, so write the link as raw HTML inline. The URL pattern is `https://www.youtube.com/watch?v={youtubeId}&t={seconds}s` — convert `MM:SS` to total seconds (e.g. `9:18` → `558`).

   For a bullet-style heading where the whole line is bold:
   ```
   <strong><a href="https://www.youtube.com/watch?v=9meH9V7-3Kc&t=138s" target="_blank" rel="noopener">[2:18]</a> Lot of 16 vintage Air Combat magazines, 1977-1980 — $39.</strong>
   ```
   Note: italic `*foo*` does NOT render inside an HTML element — use `<em>foo</em>` for italics that fall inside a `<strong>...</strong>` block.

   For an inline mention in flowing prose:
   ```
   At <a href="https://www.youtube.com/watch?v=9meH9V7-3Kc&t=558s" target="_blank" rel="noopener"><strong>9:18</strong></a> in the video, Candice picked up a small jewelry box...
   ```
5. **The research.** What we looked up before listing — comparable sold listings, market signals, condition grading, any platform-specific quirks. Names of useful tools/searches if relevant (eBay sold filter, Terapeak, etc.).
6. **The listings.** Which platforms we picked and why, how we priced, anything notable about photos or copy.
7. **The result.** What sold, for how much, on which platform — for the highlights only. What didn't sell. Net after fees and shipping where it matters.
8. **The lesson / what we'd do differently.** Most posts have one. Sometimes it's a gotcha to warn readers about; sometimes it's a strategy adjustment we made; sometimes it's just "this category surprised us, here's what we'll watch for next time."
9. **References and further reading.** Links to comparable listings, useful tools, related videos on the channel. 5-10 bullets max — and only when they actually help the reader.

**Length target:** 800-1500 words for a typical 15-30 minute video. Lonnie wants posts that read fast and frame the video, not posts that try to be a written substitute for it. The video has the full inventory; the post has the story.

## Frontmatter — required and optional

```yaml
---
title: 'Match the YouTube title closely; punch it up only if it gains clarity'
description: 'One-sentence hook that doubles as OG description. Aim for 150-250 chars.'
pubDate: 'April 29 2026'                    # Original YouTube upload date — backdate exactly
youtubeId: 'IzdWlySS3kQ'                    # The 11-char video ID
heroImage: '../../assets/posts/{slug}/thumbnail.jpg'
tags: ['haul', 'ebay', 'garage-sale']       # 3-7 lowercase, hyphenated tags
property: 'shed-flips'                      # 'shed-flips' | 'im-gonna-pack-it' | 'garage-flips' | 'podcast'
---
```

The `property` field is required for every post (defaults to `'shed-flips'` if omitted, kept for back-compat with pre-2026-05-01 posts). It drives the landing page the post shows up on, the chip color on cards, and the per-page accent color. Pick it from the channel the source video came from — Shed Flips long-form → `'shed-flips'`, Pack It pack-day → `'im-gonna-pack-it'`, Garage Flips short → `'garage-flips'`, podcast episode → `'podcast'`.

**Slug naming:** lowercase, hyphenated, descriptive. `garage-sale-haul-fry-boots-and-vintage-corningware` not `Sat_GS_Haul_4-26`. Matches the URL the post will live at.

## Image policy

**No AI-generated images.** AI photos of specific items are unreliable and add an "off" feeling that undermines the post's authenticity. Reselling content depends on readers trusting that what we describe is what we actually had in hand.

**Allowed:**
- The YouTube thumbnail, downloaded via `yt-dlp` and used as `heroImage` for OG/social cards. The post page itself shows the YouTube embed instead — `heroImage` is OG-only.
- Real photos from the shed — if Lonnie supplies them for a specific post, drop them into `src/assets/posts/{slug}/` and reference with relative markdown paths.
- Self-made screenshots of listings, sold-comp searches, or platform UI when they materially help illustrate a point.

**Not allowed:**
- AI-generated photos of items, sheds, hands holding things, etc.
- Stock photography
- Generic "garage sale" or "thrift haul" stock images

## Workflow for a new transcript-derived post

**The new simplified workflow (current rule, as of 2026-05-01).** Lonnie wants every post derived from three inputs only: thumbnail, video metadata (title/description/tags/upload date), and the auto-subs transcript. **No video downloads, no frame extraction, no per-second sales catalog.** Touch on a few highlights from the haul or the day; don't try to mirror the whole inventory in writing. Use timestamps (`9:18`, `10:51`) so readers can jump to the moment in the video. The video is the inventory; the post is the story.

This means the per-post research artifacts under `data/post-research/<slug>/` are now just `transcript.txt` (cleaned auto-subs). The structured sales catalog (`sales-catalog.tsv`) is **no longer required** — leave it off unless the post genuinely needs a structured table for SEO. Old posts that have one are fine to leave as-is.

```
1. Pick a video AND its property. Lonnie names the video; from the title/channel you derive the `property` slug.
   - `data/post-candidates.tsv` — filtered list of likely-postable videos (Shed Flips channel only at the moment)
   - `data/videos.tsv` — full channel catalog if the candidate filter missed something
   - `python3 scripts/queue-status.py` — published vs. remaining
   - For "the latest video on <channel>," use the channel-specific `/videos` URL — those pages are reverse-chronological:
     ```
     yt-dlp --flat-playlist --playlist-end 5 --print "%(id)s %(title)s" \
       "https://www.youtube.com/@shedflips/videos"           # or @imgonnapackit /@LonnieandRyan
     yt-dlp --flat-playlist --playlist-end 5 --print "%(id)s %(title)s" \
       "https://www.youtube.com/@garage-flips/shorts"        # Garage Flips has no /videos tab yet
     ```

2. Pull metadata + transcript with yt-dlp. (On a sandboxed agent host, yt-dlp lives at
   /sessions/$SESSION_ID/.local/bin/yt-dlp and you must pass --js-runtimes "node:$(which node)";
   on a regular Mac with Homebrew, plain `yt-dlp` works.):

   yt-dlp --skip-download --write-auto-subs --sub-lang en --sub-format vtt \
     --print "ID: %(id)s" --print "TITLE: %(title)s" --print "UPLOAD: %(upload_date)s" \
     --print "DURATION: %(duration)s" --print "TAGS: %(tags)s" \
     --print "DESC_BEGIN" --print "%(description)s" --print "DESC_END" \
     --output "data/post-research/{slug}/%(id)s.%(ext)s" \
     "https://www.youtube.com/watch?v={VIDEO_ID}"

   The description is gold for posts where Lonnie has written timestamps in it
   (most "what sold" videos do). It's more reliable than the auto-subs for prices
   and item names. Copy the timestamp section into the post where helpful.

3. Pull thumbnail:
   yt-dlp --skip-download --write-thumbnail --convert-thumbnails jpg \
     --output "src/assets/posts/{slug}/thumbnail" \
     "https://www.youtube.com/watch?v={VIDEO_ID}"

   If the convert step fails (no ffmpeg on a sandbox), fall back to PIL:
   python3 -c "from PIL import Image; img=Image.open('src/assets/posts/{slug}/thumbnail.webp'); img.convert('RGB').save('src/assets/posts/{slug}/thumbnail.jpg','JPEG',quality=90)"

4. Clean the .vtt transcript into transcript.txt (strip inline timing tags, dedupe
   consecutive identical lines, keep section timestamps for skimming). The cleaned
   transcript lives at data/post-research/{slug}/transcript.txt and IS committed.

5. Skim the transcript for voice color and the description for the headline
   highlights. Pick 3-6 items/moments worth calling out in the post — not the
   whole inventory. The video has the full list; the post adds story and stakes.

6. Web-research only what's needed for the highlights (1-3 searches max):
   - Comparable sold listings (eBay sold filter) — for the headline find
   - The item's history if it matters to the post
   - Platform-specific quirks worth calling out

7. Draft the post in src/content/blog/{slug}.md following the structure above.
   Frontmatter: title (close to YouTube title), description (1-sentence hook),
   pubDate (use the YouTube upload date), youtubeId, heroImage, tags.

8. Build to verify — work directly inside $BUILD_DIR if you cloned into /tmp,
   or clone fresh:
   cd "$BUILD_DIR"
   npm install     # only if not already installed
   npm run build   # must pass cleanly

9. Commit and push from $BUILD_DIR:
   git add <new files>
   git commit -m "..."
   git push origin main
```

**If the build fails:**
- `EPERM ... unlink ...node_modules/.vite/...` — you're building inside the workspace, not in `$BUILD_DIR`. Re-clone into a fresh `/tmp` path.
- `Pagefind: Indexed 0 pages` — the `<article data-pagefind-body>` wrapper in `src/layouts/BlogPost.astro` got moved or removed. Restore it.
- Generic Astro error — read it, don't push, ping Lonnie if you can't resolve it. Don't commit broken posts.

## Conventions and small things

- **Heading style:** sentence case (`## What we paid`), not title case.
- **External links inline.** Don't dump them all into a references section — work them into the prose where they're contextually relevant. The references section at the bottom catches the canonical sources that didn't fit elsewhere.
- **Code blocks** for any commands or code longer than a single inline `var`. Use language hints (` ```bash `, ` ```yaml `) so syntax highlighting works.
- **Affiliate links:** auto-applied at build time by a remark plugin. See *Affiliate links — auto-applied at build time* below. **Don't insert them by hand in posts.**
- **Em-dashes** are used liberally — they fit the conversational rhythm. Don't replace them with commas just to "fix" them.
- **Numbers and units:** specific values (`$45 sold price`, `$28.50 net after fees`) trump rounded ones. When you state a sold price, name the platform.

## Affiliate links — auto-applied at build time

The site uses Amazon Associates affiliate links. They are inserted automatically by a remark plugin during the Astro build — **you do not insert affiliate links manually in posts, and you do not write a disclosure paragraph**. Both happen at build time.

**How it works:**
- Product map: `src/data/affiliate-links.mjs`. Each entry has `id`, `label`, `url`, and a list of `patterns` (literal phrases — case-insensitive, anchored at word boundaries on both ends).
- Plugin: `src/plugins/remark-affiliate-links.mjs`. Walks each post's mdast in document order, finds the earliest match across all not-yet-linked products, replaces the **first occurrence per post** with an affiliate link, and appends a `## Mentioned in this episode` section listing every product that fired plus the FTC/Associate disclosure.
- Skipped contexts: existing links, fenced and inline code, headings. The footer also carries a short "As an Amazon Associate…" notice on every page.

**When writing a new post:**
1. Write naturally. Don't try to set up affiliate links — the plugin handles first-mention linking on its own.
2. After the draft is in `src/content/blog/<slug>.md`, run `npm run build` from the `/tmp` clone and grep the rendered HTML for affiliate hits:
   ```bash
   grep -oE '<a[^>]*class="affiliate-link"[^>]*>[^<]*</a>' \
       dist/blog/<slug>/index.html
   ```
   Sanity-check every hit: right word, right context. Wrong-context links are worse than missed ones.
3. Scan the draft for product mentions that *should* be affiliate-linked but aren't in the map yet (e.g. polymailer, postage scale, Sharpie, garment steamer, watch case opener — common reseller staples). Surface them to Lonnie at the end of the session as "candidates for the next affiliate-link huddle." **Don't guess affiliate URLs** — Lonnie generates them from his Amazon Associates account and pastes them in.

**False-positive watch list:** the existing posts use these words in *non*-product contexts, so we deliberately do NOT pattern-match the bare word:
- `box` → almost always *jewelry* box, *blind* box, *Comic Box* (a bin code), *mask* box
- `marker` → paintball markers (Spyder, Tippmann), not Sharpies
- `scale` → could be "scale model" or "scaling up"; the jewelry-scale product matches `jewelry scale` / `gold scale` / `gram scale` only
- `bag` / `bags` → trash bags, filler-bag sales

Before adding a new product, scan the existing posts for the proposed patterns to make sure they don't fire on something unrelated.

**Adding a product** (only after Lonnie supplies the affiliate URL):
```js
{
  id: 'short-kebab-id',
  label: 'Display name shown in the bottom-of-post list',
  url: 'https://amzn.to/...',
  patterns: ['exact phrase', 'plural form', 'hyphenated variant'],
}
```
The plugin sorts a product's own patterns longest-first, so "3D printers" beats "3D printer" if both could match the same span. Across products, the *earliest in-document* match wins.

**Currently linked products** (as of 2026-05-01): gold testing kit, jeweler's loupe, jewelry scale, 3D printer, Jadens thermal label printer. The scale and the thermal label printer have no matches in any shipped post yet — they're loaded and waiting.

## Search — Pagefind

The blog uses [Pagefind](https://pagefind.app/) for client-side full-text search. A magnifying glass icon in the sticky header opens a modal search overlay. The `/` keyboard shortcut also opens it.

**How it works:** `npm run build` runs `astro build` followed by `pagefind --site dist`. Pagefind crawls the generated HTML and writes a binary search index into `dist/pagefind/`. At runtime, the Header lazy-loads `/pagefind/pagefind-ui.js` and `/pagefind/pagefind-ui.css` the first time the search overlay is opened (so they don't block page load). The JS file is injected via a `<script>` tag — see the IIFE gotcha note below for why a dynamic `import()` does NOT work. No server required — the index is just static files served by Cloudflare Pages.

**Search does not work in `npm run dev`** — expected behavior. The `_pagefind/` directory only exists after a full build. If you open search during dev, the overlay will show a friendly "run `npm run build` to generate it" message instead of crashing.

**Where the search UI lives:** `src/components/Header.astro`. The overlay and its JS are entirely self-contained in that file — no separate search page or component. Pagefind's default CSS variables are overridden inside `#search { ... }` to match the Shed Flips palette (`--pagefind-ui-primary: var(--accent)`, etc.).

**Build script in `package.json`:**
```json
"build": "astro build && pagefind --site dist"
```
`pagefind` is a `devDependency` — Cloudflare Pages installs devDeps during CI builds so this works in production deploys without any extra config.

**If you add new post templates or page layouts** that should be excluded from search indexing (e.g. a raw JSON feed, an auto-generated redirect page), add `data-pagefind-ignore` to the `<body>` or the relevant element and Pagefind will skip it.

## Things that have already been tried and ruled out

- **Loading Pagefind UI via dynamic `import('/pagefind/pagefind-ui.js')`** — does NOT work. `pagefind-ui.js` is an IIFE that ends with `window.PagefindUI = ...;})()` and has no `export` statements. A dynamic import resolves with an empty namespace, `mod.PagefindUI` is undefined, and `new undefined(...)` throws — falling through to the "Search index not available" fallback even when the index is healthy. The fix (in `src/components/Header.astro`) is to inject a regular `<script src="/pagefind/pagefind-ui.js">` and read `window.PagefindUI` on `script.onload`. Don't refactor this back to `import()`.
- **`cp -r "<workspace>" /tmp/...`** to start a fresh build — fails with "Resource deadlock avoided" partway through `.git/objects/`. Use `git clone` from origin instead (see bootstrap step 3).

## Picking candidates from the queue

When a video should become a post, the trigger is Lonnie. Either he names it directly, or he runs `python3 scripts/refresh-manifest.py` to add new uploads to the candidate file and then names the one to write. **Don't pick from the queue without confirmation** — the candidate filter has false positives, and even among real candidates, some videos are better written-up later or skipped entirely.

A few things to keep in mind when one is picked:

**Multi-part series** make awkward standalone posts because readers land mid-story without context. Options: write all parts in a single session so you can batch them, or consolidate the series into one overview post that links to the individual videos. Don't write just one episode in a series and leave the rest for later — it reads oddly.

**Obvious filter outliers** — if a video clearly doesn't fit the reselling-content scope of the blog, skip it and note it for Lonnie to remove from `data/post-candidates.tsv` manually (or to extend `EXCLUDE_PATTERNS` for the next refresh).

**Everything else** — pick and go. Longer videos generally yield richer transcripts and more content to work with, but a tight 5-minute finds video can make a clean short post too.

## What's reusable / what's the manifest

The manifest lives in the repo as the single source of truth — it persists across sessions and is diffable across refreshes.

- `data/videos.tsv` — every video on the channel
- `data/post-candidates.tsv` — filtered subset that could become posts
- `scripts/refresh-manifest.py` — regenerates both files; filter rules (`INCLUDE_PATTERNS` / `EXCLUDE_PATTERNS`) live at the top of this script
- `scripts/queue-status.py` — derives published/remaining counts from blog frontmatter, no separate "published" list to keep in sync
- `data/README.md` — explains the structure and refresh workflow

When a published post references a video that the candidate filter missed, `queue-status.py` flags it and suggests tightening the filter rules.

**Per-post research artifacts are committed to `data/post-research/<slug>/`.** Under the current simplified workflow, that's just the cleaned `transcript.txt` (and the raw `.vtt` if it's small). The earlier convention also produced a structured sales catalog for "what sold" videos via frame extraction — that's no longer required and is not part of the new flow. Old posts that have a `sales-catalog.tsv` are fine to leave as-is. See `data/post-research/README.md` for the historical convention.

Large intermediate artifacts (downloaded video files, raw frames, frame collages) are NOT committed and should not be produced under the new flow — they're not needed.

## When in doubt, match the calibration

TBD: once 2-3 posts have been published and Lonnie has approved one of them as the canonical example, link it here. Until then, default to: rewatch the most recently published video, mirror the way Lonnie and Candice tell the story on camera, and lean specific.
