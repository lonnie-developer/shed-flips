#!/usr/bin/env python3
"""
Refresh the in-repo video manifest from the Shed Flips YouTube channel.

Writes two files into ../data/:
  - videos.tsv          every video on the channel
  - post-candidates.tsv subset that passes the reselling-content filter

Both files are sorted by video ID for stable git diffs. Run this whenever the
channel has new uploads (or the filter rules change), then commit the diff.

Schema (both files, with header row):
  id<TAB>title<TAB>duration_seconds

Notes on what is NOT in the manifest, deliberately:
  - upload_date / pubDate: yt-dlp's --flat-playlist does not return it; pulling
    per-video metadata for every video would take many minutes. The
    post-drafting workflow pulls upload_date on demand for the one video being
    written about, which is enough.
  - description, tags, view_count: too much churn, too little payoff.

Requires yt-dlp installed and on PATH (or at ~/.local/bin/yt-dlp).
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

CHANNEL_URL = "https://www.youtube.com/@shedflips/videos"

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
ALL_VIDEOS_FILE = DATA_DIR / "videos.tsv"
POST_CANDIDATES_FILE = DATA_DIR / "post-candidates.tsv"

HEADER = "id\ttitle\tduration_seconds\n"

# ---------------------------------------------------------------------------
# Reselling-content filter
# ---------------------------------------------------------------------------
# A video is a "post candidate" if its title matches at least one INCLUDE
# pattern AND no EXCLUDE pattern. The bar to clear is "could plausibly become a
# written post with concrete finds, prices, platforms, or strategy" — not
# every channel video needs a written companion.
#
# When you tweak these, re-run the script and review the diff. Borderline cases
# are fine — the queue-status script lists candidates and you pick by hand. The
# goal is "mostly real candidates with some false positives", not a tight
# filter; queue-status will surface false positives over time so the rules can
# be refined.

INCLUDE_PATTERNS = [
    # sourcing locations
    r"\bgarage sale", r"\byard sale", r"\bestate sale", r"\bmoving sale",
    r"\bauction\b", r"\bthrift", r"\bgoodwill\b", r"\bsavers\b",
    r"\bflea market", r"\bswap meet\b",
    # platforms / channels of resale
    r"\bebay\b", r"\bmercari\b", r"\betsy\b", r"\bposhmark\b", r"\bdepop\b",
    r"\bfacebook marketplace\b", r"\bfb marketplace\b", r"\bmarketplace\b",
    r"\bwhatnot\b", r"\bcraigslist\b", r"\bofferup\b",
    # words that signal hauls or finds
    r"\bhaul\b", r"\bscore\b", r"\bfind(s|s of the (week|day|month))?\b",
    r"\bpickup(s)?\b", r"\bsourc(ed|ing)\b",
    # words that signal the sell-side
    r"\bsold\b", r"\bsell(ing)?\b", r"\blist(ed|ing|ings)?\b",
    r"\bprofit\b", r"\bmargin\b", r"\bflip(s|ped|ping)?\b",
    r"\bprice(d|s|ing)?\b", r"\bsale of the week\b",
    # strategy / how-we-do-this content
    r"\bstrateg(y|ies)\b", r"\btips?\b", r"\bguide\b", r"\bhow (we|to)\b",
    r"\blesson(s)?\b", r"\badvice\b", r"\bbeginner", r"\bstart(ing)?\b",
    r"\bbusiness\b",
    # categories that often show up in a flip channel
    r"\bvintage\b", r"\bantique\b", r"\bcollectib(le|les)\b", r"\brare\b",
    r"\b(box|crate|tote|lot) of\b",
]

# Filtered OUT even when a title matches an include pattern. Keep this list
# short — it's better to surface false positives in the candidate queue than
# accidentally drop real candidates with an over-aggressive exclude.
EXCLUDE_PATTERNS = [
    r"\bshorts?\b",                 # YT Shorts are too short for a meaningful written companion
    r"\b#shorts?\b",
    r"\blive (stream|chat)\b",      # live streams rarely make tight writeups
]


def candidate_filter(title: str) -> bool:
    """Return True if the title looks like a post-worthy reselling video."""
    if any(re.search(p, title, re.IGNORECASE) for p in EXCLUDE_PATTERNS):
        return False
    return any(re.search(p, title, re.IGNORECASE) for p in INCLUDE_PATTERNS)


# ---------------------------------------------------------------------------
# yt-dlp invocation
# ---------------------------------------------------------------------------

def find_ytdlp() -> str:
    on_path = shutil.which("yt-dlp")
    if on_path:
        return on_path
    local = Path.home() / ".local" / "bin" / "yt-dlp"
    if local.exists():
        return str(local)
    sys.exit(
        "yt-dlp not found. Install with: "
        "pip install --break-system-packages yt-dlp"
    )


def fetch_videos() -> list[tuple[str, str, str]]:
    """Return list of (id, title, duration_seconds) for every video on the channel."""
    cmd = [
        find_ytdlp(),
        "--flat-playlist",
        # Use a delimiter that will not appear inside titles. The earlier
        # \t-in-template approach produced literal "\t" characters because
        # yt-dlp does not interpret backslash escapes in --print. We use the
        # ASCII unit-separator (0x1F) instead and split on it in Python.
        "--print", "%(id)s\x1f%(title)s\x1f%(duration)s",
        CHANNEL_URL,
    ]
    print(f"[refresh] running: yt-dlp --flat-playlist {CHANNEL_URL}", file=sys.stderr)
    proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
    rows: list[tuple[str, str, str]] = []
    for line in proc.stdout.splitlines():
        if not line:
            continue
        parts = line.split("\x1f")
        if len(parts) != 3:
            print(f"[refresh] skipping malformed row: {line!r}", file=sys.stderr)
            continue
        vid, title, dur = parts
        # Normalize: strip whitespace, replace any embedded tabs/newlines in the
        # title (rare but possible) so the TSV stays well-formed.
        title = re.sub(r"\s+", " ", title).strip()
        rows.append((vid, title, dur))
    return rows


def write_tsv(path: Path, rows: list[tuple[str, str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows_sorted = sorted(rows, key=lambda r: r[0])
    with path.open("w", encoding="utf-8") as f:
        f.write(HEADER)
        for vid, title, dur in rows_sorted:
            f.write(f"{vid}\t{title}\t{dur}\n")


def main() -> int:
    rows = fetch_videos()
    if not rows:
        print("[refresh] no videos returned — aborting (will not overwrite manifest)", file=sys.stderr)
        return 1

    write_tsv(ALL_VIDEOS_FILE, rows)
    candidates = [r for r in rows if candidate_filter(r[1])]
    write_tsv(POST_CANDIDATES_FILE, candidates)

    print(f"[refresh] wrote {len(rows)} rows to {ALL_VIDEOS_FILE.relative_to(REPO_ROOT)}")
    print(f"[refresh] wrote {len(candidates)} rows to {POST_CANDIDATES_FILE.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
