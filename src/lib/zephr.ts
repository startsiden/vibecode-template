/**
 * Local Zephr simulation — ported from hegnar-web's
 * `src/server/middleware/hNunjucks.ts` (simulateEsi filter) and
 * `src/server/config/ZephrComponents/ZephrComponentsConfiguration.ts`.
 *
 * In production, the Zephr CDN replaces <!-- ZEPHR_FEATURE … --> comment
 * pairs with real component HTML at the edge. Locally there is no CDN,
 * so this module fetches the real component HTML directly from the
 * production zephr-components host and splices it in.
 *
 * Only active when SIMULATE_ZEPHR=true. No-op otherwise.
 */

const ZEPHR_URL =
  process.env.ZEPHR_COMPONENTS_URL ??
  'https://prod-zephr-components.finansavisen.no';

const FEATURE_TO_COMPONENT: Record<string, string> = {
  'finansavisen-header': 'header',
  'finansavisen-footer': 'footer',
};

// Default Zephr template variables for local dev — matches hegnar-web's
// simulateEsi defaults. Real values are filled by Zephr in production.
const DEFAULT_VARS: Record<string, Record<string, string>> = {
  header: {
    pagetype: 'other',
    'registration-title': 'Logg inn',
    'registration-text': 'Fyll inn dine opplysninger under for å logge inn.',
    'blaize.user.first-name': 'Jane',
    'blaize.user.last-name': 'Doe',
    'blaize.user.email': 'jane.doe@finansavisen.no',
    'access-level': 'registered',
  },
  footer: {},
};

const cache = new Map<string, string>();

async function fetchComponent(name: string): Promise<string | null> {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(`${ZEPHR_URL}/${name}.html`);
    if (!res.ok) {
      console.warn(`[zephr] ${name}: HTTP ${res.status}`);
      return null;
    }
    let html = await res.text();
    // Component HTML references /static/* — rewrite to absolute prod URLs
    html = html.replace(/="\/static/g, `="${ZEPHR_URL}/static`);
    // The downloaded file is a full document; strip head + meta for body injection
    html = html.replace(/<head>([\s\S]*?)<\/head>/, '$1');
    html = html.replace(/<meta[^>]*>/g, '');
    cache.set(name, html);
    return html;
  } catch (err) {
    console.warn(`[zephr] failed to fetch ${name}:`, err);
    return null;
  }
}

function fillTemplateVars(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) =>
      acc.replace(
        new RegExp(`\\{\\{\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g'),
        val,
      ),
    html,
  );
}

const FEATURE_PATTERN =
  /<!--\s*ZEPHR_FEATURE\s+([\w-]+)\s*-->([\s\S]*?)<!--\s*ZEPHR_FEATURE_END\s+\1\s*-->/g;

export async function simulateZephr(html: string): Promise<string> {
  const matches = [...html.matchAll(FEATURE_PATTERN)];
  if (matches.length === 0) return html;

  const replacements = await Promise.all(
    matches.map(async (m) => {
      const [full, featureId] = m;
      const componentName = FEATURE_TO_COMPONENT[featureId];
      if (!componentName) return { full, replacement: full };
      const body = await fetchComponent(componentName);
      if (!body) return { full, replacement: full };
      const filled = fillTemplateVars(body, DEFAULT_VARS[componentName] ?? {});
      return {
        full,
        replacement: `<!-- ZEPHR_FEATURE ${featureId} -->${filled}<!-- ZEPHR_FEATURE_END ${featureId} -->`,
      };
    }),
  );

  let result = html;
  for (const { full, replacement } of replacements) {
    if (full !== replacement) result = result.replace(full, replacement);
  }
  return result;
}

export function isZephrSimulationEnabled(): boolean {
  return process.env.SIMULATE_ZEPHR === 'true';
}
