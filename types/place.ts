export type Place = {
  id: number
  name: string
  town: string
  area: string
  description: string
  indoor: boolean
  free: boolean
  toddlerFriendly: boolean
  dogFriendly: boolean
  duration: 'quick' | 'half-day' | 'full-day'
}
