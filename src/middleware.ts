import { defineMiddleware, sequence } from 'astro:middleware';
import { getJbUser, isAuthDisabled, jbLoginUrl } from './lib/auth';
import { isZephrSimulationEnabled, simulateZephr } from './lib/zephr';

/**
 * Login. Everyone reaching this app must be signed into JournalistBoost.
 *
 * Do not delete this unless the journalist explicitly wants the app readable
 * by anyone with the link. Do not replace it with your own login — see
 * AGENTS.md, "Who's logged in".
 */
const requireLogin = defineMiddleware(async (context, next) => {
  if (isAuthDisabled()) return next();

  // Framework assets and the favicon carry nothing private, and gating them
  // would mean a JB round-trip per file instead of per page.
  const { pathname } = context.url;
  if (pathname.startsWith('/_') || pathname.startsWith('/favicon')) return next();

  const user = await getJbUser(context.request.headers.get('cookie'));

  if (!user) {
    // API routes get a status code; pages get sent to JB to log in.
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Not logged in' }), {
        status: 401,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }
    return new Response(null, {
      status: 302,
      headers: { location: jbLoginUrl(context.url), 'cache-control': 'no-store' },
    });
  }

  // Pages can read this: `const user = Astro.locals.user`
  context.locals.user = user;

  const response = await next();
  // This response depended on who asked. A shared cache must never replay it.
  response.headers.set('cache-control', 'no-store');
  return response;
});

/**
 * Astro middleware that mirrors hegnar-web's ESI-simulation step for
 * local development. In production the Zephr CDN handles ZEPHR_FEATURE
 * comment markers at the edge, so this middleware is a no-op.
 */
const zephrSimulation = defineMiddleware(async (_context, next) => {
  const response = await next();

  if (!isZephrSimulationEnabled()) return response;

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const transformed = await simulateZephr(html);

  return new Response(transformed, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});

export const onRequest = sequence(requireLogin, zephrSimulation);
