'use client'

import { useMemo, useState } from 'react'
import { places } from '@/data/places'

export default function HomePage() {
  const [indoorOnly, setIndoorOnly] = useState(false)
  const [freeOnly, setFreeOnly] = useState(false)
  const [toddlerOnly, setToddlerOnly] = useState(false)
  const [dogOnly, setDogOnly] = useState(false)

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (indoorOnly && !place.indoor) return false
      if (freeOnly && !place.free) return false
      if (toddlerOnly && !place.toddlerFriendly) return false
      if (dogOnly && !place.dogFriendly) return false
      return true
    })
  }, [indoorOnly, freeOnly, toddlerOnly, dogOnly])

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">What to do in Fife</h1>
        <p className="mt-2 text-base text-slate-600">
          Pick what matters today and get a few simple ideas.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Filters</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setIndoorOnly(!indoorOnly)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                indoorOnly
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              Indoor only
            </button>

            <button
              onClick={() => setFreeOnly(!freeOnly)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                freeOnly
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              Free only
            </button>

            <button
              onClick={() => setToddlerOnly(!toddlerOnly)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                toddlerOnly
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              Toddler-friendly
            </button>

            <button
              onClick={() => setDogOnly(!dogOnly)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                dogOnly
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              Dog-friendly
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold">
            Results ({filteredPlaces.length})
          </h2>

          <div className="mt-4 grid gap-4">
            {filteredPlaces.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-5 text-slate-600">
                No matches found. Try removing a filter.
              </div>
            ) : (
              filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="rounded-2xl border border-slate-200 p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold">{place.name}</h3>
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
                    {place.toddlerFriendly && (
                      <span className="rounded-full bg-pink-50 px-3 py-1">
                        Toddler-friendly
                      </span>
                    )}
                    {place.dogFriendly && (
                      <span className="rounded-full bg-amber-50 px-3 py-1">
                        Dog-friendly
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {place.duration}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
