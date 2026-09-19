# TCS Better Calendar

A lightweight prototype for a calmer way to browse Hong Kong EDB TCS professional learning events.

The MVP is intentionally framework-free. It gives the future Google Sites + Google Apps Script implementation a working interaction model before the live TCS source is wired in.

## What is in the prototype

- Responsive event cards with event date, audience, format and closing date.
- Search across title, summary, category, level, audience and format.
- Category filters for `Secondary`, `IT/AI`, `CSD` and `STEAM`.
- Deadline windows for all events, the next 7 days and the next 30 days.
- Sort modes for closing date, event date and newest added.
- `NEW`, `UPDATED` and computed `CLOSING SOON` badges.
- Deterministic mock data isolated in [`mock-data.js`](mock-data.js).
- A future Apps Script entry point in [`Code.gs`](Code.gs) and an Apps Script-ready template in [`apps-script/`](apps-script/).

## Architecture

```text
┌────────────────────┐       normalized event shape       ┌───────────────────┐
│  TCS source adapter│ ─────────────────────────────────▶ │  Calendar UI      │
│  (future scraper)  │                                    │  search / filters │
└─────────┬──────────┘                                    └─────────┬─────────┘
          │                                                        │
          ▼                                                        ▼
  Apps Script fetcher                                  Google Sites embed
  + Google Sheet cache                                  (future container)
```

Today, `mock-data.js` stands in for the source adapter. The UI only depends on the normalized fields below, so replacing the dataset does not require rewriting the filters or cards.

| Field | Example | Purpose |
| --- | --- | --- |
| `courseId` | `TCS-IT-26091` | Stable source identifier |
| `title` | `Generative AI for Classroom Practice` | Display title |
| `category` | `IT/AI` | Filter bucket |
| `eventStart`, `eventEnd` | `2026-10-07` | Event date or range |
| `closingDate` | `2026-09-22` | Deadline window and badge |
| `level` | `Primary · Secondary` | Intended level |
| `participantGroup` | `Teachers and panel heads` | Audience |
| `format` | `Hybrid · Kowloon Tong` | Delivery/location |
| `lastUpdated` | `2026-09-18` | Newest sort and change tracking |
| `badge` | `NEW` / `UPDATED` | Source change indicator |

## Run locally

No package install is required. From the repository root:

```powershell
py -m http.server 4173
```

Then open <http://localhost:4173>.

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

## Next step: reverse-engineer TCS pagination

Before building the scraper, inspect the live EDB TCS public calendar in a browser and record one complete page change:

1. Open the public calendar and capture the request made when moving from page 1 to page 2.
2. Determine whether pagination uses query parameters, a form POST, a hidden page token, or an AJAX endpoint.
3. Record the page-size parameter, total-page indicator, response content type and the fields used for a course row.
4. Save one raw response fixture and one parsed JSON fixture in a future `fixtures/` folder.
5. Implement a bounded page loop with a small delay, retry handling and a hard maximum page count.
6. Compare normalized rows using `courseId` plus a content hash to detect `NEW`, `UPDATED` and removed events.

Do not introduce OCR or browser automation unless the source actually requires it. First confirm the request and response shape; a server-rendered HTML or stable endpoint is cheaper and more reliable for the first adapter.

## Project map

```text
.
├── index.html              # local preview shell
├── styles.css              # responsive visual system
├── app.js                  # search, filters, sorting and rendering
├── mock-data.js            # isolated normalized sample events
├── Code.gs                 # root Apps Script entry-point reference
└── apps-script/
    ├── Code.gs             # deployable Apps Script entry point
    └── Index.html          # Apps Script template using include()
```

## Status

Prototype only. The event content is fictional sample data shaped after the intended TCS fields and is not a live feed.
