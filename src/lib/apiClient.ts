/**
 * Resilient API Fetch Client
 * Handles automatic backend port detection (Port 3000 / 5000 / relative Vite proxy)
 * and formats human-friendly error messages when network drops occur.
 */

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const baseCandidates = isAbsolute
    ? [endpoint]
    : [
        endpoint,
        `http://localhost:3000${endpoint}`,
        `http://127.0.0.1:3000${endpoint}`,
        `http://localhost:5000${endpoint}`,
        `http://127.0.0.1:5000${endpoint}`,
      ];

  let lastError: Error | null = null;

  for (const targetUrl of baseCandidates) {
    try {
      const res = await fetch(targetUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      return res;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error('Backend server unavailable. Please check internet connection or server status.');
}
