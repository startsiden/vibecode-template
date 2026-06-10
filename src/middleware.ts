import { defineMiddleware } from 'astro:middleware';
import { isZephrSimulationEnabled, simulateZephr } from './lib/zephr';

/**
 * Astro middleware that mirrors hegnar-web's ESI-simulation step for
 * local development. In production the Zephr CDN handles ZEPHR_FEATURE
 * comment markers at the edge, so this middleware is a no-op.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
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
