const normalizeApiBaseUrl = (url) => {
  const trimmedUrl = url.replace(/\/+$/, '')
  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || '/api')
const LOCAL_API_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):8000\/api/
const originalFetch = window.fetch.bind(window)

window.fetch = (resource, options) => {
  if (typeof resource === 'string') {
    return originalFetch(resource.replace(LOCAL_API_PATTERN, API_BASE_URL), options)
  }

  if (resource instanceof Request && LOCAL_API_PATTERN.test(resource.url)) {
    const rewrittenRequest = new Request(
      resource.url.replace(LOCAL_API_PATTERN, API_BASE_URL),
      resource
    )
    return originalFetch(rewrittenRequest, options)
  }

  return originalFetch(resource, options)
}
