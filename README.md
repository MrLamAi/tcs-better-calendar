# TCS Better Calendar

A lightweight prototype for a calmer way to browse Hong Kong EDB TCS professional learning events.

The MVP is intentionally framework-free. It now includes a captured public TCS snapshot so the display UI can be tested with real event-shaped content before the scheduled Google Apps Script sync is wired in.

## What is in the prototype

- A compact event list so teachers can scan many more opportunities per screen.
- English / Traditional Chinese interface toggle with saved preference.
- Search across title, summary, category, subject, level, audience and format.
- Category filters for `Secondary`, `IT/AI`, `CSD` and `STEAM`.
- Level filters for primary, secondary, kindergarten and special education.
- A specific-date filter that matches both one-day events and multi-day courses covering the selected date.
- Subject filters for English, Chinese, Mathematics, Science, ICT/IT/AI, STEAM, CSD/values, humanities, arts, health, other subjects and non-subject-specific events.
- A persistent teacher profile (`I teach`) that keeps relevant subject events in view, with an option to include non-subject-specific whole-school topics.
- Deadline windows for all events, the next 7 days and the next 30 days.
- Sort modes for closing date, event date and newest added.
- `NEW`, `UPDATED` and computed `CLOSING SOON` badges.
- A live snapshot generated from the public EDB TCS HTML pages in [`data/tcs-events.js`](data/tcs-events.js), with mock data retained as a fallback in [`mock-data.js`](mock-data.js).
- A repeatable downloader/parser in [`scripts/download-tcs-pages.mjs`](scripts/download-tcs-pages.mjs), including raw page fixtures and a manifest.
- A future Apps Script entry point in [`Code.gs`](Code.gs) and an Apps Script-ready template in [`apps-script/`](apps-script/).

## Architecture

```text
┌────────────────────┐       normalized event shape       ┌───────────────────┐
│  TCS page snapshot │ ─────────────────────────────────▶ │  Calendar UI      │
│  downloader/parser │                                    │  search / filters │
└─────────┬──────────┘                                    └─────────┬─────────┘
          │                                                        │
          ▼                                                        ▼
  Apps Script fetcher                                  Google Sites embed
  + Google Sheet cache                                  (future container)
```

Today, `data/tcs-events.js` is the source adapter output. The UI only depends on the normalized fields below, so replacing the snapshot with an Apps Script/Sheet response does not require rewriting the filters or list renderer.

| Field | Example | Purpose |
| --- | --- | --- |
| `courseId` | `TCS-IT-26091` | Stable source identifier |
| `title` | `Generative AI for Classroom Practice` | Display title |
| `category` | `IT/AI` | Filter bucket |
| `categories` | `IT/AI`, `STEAM` | Multi-category filter buckets |
| `subject` | `ENGLISH LANGUAGE` | Original TCS subject text, retained for inspection |
| `subjectTags` | `english`, `ict` | Normalized subject/profile filters |
| `eventStart`, `eventEnd` | `2026-10-07` | Event date or range |
| `closingDate` | `2026-09-22` | Deadline window and badge |
| `level` | `Primary · Secondary` | Intended level |
| `participantGroup` | `Teachers and panel heads` | Audience |
| `format` | `Hybrid · Kowloon Tong` | Delivery/location |
| `lastUpdated` | `2026-09-18` | Newest sort and change tracking |
| `badge` | `NEW` / `UPDATED` | Source change indicator |

## Download the TCS pages

Run this from the repository root:

```powershell
node scripts/download-tcs-pages.mjs
```

The downloader first reads the page count from the public calendar, preserves the site session, submits the same pagination form state used by the site, and writes:

- `data/raw/tcs-page-001.html` … `data/raw/tcs-page-NNN.html` — raw page archive.
- `data/tcs-events.json` — normalized snapshot plus metadata.
- `data/tcs-events.js` — browser-loadable snapshot used by the display UI.
- `data/manifest.json` — page status, byte count, hashes and parsed row counts.

The current source response reports 35 pages, so the current snapshot contains 35 downloaded pages and 347 unique events. The page count is discovered at runtime; if TCS later reports 38 pages, the same command will capture all 38.

## Run locally

No package install is required. From the repository root:

```powershell
node scripts/serve.mjs
```

Then open <http://localhost:4173>.

The page loads the downloaded snapshot first and falls back to the isolated mock dataset if `data/tcs-events.js` is unavailable. The teacher profile and language preference are stored in browser `localStorage`.

## Deploy to Google Apps Script

1. Create a new standalone Google Apps Script project.
2. Add `apps-script/Code.gs` as the server entry point.
3. Add `apps-script/Index.html` as the HTML Service entry point.
4. Add three HTML files named `_styles`, `_mock-data` and `_app`.
5. Copy the contents of `styles.css`, `mock-data.js` and `app.js` into those three Apps Script HTML files, respectively. `Index.html` already uses the `include()` helper from `Code.gs` to inline them.
6. Run **Deploy → New deployment → Web app**. Choose the access level that matches the intended audience, then copy the web app URL.
7. In Google Sites, use **Insert → Embed → By URL** and paste the Apps Script web app URL. Give the embed enough vertical space for the filter panel and cards.

The current Apps Script project intentionally keeps the mock dataset on the client. Once the TCS request shape is known, implement `getEvents()` in `apps-script/Code.gs`, return the same normalized event shape, and replace the client-side source call in one place.

## Add a Google Sheet cache later

For the first live iteration, use a Sheet with three tabs:

- `Courses`: normalized events and a content hash.
- `SyncLog`: fetch time, page count, status and error message.
- `Config`: source URL, page size and refresh interval.

Recommended sync flow:

```text
time-driven trigger → fetch pages → parse → normalize → hash → upsert Sheet → UI reads cache
```

Keep the trigger modest (for example, every 3–6 hours) and log the source response status so a changed TCS page structure is visible immediately.

## TCS pagination notes

The first reverse-engineering pass is complete. The live EDB TCS public calendar currently uses:

- server-rendered HTML rows;
- `POST /tcs/portal/publiccalendar/searchPublicCal/search.htm?pageNo=N` for page turns;
- a hidden `courseIdList` value and session cookie carried across page requests;
- a `Page: N of TOTAL` indicator;
- ten course rows per page in the current result set, except the final partial page.

The next scraper iteration should compare normalized rows using `courseId` plus a content hash to detect `NEW`, `UPDATED` and removed events, then move the snapshot into the Google Sheet cache on a 3–6 hour trigger.

Do not introduce OCR or browser automation unless the source actually requires it. First confirm the request and response shape; a server-rendered HTML or stable endpoint is cheaper and more reliable for the first adapter.

## Project map

```text
.
├── index.html              # local preview shell
├── styles.css              # responsive visual system
├── app.js                  # search, filters, sorting and rendering
├── mock-data.js            # isolated normalized sample events
├── Code.gs                 # root Apps Script entry-point reference
├── scripts/
│   └── download-tcs-pages.mjs # capture, parse and normalize TCS pages
├── data/
│   ├── tcs-events.js        # current browser snapshot
│   ├── tcs-events.json      # current normalized snapshot
│   ├── manifest.json         # capture metadata and page hashes
│   └── raw/                  # downloaded HTML pages
└── apps-script/
    ├── Code.gs             # deployable Apps Script entry point
    └── Index.html          # Apps Script template using include()
```

## Status

Prototype with a captured public TCS snapshot. It is not yet an automatically refreshed live feed; schedule the downloader/parser logic in Apps Script or move it to a controlled backend for production use.
