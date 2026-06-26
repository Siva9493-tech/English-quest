// fetch() wrapper that aborts the request after `timeoutMs` so a hung network
// call can't leave the UI waiting forever. Throws an AbortError on timeout.
export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}
