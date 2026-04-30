# Post research data

Per-post research artifacts from the video-to-post pipeline. **Each subdirectory is named for the post slug** (matches `src/content/blog/<slug>.md`) and holds whatever was used to draft that post.

## What lives here

For every post derived from a YouTube video, this directory holds:

- **`transcript.txt`** — cleaned transcript with timestamps. yt-dlp's auto-subs, stripped of VTT timing tags and deduped. Lossless source for direct quotes and voice analysis.
- **`sales-catalog.tsv`** *(optional)* — structured sales data extracted from on-screen cards (only present for "what sold" videos). Schema: `timestamp\tframe\tplatform\titem_title\tsold_price\tshipping_buyer_pays\tcustom_label\tnotes`.
- **`research-notes.md`** *(optional)* — anything else worth keeping: voice/inside-joke discoveries, web research that informed the post, spelling/pronunciation notes, calibration-reference flags. Free-form.

Other research artifacts (downloaded video files, extracted frames, frame collages) are intentionally kept *out* of the repo because they're large and re-derivable on demand. They live in `/tmp/<slug>-pilot/` during processing and can be regenerated with `yt-dlp` + `ffmpeg`.

## Why store this in-repo

Three reasons:

1. **SEO / accuracy revisions.** When a post needs an update — a price correction, a new section, a tag rework — the original transcript is the fastest way to verify what was actually said vs. what was paraphrased.
2. **Voice calibration over time.** As more posts ship, voice.md gets refined. Having every post's source transcript means the calibration pass can pull *direct phrasings* from a year of videos instead of guessing.
3. **Future reuse.** A transcript + structured sales catalog is valuable inventory data. It's diff-able, grep-able, and survives session resets.

## Size

Per post: ~30-50 KB (clean transcript) + ~3-5 KB (sales catalog if present). 100 posts = ~5 MB. No size concern for a git repo.

## Filename conventions

- Slug name matches the post file in `src/content/blog/`. If you rename the post slug, rename this directory too.
- Use only lowercase, hyphenated names — no spaces, no special characters.
