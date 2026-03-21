import { EventsPanel } from '@/components/events-panel'
import { SmartSearch } from '@/components/smart-search'
import { getFifeEvents } from '@/lib/fife-events'

export const dynamic = 'force-dynamic'

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { events, warning } = await getFifeEvents()
  const { q } = await searchParams

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f8fafc_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Fife family planner
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            Family days out in Fife
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Search first, then browse a simple feed of live family-friendly
            events and a few local backup ideas.
          </p>
        </section>

        <section className="mt-8">
          <EventsPanel
            events={events}
            warning={warning}
            searchSlot={
              <SmartSearch
                events={events}
                initialQuery={q ?? ''}
                mode="interactive"
                browseHref="/planner"
                includePlaces={false}
              />
            }
          />
        </section>
      </div>
    </main>
  )
}
