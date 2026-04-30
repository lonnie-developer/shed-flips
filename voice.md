# Shed Flips voice — the prescription

This is the canonical reference for how a Shed Flips post should sound. CLAUDE.md is the *principles*; this file is the *specifics* — the actual phrases, jokes, rhythms, and word-choices that make a post feel like Lonnie and Candice instead of an AI's best guess.

**This file is meant to grow.** Every time a post ships and Lonnie green-lights a phrasing, add it here. Every time he flags something as "no, we'd never say that" — add it here as a *banned* item with the reason.

---

## Who

- **Lonnie** — primary on-camera voice, owns the writing-style baseline. First-person singular asides default to Lonnie.
- **Candice** — co-host, partner. Often the one finding things at sales, often the one driving the haul-decisions on screen. First-person plural ("we") is the dominant voice; first-person singular for either is the exception.
- **The shed** — the workspace. Not "the studio," not "the office," not "the warehouse." It's *the shed*. Capitalize only at sentence start.
- **Channel home** — [@shedflips](https://www.youtube.com/@shedflips). Tagline lives in `src/consts.ts`: *"Welcome back to the shed!"*

## Core voice rules

1. **First-person plural is default.** "We picked up a box of beer-tap handles for $150." If only one of them did the thing on camera, switch to singular for that aside, then back to plural.
2. **Casual, conversational, friend-at-the-counter.** Not textbook. Not corporate. Not coach-speak. The reader is in the shed with you watching you sort a haul, not reading a business-school case study.
3. **Specific over abstract.** *Always.*
   - ✅ "$30 lot from a Saturday yard sale on the south side"
   - ❌ "an inexpensive lot of items from a local sale"
   - ✅ "Sold for $52 on eBay after fees"
   - ❌ "It sold for a nice profit"
4. **Name the platform every time.** eBay, Mercari, Etsy, Poshmark, Whatnot, FB Marketplace. Never "an online marketplace" or "the resale platform." Searchers search by platform name.
5. **Name actual numbers.** Paid, listed, sold, net after fees and shipping. Round numbers ("around $50") are weaker than exact numbers ("$48.32 net").
6. **Em-dashes are fine, even encouraged.** They fit the conversational rhythm — like a sentence catching its breath. Don't replace them with commas to "fix" them.
7. **Sentence case for headings**, not Title Case. `## What we paid`, not `## What We Paid`.
8. **End each section with the actual outcome** — what sold, what didn't, what we'd do next time. Don't leave the reader hanging on a setup.

## Things we say

*This list is sparse on day one. Fill it in as catchphrases, callbacks, and recurring bits surface from videos. Update after every post.*

- *"Welcome back to the shed!"* — the channel opener; works as an opening or closing line in a post sparingly. Don't overuse.
- *"we"* — default subject pronoun (see Core voice rule #1).

> **TODO** — populate from videos. Recurring catchphrases to watch for and add here:
> - The way Lonnie opens a haul reveal
> - Whatever they call a particularly bad find ("a real winner," etc.)
> - Whatever they call a particularly good find ("score of the week," etc.)
> - How they refer to specific platforms colloquially (does eBay get a nickname? Mercari?)
> - How they react to bad news (a return, a non-payer, a damaged shipment)
> - How they refer to each other on camera

## Inside jokes / recurring bits

*Add as they appear. Each entry: the bit + when it surfaces + how to use it in writing without explaining the joke.*

> **TODO** — examples to watch for:
> - The "regret"/"no regrets" framing from "Why We Stopped Shipping eBay Orders Every Day"
> - Any recurring item categories that get joked about (Goodwill prices, certain brands, etc.)
> - Specific buyers or buyer-archetypes that come up
> - Anything Candice does that Lonnie ribs her about (or vice versa)

## How we talk about platforms

Each platform has a specific vibe in the resale world. Mirror it.

| Platform | How we talk about it | What sells well there |
|---|---|---|
| **eBay** | The workhorse. The default. Most volume. | Almost everything. Vintage, electronics, parts, anything with a model number. |
| **Mercari** | Casual buyers, faster sales, lower fees. | Clothing, smaller items, beginner-friendly resells. |
| **Etsy** | Vintage and collectible angle. Higher price points but slower. | Anything genuinely vintage or handcrafted. Pre-1980s. |
| **Poshmark** | Clothing-heavy, social-feed style. Lots of "offers." | Brand-name clothing, accessories, shoes. |

> **TODO** — add per-platform fee structure in plain language once we cover it in a post (current rates as of writing, with a "verify before quoting in a post" note).

## How we talk about sourcing

- **Garage sales** — Saturday-morning default. Specific neighborhoods/areas if they recur.
- **Estate sales** — usually weekend, often online preview, name the estatesales.net listing or the company.
- **Auctions** — local auction houses, online auctions; name them.
- **Thrift stores** — Goodwill, Savers, locally-owned. *"Thrift store"* covers all of them; specify when the brand matters (Goodwill's pricing has its own story).
- **Other** — Facebook Marketplace, Craigslist, OfferUp; storage-unit auctions; flea markets; swap meets; wholesale lots. Each gets named when relevant.

## How we talk about money

- **Paid:** what we spent at sourcing. Always specific. "We paid $30 for the whole lot" not "we paid a small amount."
- **Listed:** the asking price on a platform. Specific.
- **Sold:** the actual sale price. Specific. **Always name the platform.**
- **Net:** after fees and shipping. Worth showing when it materially differs from sold price (i.e., almost always).
- **Profit:** sold-net minus paid. Worth calling out when it's the headline number.
- **Currency:** USD, no symbol shorthand. "$52" not "fifty-two dollars" in casual reference; both fine in flowing prose.

Example pattern:

> *We paid $30 for a lot of 12 beer-tap handles at a Saturday yard sale. Listed at $20 each on eBay; six sold over the next two weeks at an average of $18.40 after fees. Net so far: about $80 on a $30 spend — and we still have six on the shelf.*

## Words / phrases we DO NOT use

Hard bans. These are AI tells, corporate-speak, or just things that don't fit the voice.

- *delve, robust, leverage, navigate the landscape, in the realm of, myriad, tapestry, unleash, in today's fast-paced [X]*
- *Comprehensive guide, ultimate guide, deep dive* — header anti-patterns; SEO-stuffed and stale.
- *Reseller game, flipping game, hustle* — generic resale-content marketing-speak.
- *In conclusion, to sum up, in summary, all in all* — closing-paragraph crutches; just end with the actual outcome.
- *Maximize your profit, optimize your strategy, level up* — coach-speak.

> **TODO** — add to this list every time Lonnie flags something we wrote that didn't sound like them.

## SEO without sounding SEO

Specific named items + specific prices + specific platforms = naturally keyword-rich without sounding stuffed. The cleanest pattern:

- **H2/H3 headers that match real search intent.** "What did the vintage CorningWare casserole sell for on eBay?" not "Sales analysis: kitchenware category."
- **First mention of an item: full name** (brand + model + descriptor). Subsequent mentions can shorten.
- **Mention price + platform together.** "Sold for $52 on eBay" — that's the search phrase intent.
- **Internal links between posts** when an item references a prior haul. "We covered the prior batch of beer-tap handles in [last week's haul](#)."
- **Don't repeat the same keyword 12 times.** Use variations the way a human would.

## Affiliate-link policy (forward-looking)

Currently no affiliate links. When Amazon affiliate links go in:

- **Only on items the post genuinely recommends or references** — boxes for shipping, label printers, scales, cleaning supplies, comparable in-print versions of vintage items.
- **Disclose at the top of the post** with the standard "as an Amazon Associate we earn from qualifying purchases" line in italics.
- **Never on the source items themselves.** You're not selling the customer the same vintage thing — you're selling adjacent tools.
- **Reference docs (datasheets, manufacturer pages) stay non-affiliate.** Always.

## Calibration sample

> **TBD** — once 2-3 posts have shipped and Lonnie has marked one as "yes, exactly that voice," replace this section with a link to that post and a 1-paragraph note on what specifically nailed it.

Until then: when in doubt, watch the most recent video and write the way Lonnie and Candice talk on camera. Match their rhythm — short sentences, dry asides, specifics, no-nonsense outcomes.
