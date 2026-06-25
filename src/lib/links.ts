/** Normalize the loosely-formatted link fields from the identity endpoint. */

function clean(s: string | null | undefined): string | null {
  const v = s?.trim();
  return v ? v : null;
}

/** Website: prepend https:// if no scheme is present. */
export function websiteUrl(raw: string | null | undefined): string | null {
  const v = clean(raw);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** GitHub repo: pass through if it's already a URL. */
export function githubUrl(raw: string | null | undefined): string | null {
  const v = clean(raw);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://github.com/${v}`;
}

/** Discord: full URL passes through; otherwise treat as an invite code. */
export function discordUrl(raw: string | null | undefined): string | null {
  const v = clean(raw);
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://discord.gg/${v.replace(/^discord\.gg\//i, "")}`;
}

/** Twitter/X: strip a leading @ and build an x.com URL. */
export function twitterUrl(raw: string | null | undefined): string | null {
  const v = clean(raw);
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://x.com/${v.replace(/^@/, "")}`;
}

/** mailto: link for a contact email (only if it looks like an email). */
export function mailto(raw: string | null | undefined): string | null {
  const v = clean(raw);
  if (!v || !v.includes("@") || v.includes(" ")) return null;
  return `mailto:${v}`;
}
