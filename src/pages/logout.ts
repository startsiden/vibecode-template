import type { APIRoute } from 'astro';
import { authMode } from '../lib/auth';

const JB_URL = (process.env.JB_URL ?? 'https://www.journalistboost.ai').replace(/\/$/, '');

/**
 * Log the journalist out of JournalistBoost, from inside this app.
 *
 * JB's logout is `POST /api/auth/logout` and answers with JSON, so a form
 * pointed straight at it leaves the journalist staring at `{"success":true}`.
 * Posting here keeps the form same-origin, relays JB's own Set-Cookie headers,
 * and sends them somewhere real.
 *
 * JB stays the thing that decides what logging out means — this only forwards
 * its instructions to the browser.
 */
export const POST: APIRoute = async ({ request }) => {
  // FA apps have no JB session to end. Zephr gates them at the edge, and
  // logging out of the paywall is not this app's business.
  if (authMode() === 'zephr') return new Response('Not found', { status: 404 });

  const headers = new Headers({
    location: `${JB_URL}/login`,
    'cache-control': 'no-store',
  });

  try {
    const res = await fetch(`${JB_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        'content-type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(5000),
    });
    // Relay JB's clears verbatim. The Domain=.journalistboost.ai one is the
    // cookie that authenticated this request, so clearing it ends the session
    // everywhere it's shared.
    for (const cookie of res.headers.getSetCookie()) {
      headers.append('set-cookie', cookie);
    }
  } catch {
    // JB unreachable. Fall through — the local clear below still logs them out
    // here, which beats a logout button that silently does nothing.
  }

  // Belt and braces: clear the shared cookie ourselves too. Harmless when JB
  // already said the same thing, and the difference between working and
  // failing silently when it didn't.
  headers.append(
    'set-cookie',
    'auth_token=; Path=/; Domain=.journalistboost.ai; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
  );

  return new Response(null, { status: 302, headers });
};
