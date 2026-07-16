// CLIENT_URL may hold a comma-separated list — CORS needs every allowed
// origin (custom domain + the Vercel-assigned default URL, etc.), but any
// single redirect link (MoMo, emails, QR codes, Google OAuth callback) needs
// exactly one canonical URL, which is always the first entry in that list.
function parseClientUrls(): string[] {
  return (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function getAllowedOrigins(): string[] {
  return parseClientUrls();
}

export function getClientUrl(): string {
  return parseClientUrls()[0];
}
