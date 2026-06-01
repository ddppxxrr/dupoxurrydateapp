export function resolveProxyUrl(url: string | undefined): string {
  if (!url) return '';
  return url.replace(/https?:\/\/pub-[a-zA-Z0-9-]+\.r2\.dev\//, '/api/media/');
}
