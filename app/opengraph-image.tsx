import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Fife Family Picks'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo.png'))
  const logoDataUri = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background:
            'linear-gradient(180deg, #f8fbff 0%, #ffffff 38%, #f8fafc 100%)',
          color: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '18px',
            maxWidth: '560px',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#0369a1',
            }}
          >
            Fife Family Picks
          </div>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            Family events and days out across Fife
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.35,
              color: '#475569',
            }}
          >
            Simple local picks for things to do with kids, gala days, and easy family plans.
          </div>
        </div>
        <div
          style={{
            width: '420px',
            height: '420px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.86)',
            borderRadius: '36px',
            boxShadow: '0 30px 90px rgba(15,23,42,0.08)',
          }}
        >
          <img
            src={logoDataUri}
            alt="Fife Family Picks logo"
            width="360"
            height="360"
          />
        </div>
      </div>
    ),
    size,
  )
}
