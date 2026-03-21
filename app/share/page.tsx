import type { Metadata } from 'next'
import EventsPage from '@/app/planner/page'

const shareImage = '/logo.png'

export const metadata: Metadata = {
  title: 'Fife Family Picks',
  description: 'Simple Fife places and live local event ideas in one view.',
  openGraph: {
    title: 'Fife Family Picks',
    description: 'Simple Fife places and live local event ideas in one view.',
    type: 'website',
    images: [
      {
        url: shareImage,
        width: 1024,
        height: 1024,
        alt: 'Fife Family Picks',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fife Family Picks',
    description: 'Simple Fife places and live local event ideas in one view.',
    images: [shareImage],
  },
}

export default EventsPage
