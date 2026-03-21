export type SavedEvent = {
  id: string
  name: string
  town: string
  date: string
  time: string
  location: string
  note: string
  image?: string
  sourceUrl: string
}

export const savedEvents: SavedEvent[] = [
  {
    id: 'facebook-1223760206635671',
    name: 'Benarty Gala',
    town: 'Lochgelly',
    date: '2026-06-28',
    time: 'From 10:30',
    location: 'Lochore Meadows Country Park',
    note: 'Public gala day with a Tartan Army or football theme. Trail race starts at 10:30, parade starts at 11:00 from Benarty Centre, and the main gala runs from 12 noon at Lochore Meadows with dance groups, bands, kids races, face painting, rides, inflatables, stalls, and a tea tent.',
    image: '/events/benarty-gala.jpg',
    sourceUrl: 'https://www.facebook.com/events/1223760206635671',
  },
  {
    id: 'facebook-rosyth-gala-2026',
    name: 'Rosyth Gala',
    town: 'Dunfermline',
    date: '2026-05-30',
    time: '11:30',
    location: 'Rosyth Public Park',
    note: 'Public gala day with a parade starting at the Harley Street entrance at 11:30 and a full day of family fun in the park.',
    sourceUrl: 'https://www.facebook.com/events/787705447588850/?active_tab=discussion',
  },
]
