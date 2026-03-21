export type FacebookEventDraft = {
  id: string
  name: string
  category?: string
  town: string
  date: string
  time: string
  location: string
  note: string
  image?: string
  sourceUrl: string
}

export function createFacebookEventDraft(sourceUrl: string): FacebookEventDraft {
  const normalizedUrl = sourceUrl.trim()

  return {
    id: 'new-event-id',
    name: 'Add event name',
    category: 'Gala',
    town: 'Add town',
    date: '2026-06-01',
    time: '12:00',
    location: 'Add location',
    note: 'Add a short note about the event',
    image: '/events/add-image.jpg',
    sourceUrl: normalizedUrl,
  }
}

export function formatFacebookEventDraft(sourceUrl: string): string {
  const draft = createFacebookEventDraft(sourceUrl)

  return `{
  id: '${draft.id}',
  name: '${draft.name}',
  category: '${draft.category}',
  town: '${draft.town}',
  date: '${draft.date}',
  time: '${draft.time}',
  location: '${draft.location}',
  note: '${draft.note}',
  image: '${draft.image}',
  sourceUrl: '${draft.sourceUrl}',
}`
}
