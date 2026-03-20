import type { LocalEvent } from '@/types/local-event'

const SOURCE_URL = 'https://www.welcometofife.com/events'

const CATEGORIES = [
  'Nature, health & wellbeing',
  'Fife Food & Drink Week',
  'Markets & Shopping',
  'Talks & lectures',
  'Workshops & classes',
  'Arts & culture',
  'Food & drink',
  'Comedy',
  'Family',
  'Sports',
  'Theatre',
  'Music',
  'Film',
] as const

export async function getWelcomeToFifeEvents() {
  const response = await fetch(SOURCE_URL, {
    cache: 'no-store',
    headers: {
      'user-agent': 'vibe-app/0.1 (+welcome to fife events)',
    },
  })

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`)
  }

  const html = await response.text()
  return parseWelcomeToFifeEvents(html)
}

function parseWelcomeToFifeEvents(html: string): LocalEvent[] {
  const sectionHtml = getSectionBetween(html, 'ON THIS MONTH', 'List your event')
  if (!sectionHtml) return []

  const anchorPattern = /<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi
  const anchors = Array.from(sectionHtml.matchAll(anchorPattern)).map((match) => ({
    href: toAbsoluteUrl(match[2]),
    text: normalizeText(stripTags(match[3])),
  }))

  const events: LocalEvent[] = []

  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index]
    if (!isEventLine(anchor.text)) continue

    const details = parseEventLine(anchor.text)
    if (!details) continue

    const nextAnchor = anchors[index + 1]
    const location = nextAnchor && isLocationLine(nextAnchor.text) ? nextAnchor.text : 'Fife'

    events.push({
      title: details.title,
      dateLabel: details.dateLabel,
      category: details.category,
      location,
      summary: `${details.category} event in ${location}. More details available on Welcome to Fife.`,
      image: null,
      link: anchor.href,
      sourceName: 'Welcome to Fife',
    })
  }

  return events
}

function parseEventLine(text: string) {
  const category = getCategory(text)
  const withoutCategory = category
    ? text.slice(0, -category.length).trim()
    : text.trim()

  const scheduleMatch = withoutCategory.match(
    /^(.*?\d{2}:\d{2}(?:\s*-\s*\d{2}:\d{2})?)\s+(.+)$/,
  )

  if (!scheduleMatch) return null

  return {
    dateLabel: scheduleMatch[1].trim(),
    title: scheduleMatch[2].trim(),
    category: category ?? 'Event',
  }
}

function getCategory(text: string) {
  return [...CATEGORIES]
    .sort((left, right) => right.length - left.length)
    .find((category) => text.endsWith(category))
}

function isEventLine(text: string) {
  return /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s/.test(text)
}

function isLocationLine(text: string) {
  return Boolean(text) && !isEventLine(text) && text.length < 80
}

function getSectionBetween(html: string, startMarker: string, endMarker: string) {
  const startIndex = html.indexOf(startMarker)
  if (startIndex === -1) return ''

  const endIndex = html.indexOf(endMarker, startIndex)
  if (endIndex === -1) return html.slice(startIndex)

  return html.slice(startIndex, endIndex)
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
