// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Server-rendered Astro. The standalone Node adapter runs as a plain
// container on the FA app platform.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  security: {
    // TLS terminates at the platform's proxy, so this process is reached over
    // plain http with the real hostname in a forwarded header. Without these
    // entries Astro distrusts that header and `Astro.url` falls back to
    // localhost — which would send the login redirect's return address to
    // localhost instead of the app. Add a domain here before serving from it.
    allowedDomains: [
      { hostname: '**.journalistboost.ai', protocol: 'https' },
      { hostname: '**.finansavisen.no', protocol: 'https' },
    ],
  },
  server: { host: true, port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
