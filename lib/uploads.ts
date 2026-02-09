const LOCAL_UPLOADS_BASE = 'http://localhost:4457'

function stripTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function getUploadsBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_URLBASE_UPLOAD
  if (explicit && explicit.trim()) {
    return stripTrailingSlash(explicit.trim())
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (apiUrl && apiUrl.trim()) {
    const normalized = apiUrl.trim().replace(/\/api\/?$/, '')
    return stripTrailingSlash(normalized)
  }

  return LOCAL_UPLOADS_BASE
}

export function withUploadsBase(path?: string | null) {
  if (!path) return undefined
  if (path.startsWith('http')) return path
  const base = getUploadsBaseUrl()
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}
