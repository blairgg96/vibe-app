import { SmartSearch } from '@/components/smart-search'
import { getFifeEvents } from '@/lib/fife-events'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { events } = await getFifeEvents()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe_0%,rgba(224,242,254,0.55)_24%,transparent_48%),linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f8fafc_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center">
        <section className="w-full rounded-[2.5rem] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
          <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            Fife family planner
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Start with one smart search.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Search family days out, rainy-day plans, free toddler ideas, local
            events, and quick backup places across Fife.
          </p>

          <SmartSearch events={events} mode="navigate" browseHref="/planner" />
        </section>
      </div>
    </main>
  )
}
