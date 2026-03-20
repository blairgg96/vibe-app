import type { LocalEvent } from '@/types/local-event'
import { getEventbriteEvents } from '@/lib/eventbrite'
import { getOnFifeEvents } from '@/lib/onfife'
import { getWelcomeToFifeEvents } from '@/lib/welcome-to-fife'

const SOURCE_URL = 'https://www.whatsonfife.co.uk/'
const EVENT_LIMIT = 10

const FAMILY_URL = 'https://www.whatsonfife.co.uk/events/family-and-kids/'
const DAYS_OUT_URL = 'https://www.whatsonfife.co.uk/events/days-out/'

const LIST_END_MARKERS = [
  "Here's a selection of events you can find over on our sister site",
  "Here's a selection of Active Events",
  "Here's a selection of events you can find over on our sister sites",
  '### Sponsored Links',
]

type EventsResult = {
  events: LocalEvent[]
  sourceUrl: string
  warning?: string
}

export async function getFifeEvents(): Promise<EventsResult> {
  try {
    const [familyHtml, daysOutHtml] = await Promise.all([
      fetchSource(FAMILY_URL),
      fetchSource(DAYS_OUT_URL),
    ])

    const familyEvents = parseWhatsOnFifeListing(familyHtml, 'Family and Kids')
    const daysOutEvents = parseWhatsOnFifeListing(daysOutHtml, 'Days Out')
    const [welcomeEvents, eventbriteEvents, onFifeEvents] = await Promise.all([
      getWelcomeToFifeEvents().catch(() => []),
      getEventbriteEvents().catch(() => []),
      getOnFifeEvents().catch(() => []),
    ])
    const rankedEvents = orderFamilyEvents(
      dedupeEvents([
        ...familyEvents,
        ...daysOutEvents,
        ...welcomeEvents,
        ...eventbriteEvents,
        ...onFifeEvents,
      ]),
    )
    const selectedEvents = withSourceCoverage(rankedEvents).slice(0, EVENT_LIMIT)
    const events = await enrichEventsWithImages(selectedEvents)

    if (events.length === 0) {
      return {
        events: [],
        sourceUrl: SOURCE_URL,
        warning:
          "What's On Fife responded, but its listing layout did not match the current parser.",
      }
    }

    return { events, sourceUrl: SOURCE_URL }
  } catch {
    return {
      events: [],
      sourceUrl: SOURCE_URL,
      warning:
        'Live events could not be loaded right now, so this panel is showing a graceful empty state.',
    }
  }
}

async function fetchSource(url: string) {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      'user-agent': 'vibe-app/0.1 (+family day out events)',
    },
  })

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`)
  }

  return response.text()
}

function parseWhatsOnFifeListing(
  html: string,
  fallbackCategory: string,
): LocalEvent[] {
  const lines = htmlToLines(html)
  const startIndex = lines.findIndex((line) => line === 'Events in Fife')
  if (startIndex === -1) return []

  const contentLines = lines
    .slice(startIndex + 1)
    .filter((line) => !line.startsWith('Filter by '))

  const eventLinks = getEventLinks(html)
  const events: LocalEvent[] = []

  for (let index = 0; index < contentLines.length; index += 1) {
    const line = contentLines[index]

    if (LIST_END_MARKERS.some((marker) => line.includes(marker))) {
      break
    }

    const nextLine = contentLines[index + 1]
    const dateLine = contentLines[index + 2]
    const locationLine = contentLines[index + 3]
    const summaryLine = contentLines[index + 4]

    if (!nextLine || !dateLine || !locationLine || !summaryLine) {
      continue
    }

    if (!looksLikeCategory(line, fallbackCategory)) {
      continue
    }

    if (!looksLikeDate(dateLine)) {
      continue
    }

    if (!looksLikeSummary(summaryLine)) {
      continue
    }

    const link = eventLinks.get(nextLine) ?? SOURCE_URL

    events.push({
      title: nextLine,
      dateLabel: dateLine,
      category: line,
      location: locationLine,
      summary: summaryLine,
      image: null,
      link,
      sourceName: "What's On Fife",
    })
  }

  return events
}

function getEventLinks(html: string) {
  const links = new Map<string, string>()
  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi

  for (const match of html.matchAll(anchorPattern)) {
    const text = normalizeText(stripTags(match[3]))
    if (!text || text === 'READ MORE') continue
    if (looksLikeDate(text) || text === 'Family and Kids' || text === 'Days Out') {
      continue
    }

    links.set(text, toAbsoluteUrl(match[2]))
  }

  return links
}

function htmlToLines(html: string) {
  const withBreaks = html
    .replace(/<(br|\/p|\/div|\/section|\/article|\/li|\/ul|\/ol|\/h1|\/h2|\/h3|\/h4|\/h5|\/h6)[^>]*>/gi, '\n')
    .replace(/<a\b[^>]*>/gi, '')
    .replace(/<\/a>/gi, '\n')

  return decodeHtmlEntities(stripTags(withBreaks))
    .split('\n')
    .map((line) => normalizeText(line))
    .filter(Boolean)
}

function looksLikeCategory(line: string, fallbackCategory: string) {
  return (
    line === fallbackCategory ||
    line === 'Family and Kids' ||
    line === 'Days Out'
  )
}

function looksLikeDate(line: string) {
  return (
    line.startsWith('Selected dates between ') ||
    /^\d{1,2}(st|nd|rd|th)\s+[A-Za-z]+\s+\d{4}/.test(line)
  )
}

function looksLikeSummary(line: string) {
  return line.length > 40 && line !== 'READ MORE'
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

function dedupeEvents(events: LocalEvent[]) {
  const seen = new Set<string>()

  return events.filter((event) => {
    const key = `${event.title}-${event.dateLabel}-${event.location}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function orderFamilyEvents(events: LocalEvent[]) {
  return [...events].sort((left, right) => {
    const scoreDifference = scoreEvent(right) - scoreEvent(left)
    if (scoreDifference !== 0) {
      return scoreDifference
    }

    const leftDate = getSortTimestamp(left.dateLabel)
    const rightDate = getSortTimestamp(right.dateLabel)

    return leftDate - rightDate
  })
}

function scoreEvent(event: LocalEvent) {
  const haystack = `${event.title} ${event.summary} ${event.category}`.toLowerCase()

  let score = 0

  if (event.category === 'Family and Kids') score += 8
  if (event.category === 'Days Out') score += 5
  if (haystack.includes('family')) score += 5
  if (haystack.includes('kids')) score += 4
  if (haystack.includes('children')) score += 4
  if (haystack.includes('day out')) score += 4
  if (haystack.includes('free')) score += 2
  if (haystack.includes('market')) score += 1
  if (haystack.includes('garden')) score += 1
  if (haystack.includes('trail')) score += 2
  if (haystack.includes('exhibition')) score += 1

  return score
}

function getSortTimestamp(dateLabel: string) {
  const selectedDatesMatch = dateLabel.match(
    /Selected dates between (\d{1,2}(?:st|nd|rd|th)\s+[A-Za-z]+\s+\d{4})/,
  )
  const singleDateMatch = dateLabel.match(
    /(\d{1,2}(?:st|nd|rd|th)\s+[A-Za-z]+\s+\d{4})/,
  )

  const value = selectedDatesMatch?.[1] ?? singleDateMatch?.[1]
  if (!value) return Number.MAX_SAFE_INTEGER

  const normalized = value.replace(/(\d{1,2})(st|nd|rd|th)/, '$1')
  const timestamp = Date.parse(normalized)

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

function withSourceCoverage(events: LocalEvent[]) {
  const bySource = new Map<string, LocalEvent[]>()

  for (const event of events) {
    const current = bySource.get(event.sourceName) ?? []
    current.push(event)
    bySource.set(event.sourceName, current)
  }

  const selected: LocalEvent[] = []
  const seen = new Set<string>()

  for (const sourceEvents of bySource.values()) {
    for (const event of sourceEvents.slice(0, 2)) {
      const key = `${event.title}-${event.dateLabel}-${event.location}`
      if (seen.has(key)) continue
      seen.add(key)
      selected.push(event)
    }
  }

  for (const event of events) {
    const key = `${event.title}-${event.dateLabel}-${event.location}`
    if (seen.has(key)) continue
    seen.add(key)
    selected.push(event)
  }

  return selected
}

async function enrichEventsWithImages(events: LocalEvent[]) {
  return Promise.all(
    events.map(async (event) => {
      const image = await getEventImage(event.link)
      return {
        ...event,
        image,
      }
    }),
  )
}

async function getEventImage(url: string) {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'user-agent': 'vibe-app/0.1 (+family day out event images)',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    return (
      getMetaContent(html, 'property', 'og:image') ??
      getMetaContent(html, 'name', 'twitter:image') ??
      null
    )
  } catch {
    return null
  }
}

function getMetaContent(html: string, attribute: string, value: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}=["']${escapeRegex(value)}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i',
  )

  return pattern.exec(html)?.[1] ?? null
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
