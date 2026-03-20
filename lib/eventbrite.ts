import type { LocalEvent } from '@/types/local-event'

const SOURCE_URL = 'https://www.eventbrite.co.uk/d/united-kingdom--fife/family/'

const STOP_MARKERS = [
  'Things to do around Fife',
  'Things to do in Edinburgh',
  'Explore more trends',
  'View map',
]

export async function getEventbriteEvents() {
  const response = await fetch(SOURCE_URL, {
    cache: 'no-store',
    headers: {
      'user-agent': 'vibe-app/0.1 (+eventbrite family events)',
    },
  })

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`)
  }

  const html = await response.text()
  return parseEventbriteEvents(html)
}

function parseEventbriteEvents(html: string): LocalEvent[] {
  const lines = htmlToLines(html)
  const startIndex = lines.findIndex((line) =>
    line.includes('Family events in Fife'),
  )

  if (startIndex === -1) return []

  const contentLines = lines.slice(startIndex + 1)
  const events: LocalEvent[] = []

  for (let index = 0; index < contentLines.length; index += 1) {
    const line = contentLines[index]

    if (STOP_MARKERS.some((marker) => line.includes(marker))) {
      break
    }

    if (isNoiseLine(line)) continue

    const title = line
    const dateLabel = contentLines[index + 1]
    const location = contentLines[index + 2]

    if (!title || !dateLabel || !location) continue
    if (!looksLikeEventbriteDate(dateLabel)) continue
    if (isNoiseLine(location)) continue
    if (!isFamilyRelevant(title, location)) continue

    const link = findEventLink(html, title) ?? SOURCE_URL

    events.push({
      title,
      dateLabel,
      location,
      category: 'Family',
      summary: `Family event listed on Eventbrite in ${location}.`,
      image: null,
      link,
      sourceName: 'Eventbrite',
    })

    index += 2
  }

  return dedupe(events)
}

function findEventLink(html: string, title: string) {
  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi

  for (const match of html.matchAll(anchorPattern)) {
    const text = normalizeText(stripTags(match[3]))
    if (text === title) {
      return toAbsoluteUrl(match[2])
    }
  }

  return null
}

function looksLikeEventbriteDate(line: string) {
  return (
    /^(Today|Tomorrow|Sat|Sun|Mon|Tue|Wed|Thu|Fri)/.test(line) ||
    /^[A-Z][a-z]{2},\s/.test(line)
  )
}

function isNoiseLine(line: string) {
  return (
    !line ||
    line === 'Save this event' ||
    line === 'Share this event' ||
    line.startsWith('Save this event:') ||
    line.startsWith('Share this event:') ||
    line === 'Sales end soon' ||
    line === 'Selling quickly' ||
    line === 'Filters' ||
    line === 'Date' ||
    line === 'Category' ||
    line === 'Format' ||
    line === 'Price' ||
    line === 'Language' ||
    line === 'Currency' ||
    line === 'Search events' ||
    line === 'Choose a location'
  )
}

function isFamilyRelevant(title: string, location: string) {
  const haystack = `${title} ${location}`.toLowerCase()

  const positiveSignals = [
    'family',
    'child',
    'children',
    'kids',
    'kid',
    'baby',
    'toddler',
    'soft play',
    'play',
    'disco',
    'festival',
    'fair',
    'museum',
    'trail',
    'craft',
    'easter',
    'christmas',
    'santa',
  ]

  const negativeSignals = [
    'marketing',
    'networking',
    'business',
    'meetup',
    'investor',
    'startup',
    'conference',
    'workshop for founders',
    'b2b',
  ]

  if (negativeSignals.some((signal) => haystack.includes(signal))) {
    return false
  }

  return positiveSignals.some((signal) => haystack.includes(signal))
}

function htmlToLines(html: string) {
  const withBreaks = html
    .replace(
      /<(br|\/p|\/div|\/section|\/article|\/li|\/ul|\/ol|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6)[^>]*>/gi,
      '\n',
    )
    .replace(/<a\b[^>]*>/gi, '')
    .replace(/<\/a>/gi, '\n')

  return decodeHtmlEntities(stripTags(withBreaks))
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean)
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, ' ')
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
