'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { places } from '@/data/places'
import type { LocalEvent } from '@/types/local-event'

type SmartSearchProps = {
  events: LocalEvent[]
  initialQuery?: string
  mode?: 'navigate' | 'interactive'
  browseHref: string
  includePlaces?: boolean
}

type Result =
  | {
      id: string
      kind: 'event'
      title: string
      subtitle: string
      hint: string
      score: number
      eventLink: string
    }
  | {
      id: string
      kind: 'place'
      title: string
      subtitle: string
      hint: string
      score: number
      placeId: number
      filters?: PlannerFilters
    }

type PlannerFilters = {
  indoorOnly?: boolean
  freeOnly?: boolean
  toddlerOnly?: boolean
  dogOnly?: boolean
}

const SUGGESTED_SEARCHES = [
  'rainy day',
  'free',
  'toddlers',
  'outdoors',
] as const

export function SmartSearch({
  events,
  initialQuery = '',
  mode = 'interactive',
  browseHref,
  includePlaces = true,
}: SmartSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const results = useMemo(() => {
    return getSearchResults(query, events, includePlaces).slice(0, 6)
  }, [events, includePlaces, query])

  const topResult = results[0] ?? null

  function applySuggestion(value: string) {
    setQuery(value)
  }

  function openFullPlanner() {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }

    const href = params.toString() ? `${browseHref}?${params.toString()}` : browseHref
    router.push(href)
  }

  function openResult(result: Result) {
    if (mode === 'navigate') {
      const params = new URLSearchParams()
      params.set('q', result.title)
      router.push(`${browseHref}?${params.toString()}`)
      return
    }

    if (result.kind === 'event') {
      window.dispatchEvent(
        new CustomEvent('planner:open-event', {
          detail: { link: result.eventLink },
        }),
      )

      document
        .getElementById('events-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      return
    }

    window.dispatchEvent(
      new CustomEvent('planner:focus-place', {
        detail: {
          placeId: result.placeId,
          filters: result.filters ?? {},
        },
      }),
    )

    document
      .getElementById('place-finder')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
        Smart planner
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">
        Tell us what kind of day you need.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Try things like &quot;rainy day&quot;, &quot;free toddler ideas&quot;,
        &quot;dog-friendly&quot;, or a town like &quot;St Andrews&quot;.
      </p>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                openFullPlanner()
              }
            }}
            placeholder="Search for a family plan..."
            suppressHydrationWarning
            className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-400"
          />
          {mode === 'navigate' ? (
            <button
              type="button"
              onClick={openFullPlanner}
              className="rounded-[1.1rem] bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Search
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_SEARCHES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
              className="rounded-full bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {topResult ? (
        <div className="mt-5 rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Best match
          </p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                {topResult.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{topResult.subtitle}</p>
              <p className="mt-2 text-sm text-slate-500">{topResult.hint}</p>
            </div>

            <button
              type="button"
              onClick={() => openResult(topResult)}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Open match
            </button>
          </div>
        </div>
      ) : null}

      {query.trim() ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => openResult(result)}
              className="rounded-[1.25rem] border border-slate-200 bg-white p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/40"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {result.kind === 'event' ? 'Event' : 'Place'}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-950">
                {result.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{result.subtitle}</p>
              <p className="mt-2 text-sm text-slate-500">{result.hint}</p>
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'navigate' ? (
        <div className="mt-5">
          <Link
            href={browseHref}
            className="text-sm font-medium text-sky-700 underline decoration-sky-200 underline-offset-4"
          >
            Go straight to the full planner
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function getSearchResults(
  query: string,
  events: LocalEvent[],
  includePlaces: boolean,
): Result[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  const intentFilters = getIntentFilters(normalizedQuery)
  const eventResults = events
    .map((event) => scoreEventResult(event, normalizedQuery))
    .filter((result): result is Result => result !== null)

  const placeResults = includePlaces
    ? places
        .map((place) => scorePlaceResult(place, normalizedQuery, intentFilters))
        .filter((result): result is Result => result !== null)
    : []

  return [...eventResults, ...placeResults].sort((left, right) => {
    return right.score - left.score
  })
}

function getIntentFilters(query: string): PlannerFilters {
  return {
    indoorOnly: query.includes('rainy') || query.includes('indoor'),
    freeOnly: query.includes('free') || query.includes('cheap'),
    toddlerOnly: query.includes('toddler') || query.includes('little one'),
    dogOnly: query.includes('dog') || query.includes('walk'),
  }
}

function scoreEventResult(event: LocalEvent, query: string): Result | null {
  const haystack =
    `${event.title} ${event.summary} ${event.location} ${event.category} ${event.sourceName}`.toLowerCase()

  let score = 0

  if (haystack.includes(query)) score += 14
  if (event.title.toLowerCase().includes(query)) score += 10
  if (event.location.toLowerCase().includes(query)) score += 6
  if (query.includes('event')) score += 2
  if (query.includes('family')) score += 3
  if (query.includes('day out')) score += 4
  if (
    (query.includes('toddler') || query.includes('toddlers')) &&
    (haystack.includes('family') ||
      haystack.includes('kids') ||
      haystack.includes('children') ||
      haystack.includes('baby') ||
      haystack.includes('play'))
  ) {
    score += 10
  }
  if (
    (query.includes('toddler') || query.includes('toddlers')) &&
    event.category.toLowerCase().includes('family')
  ) {
    score += 8
  }
  if (query.includes('st andrews') && event.location.toLowerCase().includes('st andrews')) {
    score += 6
  }

  if (score === 0) return null

  return {
    id: `event-${event.link}`,
    kind: 'event',
    title: event.title,
    subtitle: `${event.location} • ${event.dateLabel}`,
    hint: `${event.category} from ${event.sourceName}`,
    score,
    eventLink: event.link,
  }
}

function scorePlaceResult(
  place: (typeof places)[number],
  query: string,
  intentFilters: PlannerFilters,
): Result | null {
  const haystack =
    `${place.name} ${place.description} ${place.town} ${place.area}`.toLowerCase()

  let score = 0

  if (haystack.includes(query)) score += 14
  if (place.name.toLowerCase().includes(query)) score += 10
  if (place.town.toLowerCase().includes(query)) score += 6
  if (query.includes('rainy') && place.indoor) score += 9
  if (query.includes('indoor') && place.indoor) score += 7
  if (query.includes('free') && place.free) score += 8
  if ((query.includes('toddler') || query.includes('toddlers')) && place.toddlerFriendly) {
    score += 6
  }
  if (query.includes('dog') && place.dogFriendly) score += 8
  if (query.includes('walk') && place.dogFriendly) score += 5
  if (query.includes('beach') && place.name.toLowerCase().includes('beach')) score += 7
  if (query.includes('park') && place.name.toLowerCase().includes('park')) score += 7

  if (score === 0) return null

  return {
    id: `place-${place.id}`,
    kind: 'place',
    title: place.name,
    subtitle: `${place.town} • ${place.area}`,
    hint: place.description,
    score,
    placeId: place.id,
    filters: intentFilters,
  }
}
