'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { MagicCard } from '@/components/ui/magic-card'
import type { EventPreview, LocalEvent } from '@/types/local-event'

type EventsPanelProps = {
  events: LocalEvent[]
  warning?: string
}

type PreviewState =
  | { status: 'idle'; event: null; details: null; error: null }
  | { status: 'loading'; event: LocalEvent; details: null; error: null }
  | { status: 'ready'; event: LocalEvent; details: EventPreview; error: null }
  | { status: 'error'; event: LocalEvent; details: null; error: string }

export function EventsPanel({
  events,
  warning,
}: EventsPanelProps) {
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all')
  const [locationFilter, setLocationFilter] = useState<'all' | string>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, true>>({})
  const [preview, setPreview] = useState<PreviewState>({
    status: 'idle',
    event: null,
    details: null,
    error: null,
  })

  const eventLinksSignature = useMemo(() => {
    return events.map((event) => event.link).join('|')
  }, [events])

  const sourceOptions = useMemo(() => {
    return ['all', ...new Set(events.map((event) => event.sourceName))]
  }, [events])

  const locationOptions = useMemo(() => {
    return ['all', ...new Set(events.map((event) => getTownLabel(event.location)))]
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (sourceFilter !== 'all' && event.sourceName !== sourceFilter) {
        return false
      }

      if (
        locationFilter !== 'all' &&
        getTownLabel(event.location) !== locationFilter
      ) {
        return false
      }

      return true
    })
  }, [events, locationFilter, sourceFilter])

  useEffect(() => {
    setCurrentIndex(0)
  }, [eventLinksSignature])

  useEffect(() => {
    if (events.length <= 1) return
    if (preview.status !== 'idle') return

    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => {
        if (events.length === 0) return 0
        return index === events.length - 1 ? 0 : index + 1
      })
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [events.length, preview.status])

  useEffect(() => {
    function handleOpenEvent(event: Event) {
      const customEvent = event as CustomEvent<{ link?: string }>
      const link = customEvent.detail?.link
      if (!link) return

      const targetIndex = events.findIndex((item) => item.link === link)
      if (targetIndex === -1) return

      setCurrentIndex(targetIndex)
      openPreview(events[targetIndex])
    }

    window.addEventListener(
      'planner:open-event',
      handleOpenEvent as EventListener,
    )

    return () => {
      window.removeEventListener(
        'planner:open-event',
        handleOpenEvent as EventListener,
      )
    }
  }, [eventLinksSignature, events])

  useEffect(() => {
    if (preview.status === 'idle') return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPreview({
          status: 'idle',
          event: null,
          details: null,
          error: null,
        })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [preview.status])

  async function openPreview(event: LocalEvent) {
    if (!supportsRemotePreview(event.link)) {
      setPreview({
        status: 'ready',
        event,
        details: createFallbackPreview(event),
        error: null,
      })
      return
    }

    setPreview({
      status: 'loading',
      event,
      details: null,
      error: null,
    })

    const params = new URLSearchParams({
      url: event.link,
      title: event.title,
      dateLabel: event.dateLabel,
      location: event.location,
      category: event.category,
    })

    try {
      const response = await fetch(`/api/events/preview?${params.toString()}`)
      const payload = (await response.json()) as EventPreview | { error?: string }

      if (hasError(payload)) {
        throw new Error(payload.error || 'Could not load the event details.')
      }

      if (!response.ok) {
        throw new Error('Could not load the event details.')
      }

      setPreview({
        status: 'ready',
        event,
        details: payload,
        error: null,
      })
    } catch (error) {
      setPreview({
        status: 'error',
        event,
        details: null,
        error:
          error instanceof Error
            ? error.message
            : 'Could not load the event details.',
      })
    }
  }

  function closePreview() {
    setPreview({
      status: 'idle',
      event: null,
      details: null,
      error: null,
    })
  }

  function showPrevious() {
    setCurrentIndex((index) => {
      if (events.length === 0) return 0
      return index === 0 ? events.length - 1 : index - 1
    })
  }

  function showNext() {
    setCurrentIndex((index) => {
      if (events.length === 0) return 0
      return index === events.length - 1 ? 0 : index + 1
    })
  }

  function hasUsableImage(value: string | null | undefined) {
    return Boolean(value && !imageLoadErrors[value])
  }

  function markImageFailed(value: string | null | undefined) {
    if (!value) return

    setImageLoadErrors((current) => {
      if (current[value]) return current
      return {
        ...current,
        [value]: true,
      }
    })
  }

  return (
    <>
      <MagicCard
        id="events-panel"
        className="p-4 sm:p-6"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-2xl bg-white/90 p-1 ring-1 ring-slate-200">
              <Image
                src="/logo.png"
                alt="Fife Family Picks logo"
                width={56}
                height={56}
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Fife Family Picks
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Family days out, local events, and quick ideas across Fife.
              </p>
            </div>
          </div>

        </div>

        {warning ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            {warning}
          </div>
        ) : null}

        <div className="mt-5">
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm leading-6 text-slate-600">
              No events are available right now.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-slate-200">
                <div
                  className="flex will-change-transform transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {events.map((event) => (
                    <article
                      key={`${event.title}-${event.dateLabel}-${event.location}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => openPreview(event)}
                      onKeyDown={(keyboardEvent) => {
                        if (
                          keyboardEvent.key === 'Enter' ||
                          keyboardEvent.key === ' '
                        ) {
                          keyboardEvent.preventDefault()
                          openPreview(event)
                        }
                      }}
                      className="w-full shrink-0 bg-white transition focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      <div className="relative h-52 bg-slate-200 sm:h-64">
                        {hasUsableImage(event.image) ? (
                          <img
                            src={event.image ?? ''}
                            alt=""
                            onError={() => markImageFailed(event.image)}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,#dbeafe_0%,#f8fafc_55%,#fde68a_100%)]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                        <span
                          aria-hidden="true"
                          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
                        >
                          <span className="text-lg leading-none">+</span>
                        </span>
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-sky-800">
                              {event.category}
                            </span>
                            <span className="max-w-full rounded-full bg-white/90 px-3 py-1 text-xs text-slate-700">
                              {event.location}
                            </span>
                          </div>
                          <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                            {event.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">
                            {event.sourceName}
                          </span>
                          <span className="text-sm font-medium text-slate-500">
                            {event.dateLabel}
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {event.summary}
                        </p>
                        <p className="mt-5 text-sm font-medium text-slate-900">
                          Tap anywhere to open
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 self-start">
                  {events.map((event, index) => (
                    <button
                      key={`${event.title}-dot`}
                      type="button"
                      aria-label={`Go to slide ${index + 1}`}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2.5 rounded-full transition ${
                        index === currentIndex
                          ? 'w-8 bg-slate-900'
                          : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button
                    type="button"
                    onClick={showPrevious}
                    className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white sm:flex-none"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="flex-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 sm:flex-none"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 sm:mt-8 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Event list</h2>

            <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
              <label
                htmlFor="event-source-filter"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
              >
                Filter
              </label>

              <div className="relative w-full sm:w-auto">
                <select
                  id="event-source-filter"
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  suppressHydrationWarning
                  className="w-full appearance-none rounded-full border border-slate-300 bg-white px-4 py-2 pr-12 text-sm text-slate-700 outline-none transition focus:border-sky-400"
                >
                  {sourceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All sources' : option}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  v
                </span>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                  suppressHydrationWarning
                  className="w-full appearance-none rounded-full border border-slate-300 bg-white px-4 py-2 pr-12 text-sm text-slate-700 outline-none transition focus:border-sky-400"
                >
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All locations' : option}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  v
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-600">
                No events match that filter right now.
              </div>
            ) : (
              filteredEvents.map((event) => (
                <button
                  key={`${event.link}-list`}
                  type="button"
                  onClick={() => openPreview(event)}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50/50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-800">
                        {event.sourceName}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-700">
                        {event.location}
                      </span>
                    </div>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full bg-white text-base text-slate-900 shadow-sm sm:self-auto">
                      +
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-semibold text-slate-950">
                    {event.title}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">{event.dateLabel}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </MagicCard>

      {preview.status !== 'idle' ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-4 backdrop-blur-sm md:items-center md:justify-center"
          role="presentation"
          onClick={closePreview}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-preview-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Event preview
                </p>
                <h3
                  id="event-preview-title"
                  className="mt-2 text-xl font-semibold text-slate-950"
                >
                  {preview.event?.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={closePreview}
                className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {preview.status === 'loading' ? (
              <div className="px-6 py-10">
                <div className="h-56 animate-pulse rounded-[1.5rem] bg-slate-100" />
                <div className="mt-6 h-4 w-28 animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-4 w-11/12 animate-pulse rounded bg-slate-100" />
              </div>
            ) : null}

            {preview.status === 'error' ? (
              <div className="px-6 py-8">
                <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                  {preview.error}
                </div>
                <a
                  href={preview.event.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Open source page
                </a>
              </div>
            ) : null}

            {preview.status === 'ready' ? (
              <div className="px-6 py-6">
                {hasUsableImage(preview.details.image) ? (
                  <img
                    src={preview.details.image ?? ''}
                    alt=""
                    onError={() => markImageFailed(preview.details.image)}
                    className="h-64 w-full rounded-[1.75rem] bg-slate-100 object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-end rounded-[1.75rem] bg-[linear-gradient(135deg,#dbeafe_0%,#f8fafc_55%,#fde68a_100%)] p-6">
                    <div className="max-w-lg">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                        {preview.details.category}
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-slate-950">
                        {preview.event?.title}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {preview.details.category}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    {preview.details.venue}
                  </span>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {preview.details.dateLabel}
                </p>

                <p className="mt-4 text-base leading-7 text-slate-700">
                  {preview.details.summary}
                </p>

                {preview.details.address ? (
                  <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Address
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {preview.details.address}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={preview.details.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Open event page
                  </a>

                  {preview.details.sourceUrl !== preview.details.bookingUrl ? (
                    <a
                      href={preview.details.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Open source listing
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}

function hasError(
  payload: EventPreview | { error?: string },
): payload is { error?: string } {
  return 'error' in payload
}

function supportsRemotePreview(value: string) {
  try {
    const url = new URL(value)

    return new Set([
      'welcometofife.com',
      'www.welcometofife.com',
      'whatsonfife.co.uk',
      'www.whatsonfife.co.uk',
    ]).has(url.hostname)
  } catch {
    return false
  }
}

function createFallbackPreview(event: LocalEvent): EventPreview {
  return {
    title: event.title,
    summary: event.summary,
    image: event.image,
    venue: event.location,
    address: null,
    dateLabel: event.dateLabel,
    category: event.category,
    sourceUrl: event.link,
    bookingUrl: event.link,
  }
}

function getTownLabel(location: string) {
  const normalized = location.trim()

  const commaParts = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (commaParts.length > 1) {
    return commaParts[commaParts.length - 1]
  }

  const separatorParts = normalized
    .split(/ · | - /)
    .map((part) => part.trim())
    .filter(Boolean)

  if (separatorParts.length > 1) {
    return separatorParts[separatorParts.length - 1]
  }

  return normalized
}
