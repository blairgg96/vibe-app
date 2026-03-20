import type { LocalEvent } from '@/types/local-event'

const SOURCE_URL = 'https://www.onfife.com/events/'

const POSITIVE_SIGNALS = [
  'family',
  'children',
  'child',
  'kids',
  'kid',
  'farmyard',
  'little mermaid',
  'museum',
  'galleries',
  'craft',
  'dance',
  'festival',
  'films - breakfast club',
  'breakfast club',
  'unearthed',
  'three little pigs',
  'mcdougalls',
] as const

const NEGATIVE_SIGNALS = [
  'hypnotist',
  'elvis',
  'footloose',
  'dr john cooper clark',
  'chief – still no apologies',
  'networking',
  'comedy hypnotist',
  'wuthering heights',
  'jekyll',
] as const

export async function getOnFifeEvents() {
  const response = await fetch(SOURCE_URL, {
    cache: 'no-store',
    headers: {
      'user-agent': 'vibe-app/0.1 (+onfife events)',
    },
  })

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`)
  }

  const html = await response.text()
  return parseOnFifeEvents(html)
}

function parseOnFifeEvents(html: string): LocalEvent[] {
  const lines = htmlToLines(html)
  const startIndex = lines.findIndex((line) => line === 'Search')
  if (startIndex === -1) return []

  const events: LocalEvent[] = []

  for (const match of html.matchAll(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>\s*([^<]+?)\s*<\/a>/gi)) {
    const href = match[2]
    const text = normalizeText(match[3])
    const absoluteUrl = toAbsoluteUrl(href)

    if (!absoluteUrl.includes('/event/') && !absoluteUrl.includes('/pride/')) {
      continue
    }

    const listingLine = lines.find((line) => line.includes(text))
    if (!listingLine) continue

    const parts = splitOnFifeListing(listingLine)
    if (!parts) continue
    if (!isFamilyRelevant(parts.title, parts.location)) continue

    events.push({
      title: parts.title,
      dateLabel: parts.dateLabel,
      location: parts.location,
      category: 'Family',
      summary: `Family-friendly OnFife event at ${parts.location}.`,
      image: null,
      link: absoluteUrl,
      sourceName: 'OnFife',
    })
  }

  return dedupe(events)
}

function splitOnFifeListing(line: string) {
  const dateMatch = line.match(
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}(st|nd|rd|th)\s+[A-Za-z]+(?:\s+-\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}(st|nd|rd|th)\s+[A-Za-z]+|(?:\s+-\s+Various Times)?)?/,
  )

  if (!dateMatch) return null

  const dateLabel = dateMatch[0].trim()
  const beforeDate = line.slice(0, dateMatch.index).trim()
  const title = beforeDate
    .replace(/\s+/g, ' ')
    .trim()

  const location = line.slice((dateMatch.index ?? 0) + dateLabel.length).trim()

  if (!title || !location) return null

  return { title, dateLabel, location }
}

function isFamilyRelevant(title: string, location: string) {
  const haystack = `${title} ${location}`.toLowerCase()

  if (NEGATIVE_SIGNALS.some((signal) => haystack.includes(signal))) {
    return false
  }

  return POSITIVE_SIGNALS.some((signal) => haystack.includes(signal))
}

function htmlToLines(html: string) {
  return decodeHtmlEntities(html)
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean)
}

function normalizeText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&hellip;/g, '...')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  }

function toAbsoluteUrl(href: string) {
  try {
    return new URL(href, SOURCE_URL).toString()
  } catch {
    return SOURCE_URL
  }
}

function dedupe(events: LocalEvent[]) {
  const seen = new Set<string>()

  return events.filter((event) => {
    const key = `${event.title}-${event.dateLabel}-${event.location}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
