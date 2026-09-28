const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Decode and return the slug from the current page URL.
 * Strips an optional filename prefix (e.g. 'product-') and .html extension.
 * Returns null if the URL cannot be decoded or yields no slug.
 *
 * @param {string} [filePrefix=''] - Prefix to strip from the decoded filename
 * @returns {string|null}
 */
export function getSlugFromPath(filePrefix = '') {
  try {
    const raw = window.location.pathname.split('/').pop() ?? ''
    const decoded = decodeURIComponent(raw).replace(/\.html$/, '')
    const slug = filePrefix && decoded.startsWith(filePrefix)
      ? decoded.slice(filePrefix.length)
      : decoded
    return slug || null
  } catch {
    return null
  }
}

/**
 * Returns true when slug is a safe URL path segment (latin lowercase, digits, hyphens).
 * @param {string|null} slug
 */
export function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug)
}
