import { createHash } from 'node:crypto';

/**
 * Login for apps on the FA app platform.
 *
 * Journalists log into JournalistBoost. JB's session cookie is shared across
 * `*.journalistboost.ai`, so it arrives with requests to this app. We ask JB
 * whether it's a real session — JB stays the only thing that decides.
 *
 * There is nothing to configure and no library to add. Do not build a login
 * page, a user table, or a password field. See AGENTS.md, "Who's logged in".
 *
 * NOTE: this file reads `process.env`, never `import.meta.env`. Vite replaces
 * `import.meta.env.X` with its value at BUILD time, so `AUTH_DISABLED=1` in a
 * developer's .env would be baked into the production image and the app would
 * ship with no login at all. `process.env` is read at runtime, which is what
 * a container needs.
 */

const JB_URL = (process.env.JB_URL ?? 'https://www.journalistboost.ai').replace(/\/$/, '');

/** How long a confirmed session is trusted before re-asking JB. */
const CACHE_TTL_MS = Number(process.env.AUTH_CACHE_TTL_MS ?? 60 * 60 * 1000);

export interface JbUser {
  id: number;
  email: string;
  role: string;
  isActive: number;
}

/**
 * token hash -> { user, checkedAt }.
 *
 * Keyed on the token, which is what makes a long TTL safe: when someone logs
 * out, JB clears the cookie in their browser, so that token is simply never
 * presented again — access ends immediately regardless of TTL. What the TTL
 * delays is an admin blacklisting someone who still holds a live cookie.
 *
 * ponytail: plain Map + sweep. The population is "journalists using this app",
 * i.e. tens. Reach for an LRU only if that stops being true.
 */
const cache = new Map<string, { user: JbUser; checkedAt: number }>();

function sweep() {
  const cutoff = Date.now() - CACHE_TTL_MS;
  for (const [k, v] of cache) if (v.checkedAt <= cutoff) cache.delete(k);
}
setInterval(sweep, CACHE_TTL_MS).unref();

function tokenOf(cookieHeader: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === 'auth_token') return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * Ask JB who this is. Returns null when there's no valid session.
 * Server-side only — never call this from browser code.
 */
export async function getJbUser(cookieHeader: string | null): Promise<JbUser | null> {
  if (!cookieHeader) return null;
  const token = tokenOf(cookieHeader);
  if (!token) return null;

  const key = createHash('sha256').update(token).digest('hex');
  const hit = cache.get(key);
  if (hit && Date.now() - hit.checkedAt < CACHE_TTL_MS) return hit.user;

  try {
    const res = await fetch(`${JB_URL}/api/auth/check-session`, {
      headers: { cookie: `auth_token=${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.valid !== true) return null;

    // Only successes are cached. A rejection must be re-checked every time,
    // so a user who logs in gets in immediately.
    cache.set(key, { user: data.user as JbUser, checkedAt: Date.now() });
    return data.user as JbUser;
  } catch {
    // JB unreachable. Treat as "not logged in" — an app that lets everyone in
    // when the login service is down is not protected at all.
    return null;
  }
}

/** Where to send someone who isn't logged in, so they come back here afterwards. */
export function jbLoginUrl(returnTo: URL): string {
  // TLS terminates at the platform's proxy, so this process only ever sees
  // http. Sending JB an http:// return address would bounce the journalist
  // through an extra redirect on the way back.
  const url = new URL(returnTo);
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') url.protocol = 'https:';
  return `${JB_URL}/login?from=${encodeURIComponent(url.toString())}`;
}

/**
 * Which login this app sits behind. Set AUTH_MODE in the environment.
 *
 *  'jb'    — JournalistBoost. The app validates JB's shared session itself.
 *            For JB apps on *.apps.journalistboost.ai. This is the default.
 *  'zephr' — Zephr / the paywall, enforced at the CDN edge before the request
 *            reaches this container. For FA apps served on finansavisen.no.
 *            The app does NO login work: adding a JB check here would reject
 *            every reader, since they have no JournalistBoost session.
 *
 * Getting this wrong locks out exactly the audience the app is for, so it is
 * explicit rather than inferred.
 */
export function authMode(): "jb" | "zephr" {
  return process.env.AUTH_MODE === "zephr" ? "zephr" : "jb";
}

/** Local development: set AUTH_DISABLED=1 in .env to skip the login check. */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === '1' || process.env.AUTH_DISABLED === 'true';
}
