const BASE_URL = import.meta.env.VITE_API_URL || '';

export function resolveProxyUrl(url: string | undefined): string {
  if (!url) return '';
  let finalUrl = url.replace(/https?:\/\/pub-[a-zA-Z0-9-]+\.r2\.dev\//, '/api/media/');
  if (finalUrl.startsWith('/api/')) {
    finalUrl = `${BASE_URL}${finalUrl}`;
  }
  return finalUrl;
}
