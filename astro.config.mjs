// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Server-rendered Astro behind the Zephr CDN.
// The standalone Node adapter matches the Profico OKD deploy target.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { host: true, port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
