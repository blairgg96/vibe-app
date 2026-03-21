# Fife Events

Simple Next.js site for live Fife events plus local gala day entries.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Event sources

- Live scraped sources already in the app
- Local fallback events in [data/events.ts](/Users/blairgibson/vibe-app/data/events.ts)
- Optional Notion database

## Notion setup

1. Copy `.env.example` to `.env.local`
2. Add:

```bash
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

3. Share your Notion database with the integration

Recommended Notion properties:

- `Name` as title
- `Town` as rich text
- `Date` as date
- `Time` as rich text
- `Location` as rich text
- `Note` as rich text
- `Source URL` as url
- `Image` as files or external url
- `Published` as checkbox

If Notion is not configured, the site falls back to [data/events.ts](/Users/blairgibson/vibe-app/data/events.ts).
