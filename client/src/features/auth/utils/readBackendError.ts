export async function readBackendError(
  response: Response,
  fallback = "Request failed.",
): Promise<string> {
  const text = await response.text().catch(() => "");
  if (!text) return response.statusText || fallback;
  try {
    const parsed = JSON.parse(text) as { message?: string | string[]; error?: string };
    if (Array.isArray(parsed.message)) return parsed.message.join(", ");
    if (typeof parsed.message === "string") return parsed.message;
    if (typeof parsed.error === "string") return parsed.error;
  } catch {
    return text;
  }
  return response.statusText || fallback;
}
