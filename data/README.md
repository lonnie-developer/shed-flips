# Video manifest

Single source of truth for the Shed Flips YouTube catalog and the queue of videos that could become blog posts. Lives in the repo so it survives session resets and is diffable across refreshes.

## Files

**`videos.tsv`** — every video on the channel. Schema: `id<TAB>title<TAB>duration_seconds`, with a header row, sorted by id for stable diffs.

**`post-candidates.tsv`** — same schema, filtered to videos that look like they could become written posts (hauls, sold/listed wrap-ups, strategy talks, garage-sale finds, etc.). The exact filter rules are in `../scripts/refresh-manifest.py` — `INCLUDE_PATTERNS` and `EXCLUDE_PATTERNS` at the top of the file.

The candidate filter is intentionally a "best effort" cut, not a contract. Borderline hits are normal. The `queue-status.py` script (see below) tells you when a published post references a video the filter missed, so the rules can be tightened over time.

## Refresh workflow

When the channel has new uploads, or when you tweak the filter:

```bash
python3 scripts/refresh-manifest.py
git diff data/    # review what changed
git add data/
git commit -m "Refresh video manifest"
```

The script is idempotent — run it twice in a row and the second run produces no diff.

## What's NOT in the manifest, on purpose

- **`upload_date` / `pubDate`** — yt-dlp's `--flat-playlist` doesn't return it, and pulling per-video metadata for hundreds of videos takes many minutes. The post-drafting workflow already pulls `upload_date` for the one video being written about, which is enough.
- **`description`, `tags`, `view_count`** — too much churn (descriptions get edited; view counts change daily) for too little payoff. If a draft needs them, pull them on demand for that video.
- **Transcripts** — large, only needed when actually drafting. Pull with yt-dlp at draft time and keep them out of the repo.

## Queue status

To answer "how many posts are left?" without trusting any cached count:

```bash
python3 scripts/queue-status.py
```

It scans `src/content/blog/*.md` frontmatter for `youtubeId`, intersects with `post-candidates.tsv`, and prints published count, remaining count, and the next batch of unpublished candidates. The published list is derived live from frontmatter — no separate "published" file to keep in sync.
