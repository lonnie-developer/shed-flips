# Shed Flips

Companion blog to the [Shed Flips YouTube channel](https://www.youtube.com/@shedflips).
Built with [Astro](https://astro.build/) and deployed on [Cloudflare Pages](https://pages.cloudflare.com/).

## Project structure

```text
├── public/                  # Static files (favicon, etc.)
├── src/
│   ├── assets/              # Images and fonts bundled into the build
│   ├── components/          # Header, Footer, BaseHead, etc.
│   ├── content/blog/        # Blog posts (Markdown / MDX)
│   ├── layouts/             # Page layouts (BlogPost.astro)
│   ├── pages/               # Routes — index, about, blog/, rss.xml.js
│   ├── styles/global.css    # Site-wide theme (dark + green accent)
│   ├── consts.ts            # Site title, description, channel URL
│   └── content.config.ts    # Frontmatter schema for blog posts
├── astro.config.mjs
└── package.json
```

## Adding a new post

Drop a Markdown file into `src/content/blog/`. Filename becomes the URL slug.

```yaml
---
title: 'Your post title'
description: 'One-line description (used in OG/social cards and post listings)'
pubDate: 'April 29 2026'
youtubeId: 'dQw4w9WgXcQ'   # The 11-char ID from a YouTube URL — embeds the video at the top of the post
tags: ['haul', 'ebay']     # Optional
---

Post body in Markdown…
```

If `youtubeId` is omitted, the video embed is skipped (and `heroImage` is shown if provided).
If both are omitted, the post just renders as text.

## Local commands

You don't need to run these — Cloudflare Pages handles the build. They're here for reference.

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Run a local dev server at `localhost:4321`   |
| `npm run build`   | Build the production site to `./dist/`       |
| `npm run preview` | Preview the built site                       |

## Deploy

Pushing to the `main` branch on GitHub triggers an automatic rebuild on Cloudflare Pages.
Build settings: build command `npm run build`, output directory `dist`.
