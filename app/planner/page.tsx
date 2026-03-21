import { EventsPanel } from '@/components/events-panel'
import { getFifeEvents } from '@/lib/fife-events'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const { events, warning } = await getFifeEvents()

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_38%,#f8fafc_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <EventsPanel events={events} warning={warning} />
      </div>
    </main>
  )
}
