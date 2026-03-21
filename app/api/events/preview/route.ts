import { NextRequest } from 'next/server'
import type { EventPreview } from '@/types/local-event'

const ALLOWED_HOSTS = new Set([
  'welcometofife.com',
  'www.welcometofife.com',
  'whatsonfife.co.uk',
  'www.whatsonfife.co.uk',
])

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const urlParam = searchParams.get('url')

  if (!urlParam) {
    return Response.json({ error: 'Missing event URL.' }, { status: 400 })
  }

  const eventUrl = toSafeUrl(urlParam)
  if (!eventUrl) {
    return Response.json({ error: 'Invalid event URL.' }, { status: 400 })
  }

  try {
    const response = await fetch(eventUrl.toString(), {
      headers: {
        'user-agent': 'vibe-app/0.1 (+event preview)',
      },
    })

    if (!response.ok) {
      return Response.json(
        { error: `Source returned ${response.status}.` },
        { status: 502 },
      )
    }

    const html = await response.text()
    const preview = parseEventPreview(html, {
      url: eventUrl.toString(),
      title: searchParams.get('title'),
      dateLabel: searchParams.get('dateLabel'),
      location: searchParams.get('location'),
      category: searchParams.get('category'),
      image: searchParams.get('image'),
    })

    return Response.json(preview)
  } catch {
    return Response.json(
      { error: 'Could not load the event details right now.' },
      { status: 502 },
    )
  }
}

function toSafeUrl(value: string) {
  try {
    const url = new URL(value)
    if (!ALLOWED_HOSTS.has(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

function parseEventPreview(
  html: string,
  fallback: {
    url: string
    title: string | null
    dateLabel: string | null
    location: string | null
    category: string | null
    image: string | null
  },
): EventPreview {
  const title =
    getMetaContent(html, 'property', 'og:title') ??
    getTagText(html, 'h1') ??
    fallback.title ??
    'Event details'

  const summary =
    getMetaContent(html, 'name', 'description') ??
    getMetaContent(html, 'property', 'og:description') ??
    getJsonLdValue(html, 'description') ??
    getFirstReadableParagraph(html) ??
    'More information is available on the source listing page.'

  const image =
    fallback.image ??
    getMetaContent(html, 'property', 'og:image') ??
    getJsonLdValue(html, 'image') ??
    null

  const venue =
    getJsonLdValue(html, 'location.name') ??
    getLabeledValue(html, 'Venue') ??
    getLabeledValue(html, 'Location') ??
    fallback.location ??
    'Fife'

  const address =
    getJsonLdValue(html, 'location.address.streetAddress') ??
    getJsonLdValue(html, 'location.address.addressLocality') ??
    getLabeledValue(html, 'Address') ??
    null

  const dateLabel =
    getJsonLdValue(html, 'startDate') ??
    getLabeledValue(html, 'Date') ??
    fallback.dateLabel ??
    'Date not listed'

  const bookingUrl =
    getMetaContent(html, 'property', 'og:url') ??
    getJsonLdValue(html, 'url') ??
    fallback.url

  return {
    title: normalizeText(title),
    summary: normalizeText(summary),
    image,
    venue: normalizeText(venue),
    address: address ? normalizeText(address) : null,
    dateLabel: formatDateLabel(dateLabel, fallback.dateLabel),
    category: fallback.category ?? 'Event',
    sourceUrl: fallback.url,
    bookingUrl,
  }
}

function getMetaContent(html: string, attribute: string, value: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}=["']${escapeRegex(value)}["'][^>]*content=["']([^"']+)["'][^>]*>`,
    'i',
  )
  return pattern.exec(html)?.[1] ?? null
}

function getTagText(html: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i')
  const match = pattern.exec(html)
  return match ? stripTags(match[1]) : null
}

function getLabeledValue(html: string, label: string) {
  const pattern = new RegExp(
    `${escapeRegex(label)}\\s*<[^>]*>\\s*<[^>]*>([\\s\\S]*?)<\\/[^>]+>`,
    'i',
  )
  const match = pattern.exec(html)

  return match ? stripTags(match[1]) : null
}

function getJsonLdValue(html: string, path: string) {
  const scripts = Array.from(
    html.matchAll(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  )

  for (const script of scripts) {
    try {
      const raw = script[1].trim()
      if (!raw) continue

      const parsed = JSON.parse(raw)
      const nodes = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed]

      for (const node of nodes) {
        const value = readPath(node, path)
        if (typeof value === 'string' && value.trim()) {
          return value
        }

        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0]
        }
      }
    } catch {
      continue
    }
  }

  return null
}

function readPath(value: unknown, path: string): unknown {
  const keys = path.split('.')
  let current = value

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null
    }

    current = (current as Record<string, unknown>)[key]
  }

  return current
}

function getFirstReadableParagraph(html: string) {
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => normalizeText(stripTags(match[1])))
    .filter(
      (paragraph) =>
        paragraph.length > 80 &&
        !paragraph.toLowerCase().includes('privacy policy') &&
        !paragraph.toLowerCase().includes('cookie'),
    )

  return paragraphs[0] ?? null
}

function formatDateLabel(value: string, fallback: string | null) {
  const normalized = normalizeText(value)
  const asDate = new Date(normalized)

  if (!Number.isNaN(asDate.getTime())) {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(asDate)
  }

  return normalized || fallback || 'Date not listed'
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
