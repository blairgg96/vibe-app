'use client'

import { useEffect, useMemo, useState } from 'react'
import { places } from '@/data/places'

type PlannerFilters = {
  indoorOnly?: boolean
  freeOnly?: boolean
  toddlerOnly?: boolean
  dogOnly?: boolean
}

export function PlaceFinder() {
  const [indoorOnly, setIndoorOnly] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [toddlerOnly, setToddlerOnly] = useState(false)
  const [dogOnly, setDogOnly] = useState(false)
  const [highlightedPlaceId, setHighlightedPlaceId] = useState<number | null>(
    null,
  )

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (indoorOnly && !place.indoor) return false
      if (freeOnly && !place.free) return false
      if (toddlerOnly && !place.toddlerFriendly) return false
      if (dogOnly && !place.dogFriendly) return false
      return true
    })
  }, [indoorOnly, freeOnly, toddlerOnly, dogOnly])

  useEffect(() => {
    function handleFocusPlace(event: Event) {
      const customEvent = event as CustomEvent<{
        placeId?: number
        filters?: PlannerFilters
      }>

      const filters = customEvent.detail?.filters
      if (filters) {
        setIndoorOnly(Boolean(filters.indoorOnly))
        setFreeOnly(Boolean(filters.freeOnly))
        setToddlerOnly(Boolean(filters.toddlerOnly))
        setDogOnly(Boolean(filters.dogOnly))
      }

      const placeId = customEvent.detail?.placeId
      if (!placeId) return

      setHighlightedPlaceId(placeId)

      window.setTimeout(() => {
        document
          .getElementById(`place-${placeId}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)

      window.setTimeout(() => {
        setHighlightedPlaceId((current) => (current === placeId ? null : current))
      }, 2500)
    }

    window.addEventListener('planner:focus-place', handleFocusPlace as EventListener)

    return () => {
      window.removeEventListener(
        'planner:focus-place',
        handleFocusPlace as EventListener,
      )
    }
  }, [])

  return (
    <section
      id="place-finder"
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Places to try</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pick what matters today and get a few simple local ideas.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
          Backup plan finder
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-950">Filters</h3>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setIndoorOnly(!indoorOnly)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              indoorOnly
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            }`}
          >
            Indoor only
          </button>

          <button
            onClick={() => setFreeOnly(!freeOnly)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              freeOnly
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            }`}
          >
            Free only
          </button>

          <button
            onClick={() => setToddlerOnly(!toddlerOnly)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              toddlerOnly
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            }`}
          >
            Toddler-friendly
          </button>

          <button
            onClick={() => setDogOnly(!dogOnly)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              dogOnly
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            }`}
          >
            Dog-friendly
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-950">
          Results ({filteredPlaces.length})
        </h3>

        <div className="mt-4 grid gap-4">
          {filteredPlaces.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 p-5 text-slate-600">
              No matches found. Try removing a filter.
            </div>
          ) : (
            filteredPlaces.map((place) => (
              <article
                id={`place-${place.id}`}
                key={place.id}
                className={`rounded-[1.5rem] border p-5 shadow-sm transition ${
                  highlightedPlaceId === place.id
                    ? 'border-sky-300 bg-sky-50/60 shadow-[0_10px_30px_rgba(14,165,233,0.12)]'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xl font-semibold text-slate-950">
                    {place.name}
                  </h4>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {place.town}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {place.area}
                  </span>
                </div>

                <p className="mt-3 text-slate-600">{place.description}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-blue-50 px-3 py-1">
                    {place.indoor ? 'Indoor' : 'Outdoor'}
                  </span>
                  <span className="rounded-full bg-green-50 px-3 py-1">
                    {place.free ? 'Free' : 'Paid'}
                  </span>
                  {place.toddlerFriendly ? (
                    <span className="rounded-full bg-pink-50 px-3 py-1">
                      Toddler-friendly
                    </span>
                  ) : null}
                  {place.dogFriendly ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1">
                      Dog-friendly
                    </span>
                  ) : null}
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {place.duration}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
