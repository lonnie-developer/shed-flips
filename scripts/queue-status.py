#!/usr/bin/env python3
"""
Report on the post-publishing queue.

Reads:
  - src/content/blog/*.md frontmatter (the source of truth for "published")
  - data/post-candidates.tsv       (the source of truth for "what could become a post")

Prints:
  - Counts: published, queue size, remaining
  - The next ~10 unpublished candidates (most-recently-uploaded last, since
    we work backward through the catalog and recent posts come from the top
    of the queue)
  - Any published posts whose youtubeId isn't in the candidates file (so we
    can spot videos the filter is missing)

This is the canonical way to answer "how many posts are left?" — derive from
frontmatter, don't track in a separate file. That guarantees the answer can't
drift from reality.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = REPO_ROOT / "src" / "content" / "blog"
CANDIDATES_FILE = REPO_ROOT / "data" / "post-candidates.tsv"

YOUTUBE_ID_RE = re.compile(r"^youtubeId:\s*['\"]?([A-Za-z0-9_-]{11})['\"]?\s*$", re.MULTILINE)
TITLE_RE = re.compile(r"^title:\s*['\"]?(.+?)['\"]?\s*$", re.MULTILINE)


def published_posts() -> list[tuple[str, str, Path]]:
    """Return [(youtube_id, title, file_path), ...] for every post with a youtubeId."""
    if not BLOG_DIR.exists():
        return []
    out: list[tuple[str, str, Path]] = []
    for md in sorted(BLOG_DIR.glob("*.md")):
        text = md.read_text(encoding="utf-8")
        # Frontmatter is the first --- ... --- block.
        if not text.startswith("---"):
            continue
        end = text.find("\n---", 3)
        if end < 0:
            continue
        frontmatter = text[3:end]
        yid_match = YOUTUBE_ID_RE.search(frontmatter)
        if not yid_match:
            continue
        title_match = TITLE_RE.search(frontmatter)
        title = title_match.group(1) if title_match else "(no title)"
        out.append((yid_match.group(1), title, md))
    return out


def candidates() -> list[tuple[str, str, str]]:
    """Return [(id, title, duration), ...] from post-candidates.tsv."""
    if not CANDIDATES_FILE.exists():
        sys.exit(
            f"{CANDIDATES_FILE.relative_to(REPO_ROOT)} not found. "
            f"Run: python3 scripts/refresh-manifest.py"
        )
    rows: list[tuple[str, str, str]] = []
    for i, line in enumerate(CANDIDATES_FILE.read_text(encoding="utf-8").splitlines()):
        if i == 0 or not line.strip():
            continue  # skip header
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        rows.append((parts[0], parts[1], parts[2]))
    return rows


def main() -> int:
    pub = published_posts()
    cand = candidates()

    pub_ids = {pid for pid, _, _ in pub}
    cand_ids = {cid for cid, _, _ in cand}

    overlap = pub_ids & cand_ids
    pub_outside_filter = pub_ids - cand_ids
    remaining = [r for r in cand if r[0] not in pub_ids]

    print(f"Published posts (with youtubeId): {len(pub)}")
    print(f"Post candidates (from filter): {len(cand)}")
    print(f"  Already published: {len(overlap)}")
    print(f"  Remaining: {len(remaining)}")
    if pub_outside_filter:
        print(
            f"\nNote: {len(pub_outside_filter)} published post(s) reference a video "
            f"the filter did not pick as a candidate:"
        )
        for pid in sorted(pub_outside_filter):
            title = next((t for vid, t, _ in pub if vid == pid), "(unknown)")
            print(f"  {pid}  {title}")
        print("(consider adjusting INCLUDE_PATTERNS in scripts/refresh-manifest.py)")

    # YouTube video IDs are not chronological, so this is a stable but
    # arbitrary ordering. To pick a specific era of post, scan the candidates
    # file directly. To pick "next thing to write," scan this list and choose.
    print("\nFirst 10 unpublished candidates (alphabetical by id, not upload order):")
    for vid, title, _dur in remaining[:10]:
        print(f"  https://www.youtube.com/watch?v={vid}  {title}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
