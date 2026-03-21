import type { SavedEvent } from '@/data/events'

const NOTION_API_VERSION = '2022-06-28'

export async function getNotionEvents(): Promise<SavedEvent[] | null> {
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!token || !databaseId) {
    return null
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Notion-Version': NOTION_API_VERSION,
        },
        body: JSON.stringify({
          sorts: [{ property: 'Date', direction: 'ascending' }],
        }),
      },
    )

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as { results?: unknown[] }
    const results = Array.isArray(payload.results) ? payload.results : []

    return results
      .map((page) => toSavedEvent(page))
      .filter((event): event is SavedEvent => event !== null)
  } catch {
    return null
  }
}

function toSavedEvent(page: unknown): SavedEvent | null {
  const properties = getProperties(page)
  if (!properties) return null

  if (!isPublished(properties)) {
    return null
  }

  const name = getTitleValue(properties, ['Name', 'Title', 'Event'])
  const category =
    getSelectValue(properties, ['Category']) ||
    getRichTextValue(properties, ['Category']) ||
    inferCategory(name)
  const town = getRichTextValue(properties, ['Town'])
  const date = getDateValue(properties, ['Date'])
  const time = getRichTextValue(properties, ['Time'])
  const location = getRichTextValue(properties, ['Location'])
  const note = getRichTextValue(properties, ['Note', 'Summary', 'Description'])
  const sourceUrl = getUrlValue(properties, ['Source URL', 'Source', 'URL'])

  if (!name || !town || !date || !location || !note || !sourceUrl) {
    return null
  }

  return {
    id: getPageId(page) ?? slugify(`${name}-${date}`),
    name,
    category,
    town,
    date,
    time: time || 'Time to be confirmed',
    location,
    note,
    image: getImageValue(properties, ['Image']),
    sourceUrl,
  }
}

function getProperties(value: unknown) {
  if (!value || typeof value !== 'object' || !('properties' in value)) {
    return null
  }

  const properties = (value as { properties?: unknown }).properties
  if (!properties || typeof properties !== 'object') {
    return null
  }

  return properties as Record<string, unknown>
}

function getPageId(value: unknown) {
  if (!value || typeof value !== 'object' || !('id' in value)) {
    return null
  }

  const id = (value as { id?: unknown }).id
  return typeof id === 'string' && id ? id : null
}

function isPublished(properties: Record<string, unknown>) {
  const property = getProperty(properties, ['Published'])
  if (!property || typeof property !== 'object') {
    return true
  }

  if (!('type' in property) || (property as { type?: unknown }).type !== 'checkbox') {
    return true
  }

  return (property as { checkbox?: unknown }).checkbox === true
}

function getTitleValue(
  properties: Record<string, unknown>,
  names: string[],
) {
  const property = getProperty(properties, names)
  if (!property || typeof property !== 'object') return ''
  const items = (property as { title?: unknown }).title
  return getPlainText(items)
}

function getRichTextValue(
  properties: Record<string, unknown>,
  names: string[],
) {
  const property = getProperty(properties, names)
  if (!property || typeof property !== 'object') return ''

  const typedProperty = property as {
    rich_text?: unknown
    type?: unknown
    url?: unknown
  }

  if (typedProperty.type === 'url' && typeof typedProperty.url === 'string') {
    return typedProperty.url
  }

  return getPlainText(typedProperty.rich_text)
}

function getSelectValue(
  properties: Record<string, unknown>,
  names: string[],
) {
  const property = getProperty(properties, names)
  if (!property || typeof property !== 'object') return ''

  const select = (property as { select?: { name?: unknown } }).select?.name
  return typeof select === 'string' ? select : ''
}

function getDateValue(
  properties: Record<string, unknown>,
  names: string[],
) {
  const property = getProperty(properties, names)
  if (!property || typeof property !== 'object') return ''

  const date = (property as { date?: { start?: unknown } }).date?.start
  return typeof date === 'string' ? date.slice(0, 10) : ''
}

function getUrlValue(
  properties: Record<string, unknown>,
  names: string[],
) {
  const property = getProperty(properties, names)
  if (!property || typeof property !== 'object') return ''

  const url = (property as { url?: unknown }).url
  return typeof url === 'string' ? url : ''
}

function getImageValue(
  properties: Record<string, unknown>,
  names: string[],
) {
  const property = getProperty(properties, names)
  if (!property || typeof property !== 'object') return undefined

  const files = (property as { files?: unknown }).files
  if (!Array.isArray(files) || files.length === 0) return undefined

  const firstFile = files[0]
  if (!firstFile || typeof firstFile !== 'object') return undefined

  const fileUrl = (firstFile as { file?: { url?: unknown } }).file?.url
  if (typeof fileUrl === 'string') return fileUrl

  const externalUrl =
    (firstFile as { external?: { url?: unknown } }).external?.url
  return typeof externalUrl === 'string' ? externalUrl : undefined
}

function getProperty(
  properties: Record<string, unknown>,
  names: string[],
) {
  for (const name of names) {
    if (name in properties) {
      return properties[name]
    }
  }

  return null
}

function getPlainText(value: unknown) {
  if (!Array.isArray(value)) {
    return ''
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const text = (item as { plain_text?: unknown }).plain_text
      return typeof text === 'string' ? text : ''
    })
    .join('')
    .trim()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function inferCategory(name: string) {
  return name.toLowerCase().includes('gala') ? 'Gala' : 'Event'
}
