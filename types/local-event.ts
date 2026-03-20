export type LocalEvent = {
  title: string
  dateLabel: string
  category: string
  location: string
  summary: string
  image: string | null
  link: string
  sourceName: string
}

export type EventPreview = {
  title: string
  summary: string
  image: string | null
  venue: string
  address: string | null
  dateLabel: string
  category: string
  sourceUrl: string
  bookingUrl: string
}
